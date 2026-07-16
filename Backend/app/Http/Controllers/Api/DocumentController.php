<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return \App\Models\Document::with('entreprise')->get();
    }

    public function store(Request $request)
    {
        $document = \App\Models\Document::create($request->all());
        return response()->json($document, 201);
    }

    public function show(string $id)
    {
        return \App\Models\Document::with(['entreprise', 'uploader'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $document = \App\Models\Document::findOrFail($id);
        $document->update($request->all());
        return response()->json($document);
    }

    public function destroy(string $id)
    {
        \App\Models\Document::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
