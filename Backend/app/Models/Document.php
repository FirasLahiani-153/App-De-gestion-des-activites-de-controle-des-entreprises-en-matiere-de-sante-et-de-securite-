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
        'entreprise_id',
        'visite_id',
        'infraction_id',
        'uploaded_by',
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
}
