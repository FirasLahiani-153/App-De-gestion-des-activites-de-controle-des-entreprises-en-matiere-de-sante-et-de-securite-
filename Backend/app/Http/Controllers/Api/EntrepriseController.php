<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class EntrepriseController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:voir-entreprises', only: ['index', 'show']),
            new Middleware('permission:creer-entreprises', only: ['store']),
            new Middleware('permission:modifier-entreprises', only: ['update']),
            new Middleware('permission:supprimer-entreprises', only: ['destroy']),
        ];
    }

    /**
     * Display a listing of the resource.
     * Supports basic multi-criteria search (cahier des charges 4.1: "Recherche multicritère").
     */
    public function index(Request $request)
    {
        $query = Entreprise::query();

        if ($request->filled('search')) {
            $term = $request->string('search');
            $query->where(function ($q) use ($term) {
                $q->where('raison_sociale', 'like', "%{$term}%")
                    ->orWhere('matricule_fiscale', 'like', "%{$term}%")
                    ->orWhere('ville', 'like', "%{$term}%");
            });
        }

        if ($request->filled('secteur_activite')) {
            $query->where('secteur_activite', $request->string('secteur_activite'));
        }

        if ($request->filled('niveau_risque')) {
            $query->where('niveau_risque', $request->string('niveau_risque'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->latest()->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'raison_sociale' => 'required|string|max:255',
            'matricule_fiscale' => 'required|string|max:100|unique:entreprises',
            'secteur_activite' => 'required|string|max:255',
            'effectif' => 'nullable|integer|min:0',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'telephone' => 'nullable|string|max:30',
            'email_contact' => 'nullable|email|max:255',
            'nom_contact' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'niveau_risque' => ['sometimes', Rule::in(['faible', 'moyen', 'eleve'])],
        ]);

        $entreprise = Entreprise::create($validated);

        return response()->json($entreprise, 201);
    }

    public function show(string $id)
    {
        return Entreprise::with(['visites', 'infractions'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $entreprise = Entreprise::findOrFail($id);

        $validated = $request->validate([
            'raison_sociale' => 'sometimes|string|max:255',
            'matricule_fiscale' => ['sometimes', 'string', 'max:100', Rule::unique('entreprises')->ignore($entreprise->id)],
            'secteur_activite' => 'sometimes|string|max:255',
            'effectif' => 'nullable|integer|min:0',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'telephone' => 'nullable|string|max:30',
            'email_contact' => 'nullable|email|max:255',
            'nom_contact' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'niveau_risque' => ['sometimes', Rule::in(['faible', 'moyen', 'eleve'])],
        ]);

        $entreprise->update($validated);

        return response()->json($entreprise->fresh());
    }

    public function destroy(string $id)
    {
        Entreprise::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}