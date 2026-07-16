<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EntrepriseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return \App\Models\Entreprise::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'raison_sociale' => 'required|string',
            'matricule_fiscale' => 'required|string|unique:entreprises',
            'secteur_activite' => 'required|string',
        ]);
        $entreprise = \App\Models\Entreprise::create($request->all());
        return response()->json($entreprise, 201);
    }

    public function show(string $id)
    {
        return \App\Models\Entreprise::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $entreprise = \App\Models\Entreprise::findOrFail($id);
        $entreprise->update($request->all());
        return response()->json($entreprise);
    }

    public function destroy(string $id)
    {
        \App\Models\Entreprise::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
