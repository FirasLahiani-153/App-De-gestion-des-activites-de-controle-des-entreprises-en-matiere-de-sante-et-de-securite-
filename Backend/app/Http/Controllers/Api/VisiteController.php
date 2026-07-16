<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class VisiteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return \App\Models\Visite::with(['entreprise', 'inspecteur'])->get();
    }

    public function store(Request $request)
    {
        $visite = \App\Models\Visite::create($request->all());
        return response()->json($visite, 201);
    }

    public function show(string $id)
    {
        return \App\Models\Visite::with(['entreprise', 'inspecteur'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $visite = \App\Models\Visite::findOrFail($id);
        $visite->update($request->all());
        return response()->json($visite);
    }

    public function destroy(string $id)
    {
        \App\Models\Visite::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
