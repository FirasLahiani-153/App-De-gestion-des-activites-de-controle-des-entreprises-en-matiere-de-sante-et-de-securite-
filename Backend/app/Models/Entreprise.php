<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entreprise extends Model
{
    protected $fillable = [
        'raison_sociale',
        'matricule_fiscale',
        'secteur_activite',
        'adresse',
        'ville',
        'code_postal',
        'telephone',
        'email_contact',
        'nom_contact',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function visites()
    {
        return $this->hasMany(Visite::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function infractions()
    {
        return $this->hasMany(Infraction::class);
    }
}
