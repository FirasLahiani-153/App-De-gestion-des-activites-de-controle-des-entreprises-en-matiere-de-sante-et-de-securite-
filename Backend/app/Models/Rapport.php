<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rapport extends Model
{
    protected $fillable = [
        'visite_id',
        'reference',
        'date_redaction',
        'statut',
        'resume',
        'pdf_path',
    ];

    protected $casts = [
        'date_redaction' => 'datetime',
    ];

    public function visite()
    {
        return $this->belongsTo(Visite::class);
    }

    public function infractions()
    {
        return $this->hasMany(Infraction::class);
    }
}
