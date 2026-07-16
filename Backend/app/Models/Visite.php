<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visite extends Model
{
    protected $fillable = [
        'entreprise_id',
        'inspecteur_id',
        'type_visite',
        'statut',
        'date_prevue',
        'date_realisation',
        'objectif',
    ];

    protected $casts = [
        'date_prevue' => 'datetime',
        'date_realisation' => 'datetime',
    ];

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class);
    }

    public function inspecteur()
    {
        return $this->belongsTo(User::class, 'inspecteur_id');
    }

    public function rapports()
    {
        return $this->hasMany(Rapport::class);
    }
}
