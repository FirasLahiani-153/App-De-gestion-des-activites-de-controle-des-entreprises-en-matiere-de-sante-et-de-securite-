<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visite;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class VisiteController extends Controller implements HasMiddleware
{
    private const STATUTS = ['programmée', 'en_cours', 'réalisée', 'reportée', 'annulée'];
    private const GOUVERNORATS = [
        'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
        'Nabeul', 'Zaghouan', 'Bizerte',
        'Béja', 'Jendouba', 'Le Kef', 'Siliana',
        'Sousse', 'Monastir', 'Mahdia',
        'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
        'Gabès', 'Médenine', 'Tataouine',
        'Gafsa', 'Tozeur', 'Kébili',
    ];

    public static function middleware(): array
    {
        return [
            new Middleware('permission:voir-inspections', only: ['index', 'show', 'types', 'gouvernorats']),
            new Middleware('permission:creer-inspections', only: ['store']),
            new Middleware('permission:modifier-inspections', only: ['update']),
            new Middleware('permission:supprimer-inspections', only: ['destroy']),
        ];
    }

    /**
     * GET /api/visites/types
     * Reference data for the frontend's bilingual type_visite dropdown.
     */
    public function types()
    {
        return response()->json(config('visit_types'));
    }

    /**
     * GET /api/visites/gouvernorats
     * Reference data for the frontend's lieu dropdown.
     */
    public function gouvernorats()
    {
        return response()->json(self::GOUVERNORATS);
    }

    public function index(Request $request)
    {
        $query = Visite::with(['entreprise:id,raison_sociale', 'inspecteur:id,name']);

        // Ownership scoping: an inspecteur only sees their own visits.
        // admin/responsable see everything (they have oversight permissions).
        $user = $request->user();
        if ($user->hasRole('inspecteur') && ! $user->hasAnyRole(['admin', 'responsable'])) {
            $query->where('inspecteur_id', $user->id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut'));
        }

        if ($request->filled('entreprise_id')) {
            $query->where('entreprise_id', $request->integer('entreprise_id'));
        }

        if ($request->filled('lieu')) {
            $query->where('lieu', $request->string('lieu'));
        }

        // Only admin/responsable are allowed to filter by an arbitrary inspecteur;
        // an inspecteur is already scoped to themselves above.
        if ($request->filled('inspecteur_id') && ! $user->hasRole('inspecteur')) {
            $query->where('inspecteur_id', $request->integer('inspecteur_id'));
        }

        return $query->orderByDesc('date_prevue')->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request)
    {
        $rules = [
            'entreprise_id' => 'required|exists:entreprises,id',
            'type_visite' => ['required', Rule::in(array_keys(config('visit_types')))],
            'lieu' => ['nullable', Rule::in(self::GOUVERNORATS)],
            'statut' => ['sometimes', Rule::in(self::STATUTS)],
            'date_prevue' => 'required|date',
            'date_realisation' => 'nullable|date',
            'objectif' => 'nullable|string',
        ];

        $user = $request->user();
        $isInspecteurOnly = $user->hasRole('inspecteur') && ! $user->hasAnyRole(['admin', 'responsable']);

        // Only admin/responsable may assign an arbitrary inspecteur; otherwise it's forced to self.
        if (! $isInspecteurOnly) {
            $rules['inspecteur_id'] = 'required|exists:users,id';
        }

        $validated = $request->validate($rules);

        $validated['inspecteur_id'] = $isInspecteurOnly ? $user->id : $validated['inspecteur_id'];

        $visite = Visite::create($validated);

        return response()->json($visite->load(['entreprise:id,raison_sociale', 'inspecteur:id,name']), 201);
    }

    public function show(Request $request, string $id)
    {
        $visite = Visite::with(['entreprise', 'inspecteur:id,name,email', 'rapports'])->findOrFail($id);

        $user = $request->user();
        if ($user->hasRole('inspecteur') && ! $user->hasAnyRole(['admin', 'responsable']) && $visite->inspecteur_id !== $user->id) {
            abort(403, "Vous n'avez pas accès à cette visite.");
        }

        return $visite;
    }

    public function update(Request $request, string $id)
    {
        $visite = Visite::findOrFail($id);

        $user = $request->user();
        $isInspecteurOnly = $user->hasRole('inspecteur') && ! $user->hasAnyRole(['admin', 'responsable']);

        if ($isInspecteurOnly && $visite->inspecteur_id !== $user->id) {
            abort(403, "Vous ne pouvez modifier que vos propres visites.");
        }

        $rules = [
            'entreprise_id' => 'sometimes|exists:entreprises,id',
            'type_visite' => ['sometimes', Rule::in(array_keys(config('visit_types')))],
            'lieu' => ['sometimes', 'nullable', Rule::in(self::GOUVERNORATS)],
            'statut' => ['sometimes', Rule::in(self::STATUTS)],
            'date_prevue' => 'sometimes|date',
            'date_realisation' => 'nullable|date',
            'objectif' => 'nullable|string',
        ];

        // An inspecteur can't reassign a visit to someone else.
        if (! $isInspecteurOnly) {
            $rules['inspecteur_id'] = 'sometimes|exists:users,id';
        }

        $validated = $request->validate($rules);

        // Postponing a visit isn't just a status flip — it needs a new planned date,
        // otherwise "reportée" carries no useful information for rescheduling.
        if (($validated['statut'] ?? null) === 'reportée' && empty($validated['date_prevue'])) {
            return response()->json([
                'message' => 'Une nouvelle date prévue est requise pour reporter une visite.',
                'errors' => ['date_prevue' => ['Ce champ est obligatoire lorsque le statut est "reportée".']],
            ], 422);
        }

        // Convenience: if marking a visit as done and no completion date was given,
        // record it as "now" so inspectors don't have to fill it in manually.
        if (($validated['statut'] ?? null) === 'réalisée' && empty($validated['date_realisation']) && empty($visite->date_realisation)) {
            $validated['date_realisation'] = now();
        }

        $visite->update($validated);

        return response()->json($visite->fresh()->load(['entreprise:id,raison_sociale', 'inspecteur:id,name']));
    }

    public function destroy(Request $request, string $id)
    {
        $visite = Visite::findOrFail($id);

        $user = $request->user();
        if ($user->hasRole('inspecteur') && ! $user->hasAnyRole(['admin', 'responsable']) && $visite->inspecteur_id !== $user->id) {
            abort(403, "Vous ne pouvez supprimer que vos propres visites.");
        }

        $visite->delete();

        return response()->json(null, 204);
    }
}