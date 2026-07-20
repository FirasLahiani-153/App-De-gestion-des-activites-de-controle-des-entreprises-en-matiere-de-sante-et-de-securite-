<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'nom',
        'chemin_fichier',
        'type_mime',
        'taille',
        'version',
        'parent_document_id',
        'is_latest',
        'entreprise_id',
        'visite_id',
        'infraction_id',
        'uploaded_by',
    ];

    protected $casts = [
        'is_latest' => 'boolean',
        'version' => 'integer',
    ];

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class);
    }

    public function visite()
    {
        return $this->belongsTo(Visite::class);
    }

    public function infraction()
    {
        return $this->belongsTo(Infraction::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** The root document of this version chain (null if this IS the root). */
    public function parent()
    {
        return $this->belongsTo(Document::class, 'parent_document_id');
    }

    /** All other versions that share this document's root. */
    public function versions()
    {
        $rootId = $this->parent_document_id ?? $this->id;

        return Document::where('id', $rootId)
            ->orWhere('parent_document_id', $rootId)
            ->orderByDesc('version');
    }
}