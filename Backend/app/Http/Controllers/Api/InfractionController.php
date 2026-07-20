<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Infraction;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class InfractionController extends Controller implements HasMiddleware
{
    private const GRAVITES = ['mineure', 'majeure', 'critique'];
    private const STATUTS_CORRECTION = ['en_attente', 'en_cours', 'corrigée', 'non_corrigée'];

    public static function middleware(): array
    {
        return [
            new Middleware('permission:voir-nonconformites', only: ['index', 'show']),
            new Middleware('permission:creer-nonconformites', only: ['store']),
            new Middleware('permission:modifier-nonconformites', only: ['update']),
            // No 'supprimer-nonconformites' permission exists in the seeder — infractions are
            // audit-relevant records, so deletion is intentionally restricted to admin only
            // rather than inventing a new permission for a destructive action nobody asked for.
            new Middleware('role:admin', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Infraction::with(['entreprise:id,raison_sociale', 'rapport:id,reference']);

        if ($request->filled('gravite')) {
            $query->where('gravite', $request->string('gravite'));
        }

        if ($request->filled('statut_correction')) {
            $query->where('statut_correction', $request->string('statut_correction'));
        }

        if ($request->filled('entreprise_id')) {
            $query->where('entreprise_id', $request->integer('entreprise_id'));
        }

        if ($request->filled('is_recidive')) {
            $query->where('is_recidive', $request->boolean('is_recidive'));
        }

        return $query->latest()->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rapport_id' => 'required|exists:rapports,id',
            'entreprise_id' => 'required|exists:entreprises,id',
            'description' => 'required|string',
            'recommandation' => 'nullable|string',
            'gravite' => ['required', Rule::in(self::GRAVITES)],
            'date_limite_correction' => 'nullable|date',
            'mise_en_demeure_date' => 'nullable|date',
        ]);

        // Récidive detection (cahier des charges 4.5: "Gestion des récidives") —
        // if this entreprise already has any prior infraction, flag this one automatically.
        $validated['is_recidive'] = Infraction::where('entreprise_id', $validated['entreprise_id'])->exists();
        $validated['statut_correction'] = 'en_attente';

        $infraction = Infraction::create($validated);

        return response()->json($infraction->load(['entreprise:id,raison_sociale', 'rapport:id,reference']), 201);
    }

    public function show(string $id)
    {
        return Infraction::with(['entreprise', 'rapport.visite', 'documents'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $infraction = Infraction::findOrFail($id);

        $validated = $request->validate([
            'description' => 'sometimes|string',
            'recommandation' => 'nullable|string',
            'gravite' => ['sometimes', Rule::in(self::GRAVITES)],
            'date_limite_correction' => 'nullable|date',
            'statut_correction' => ['sometimes', Rule::in(self::STATUTS_CORRECTION)],
            'date_resolution' => 'nullable|date',
            'mise_en_demeure_date' => 'nullable|date',
        ]);

        // If the correction is being marked "corrigée" and no resolution date was given, record it now.
        if (($validated['statut_correction'] ?? null) === 'corrigée' && empty($validated['date_resolution'])) {
            $validated['date_resolution'] = now();
        }

        $infraction->update($validated);

        return response()->json($infraction->fresh()->load(['entreprise:id,raison_sociale', 'rapport:id,reference']));
    }

    public function destroy(string $id)
    {
        Infraction::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}