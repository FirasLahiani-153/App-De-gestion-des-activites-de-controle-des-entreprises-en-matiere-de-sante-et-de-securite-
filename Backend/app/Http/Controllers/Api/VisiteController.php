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
    private const TYPES = ['initiale', 'suivi', 'inopinée'];
    private const STATUTS = ['programmée', 'en_cours', 'réalisée', 'reportée', 'annulée'];

    public static function middleware(): array
    {
        return [
            new Middleware('permission:voir-inspections', only: ['index', 'show']),
            new Middleware('permission:creer-inspections', only: ['store']),
            new Middleware('permission:modifier-inspections', only: ['update']),
            new Middleware('permission:supprimer-inspections', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Visite::with(['entreprise:id,raison_sociale', 'inspecteur:id,name']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut'));
        }

        if ($request->filled('entreprise_id')) {
            $query->where('entreprise_id', $request->integer('entreprise_id'));
        }

        if ($request->filled('inspecteur_id')) {
            $query->where('inspecteur_id', $request->integer('inspecteur_id'));
        }

        return $query->orderByDesc('date_prevue')->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'entreprise_id' => 'required|exists:entreprises,id',
            'inspecteur_id' => 'required|exists:users,id',
            'type_visite' => ['required', Rule::in(self::TYPES)],
            'statut' => ['sometimes', Rule::in(self::STATUTS)],
            'date_prevue' => 'required|date',
            'date_realisation' => 'nullable|date',
            'objectif' => 'nullable|string',
        ]);

        $visite = Visite::create($validated);

        return response()->json($visite->load(['entreprise:id,raison_sociale', 'inspecteur:id,name']), 201);
    }

    public function show(string $id)
    {
        return Visite::with(['entreprise', 'inspecteur:id,name,email', 'rapports'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $visite = Visite::findOrFail($id);

        $validated = $request->validate([
            'entreprise_id' => 'sometimes|exists:entreprises,id',
            'inspecteur_id' => 'sometimes|exists:users,id',
            'type_visite' => ['sometimes', Rule::in(self::TYPES)],
            'statut' => ['sometimes', Rule::in(self::STATUTS)],
            'date_prevue' => 'sometimes|date',
            'date_realisation' => 'nullable|date',
            'objectif' => 'nullable|string',
        ]);

        $visite->update($validated);

        return response()->json($visite->fresh()->load(['entreprise:id,raison_sociale', 'inspecteur:id,name']));
    }

    public function destroy(string $id)
    {
        Visite::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}