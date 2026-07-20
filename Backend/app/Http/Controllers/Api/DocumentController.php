<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller implements HasMiddleware
{
    /** Keep the allowed file types conservative and explicit. */
    private const ALLOWED_MIMES = 'pdf,doc,docx,jpg,jpeg,png';
    private const MAX_KB = 10240; // 10 MB

    public static function middleware(): array
    {
        return [
            new Middleware('permission:voir-documents', only: ['index', 'show', 'download']),
            new Middleware('permission:creer-documents', only: ['store', 'nouvelleVersion']),
            new Middleware('permission:modifier-documents', only: ['update']),
            new Middleware('permission:supprimer-documents', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Document::with(['entreprise:id,raison_sociale', 'uploader:id,name'])
            ->where('is_latest', true); // hide superseded versions by default

        if ($request->filled('entreprise_id')) {
            $query->where('entreprise_id', $request->integer('entreprise_id'));
        }

        if ($request->filled('infraction_id')) {
            $query->where('infraction_id', $request->integer('infraction_id'));
        }

        return $query->latest()->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'fichier' => 'required|file|mimes:' . self::ALLOWED_MIMES . '|max:' . self::MAX_KB,
            'entreprise_id' => 'required|exists:entreprises,id',
            'visite_id' => 'nullable|exists:visites,id',
            'infraction_id' => 'nullable|exists:infractions,id',
        ]);

        $file = $request->file('fichier');
        // Private disk — files are NOT publicly guessable/accessible; must go through
        // the download() endpoint below (permission-checked). Matches spec 4.7:
        // "Téléchargement sécurisé".
        $path = $file->store('documents', 'local');

        $document = Document::create([
            'nom' => $validated['nom'],
            'chemin_fichier' => $path,
            'type_mime' => $file->getClientMimeType(),
            'taille' => $file->getSize(),
            'entreprise_id' => $validated['entreprise_id'],
            'visite_id' => $validated['visite_id'] ?? null,
            'infraction_id' => $validated['infraction_id'] ?? null,
            'uploaded_by' => $request->user()->id,
            'version' => 1,
            'is_latest' => true,
        ]);

        return response()->json($document->load(['entreprise:id,raison_sociale', 'uploader:id,name']), 201);
    }

    public function show(string $id)
    {
        $document = Document::with(['entreprise:id,raison_sociale', 'uploader:id,name'])->findOrFail($id);
        $document->setRelation('versions', $document->versions()->with('uploader:id,name')->get());

        return $document;
    }

    /**
     * GET /api/documents/{id}/telecharger
     * Streams the actual file. Kept separate from show() so the permission
     * check and audit point stay explicit for the sensitive action (reading file contents).
     */
    public function download(string $id)
    {
        $document = Document::findOrFail($id);

        if (! Storage::disk('local')->exists($document->chemin_fichier)) {
            abort(404, 'Fichier introuvable sur le serveur.');
        }

        return Storage::disk('local')->download($document->chemin_fichier, $document->nom);
    }

    public function update(Request $request, string $id)
    {
        $document = Document::findOrFail($id);

        // Only metadata is editable here — replacing the actual file goes through
        // nouvelleVersion() so the version history stays intact.
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:255',
            'entreprise_id' => 'sometimes|exists:entreprises,id',
            'visite_id' => 'nullable|exists:visites,id',
            'infraction_id' => 'nullable|exists:infractions,id',
        ]);

        $document->update($validated);

        return response()->json($document->fresh()->load(['entreprise:id,raison_sociale', 'uploader:id,name']));
    }

    /**
     * POST /api/documents/{id}/nouvelle-version
     * Uploads a replacement file as a new version, keeping the old one in history.
     */
    public function nouvelleVersion(Request $request, string $id)
    {
        $previous = Document::findOrFail($id);

        $validated = $request->validate([
            'fichier' => 'required|file|mimes:' . self::ALLOWED_MIMES . '|max:' . self::MAX_KB,
        ]);

        $rootId = $previous->parent_document_id ?? $previous->id;
        $maxVersion = Document::where('id', $rootId)->orWhere('parent_document_id', $rootId)->max('version');

        $file = $validated['fichier'];
        $path = $file->store('documents', 'local');

        // Demote every existing version in this chain, then create the new latest one.
        Document::where('id', $rootId)->orWhere('parent_document_id', $rootId)->update(['is_latest' => false]);

        $newVersion = Document::create([
            'nom' => $previous->nom,
            'chemin_fichier' => $path,
            'type_mime' => $file->getClientMimeType(),
            'taille' => $file->getSize(),
            'entreprise_id' => $previous->entreprise_id,
            'visite_id' => $previous->visite_id,
            'infraction_id' => $previous->infraction_id,
            'uploaded_by' => $request->user()->id,
            'version' => $maxVersion + 1,
            'parent_document_id' => $rootId,
            'is_latest' => true,
        ]);

        return response()->json($newVersion->load(['entreprise:id,raison_sociale', 'uploader:id,name']), 201);
    }

    public function destroy(Request $request, string $id)
    {
        $document = Document::findOrFail($id);
        $user = $request->user();

        // admin can delete anything; everyone else with 'supprimer-documents' (inspecteur)
        // can only delete their own uploads.
        if (! $user->hasRole('admin') && $document->uploaded_by !== $user->id) {
            return response()->json([
                'message' => 'Vous ne pouvez supprimer que vos propres documents.',
            ], 403);
        }

        Storage::disk('local')->delete($document->chemin_fichier);

        // If we're deleting the current latest version of a chain, promote the next most recent.
        if ($document->is_latest) {
            $rootId = $document->parent_document_id ?? $document->id;
            $next = Document::where('id', '!=', $document->id)
                ->where(function ($q) use ($rootId) {
                    $q->where('id', $rootId)->orWhere('parent_document_id', $rootId);
                })
                ->orderByDesc('version')
                ->first();
            $next?->update(['is_latest' => true]);
        }

        $document->delete();

        return response()->json(null, 204);
    }
}