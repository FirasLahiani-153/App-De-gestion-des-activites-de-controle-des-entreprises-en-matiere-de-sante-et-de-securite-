<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Infraction extends Model
{
    protected $fillable = [
        'rapport_id',
        'entreprise_id',
        'description',
        'recommandation',
        'gravite',
        'date_limite_correction',
        'statut_correction',
        'date_resolution',
        'mise_en_demeure_date',
    ];

    protected $casts = [
        'date_limite_correction' => 'date',
        'date_resolution' => 'date',
        'mise_en_demeure_date' => 'date',
    ];

    public function rapport()
    {
        return $this->belongsTo(Rapport::class);
    }

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}
