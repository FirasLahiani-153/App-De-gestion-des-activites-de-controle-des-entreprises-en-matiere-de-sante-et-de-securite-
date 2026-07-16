<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RapportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return \App\Models\Rapport::with('visite.entreprise')->get();
    }

    public function store(Request $request)
    {
        $rapport = \App\Models\Rapport::create($request->all());
        return response()->json($rapport, 201);
    }

    public function show(string $id)
    {
        return \App\Models\Rapport::with(['visite.entreprise', 'infractions'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $rapport = \App\Models\Rapport::findOrFail($id);
        $rapport->update($request->all());
        return response()->json($rapport);
    }

    public function destroy(string $id)
    {
        \App\Models\Rapport::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
