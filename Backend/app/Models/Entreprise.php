<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entreprise extends Model
{
    protected $fillable = [
        'raison_sociale',
        'matricule_fiscale',
        'secteur_activite',
        'effectif',
        'adresse',
        'ville',
        'code_postal',
        'telephone',
        'email_contact',
        'nom_contact',
        'is_active',
        'niveau_risque',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'effectif' => 'integer',
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