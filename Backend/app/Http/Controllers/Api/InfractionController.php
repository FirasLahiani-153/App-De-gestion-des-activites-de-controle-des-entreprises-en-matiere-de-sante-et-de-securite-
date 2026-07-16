<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InfractionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return \App\Models\Infraction::with('entreprise')->get();
    }

    public function store(Request $request)
    {
        $infraction = \App\Models\Infraction::create($request->all());
        return response()->json($infraction, 201);
    }

    public function show(string $id)
    {
        return \App\Models\Infraction::with(['entreprise', 'rapport'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $infraction = \App\Models\Infraction::findOrFail($id);
        $infraction->update($request->all());
        return response()->json($infraction);
    }

    public function destroy(string $id)
    {
        \App\Models\Infraction::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
