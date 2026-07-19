<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rapport;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class RapportController extends Controller implements HasMiddleware
{
    private const STATUTS = ['brouillon', 'en_attente_validation', 'validé', 'envoyé'];

    public static function middleware(): array
    {
        return [
            new Middleware('permission:voir-rapports', only: ['index', 'show']),
            new Middleware('permission:creer-rapports', only: ['store']),
            new Middleware('permission:modifier-rapports', only: ['update']),
            new Middleware('permission:supprimer-rapports', only: ['destroy']),
            new Middleware('permission:valider-rapports', only: ['valider']),
        ];
    }

    public function index(Request $request)
    {
        $query = Rapport::with(['visite.entreprise:id,raison_sociale', 'validator:id,name']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut'));
        }

        return $query->latest('date_redaction')->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'visite_id' => 'required|exists:visites,id',
            'reference' => 'required|string|max:255|unique:rapports',
            'date_redaction' => 'required|date',
            'statut' => ['sometimes', Rule::in(self::STATUTS)],
            'resume' => 'nullable|string',
        ]);

        // A freshly created report can never start as already validated/sent —
        // that must go through the dedicated valider() action.
        $validated['statut'] = $validated['statut'] ?? 'brouillon';
        if (in_array($validated['statut'], ['validé', 'envoyé'], true)) {
            $validated['statut'] = 'brouillon';
        }

        $rapport = Rapport::create($validated);

        return response()->json($rapport->load('visite.entreprise:id,raison_sociale'), 201);
    }

    public function show(string $id)
    {
        return Rapport::with(['visite.entreprise', 'visite.inspecteur:id,name', 'infractions', 'validator:id,name'])
            ->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $rapport = Rapport::findOrFail($id);

        // Once validated, a report is locked — edits would defeat the point of validation.
        if (in_array($rapport->statut, ['validé', 'envoyé'], true)) {
            return response()->json([
                'message' => 'Ce rapport est déjà validé et ne peut plus être modifié.',
            ], 422);
        }

        $validated = $request->validate([
            'visite_id' => 'sometimes|exists:visites,id',
            'reference' => ['sometimes', 'string', 'max:255', Rule::unique('rapports')->ignore($rapport->id)],
            'date_redaction' => 'sometimes|date',
            'statut' => [
                'sometimes',
                Rule::in(['brouillon', 'en_attente_validation']), // can't self-set validé/envoyé here
            ],
            'resume' => 'nullable|string',
        ]);

        $rapport->update($validated);

        return response()->json($rapport->fresh()->load('visite.entreprise:id,raison_sociale'));
    }

    /**
     * POST /api/rapports/{id}/valider
     *
     * Dedicated endpoint for "validation hiérarchique" (cahier des charges 4.3).
     * Requires the 'valider-rapports' permission (responsable/admin only, per the seeder).
     */
    public function valider(Request $request, string $id)
    {
        $rapport = Rapport::findOrFail($id);

        if ($rapport->statut !== 'en_attente_validation') {
            return response()->json([
                'message' => "Seuls les rapports en attente de validation peuvent être validés (statut actuel : {$rapport->statut}).",
            ], 422);
        }

        $rapport->update([
            'statut' => 'validé',
            'validated_by' => $request->user()->id,
            'validated_at' => now(),
        ]);

        return response()->json($rapport->fresh()->load(['visite.entreprise:id,raison_sociale', 'validator:id,name']));
    }

    public function destroy(string $id)
    {
        $rapport = Rapport::findOrFail($id);

        if (in_array($rapport->statut, ['validé', 'envoyé'], true)) {
            return response()->json([
                'message' => 'Ce rapport est déjà validé et ne peut pas être supprimé.',
            ], 422);
        }

        $rapport->delete();

        return response()->json(null, 204);
    }
}