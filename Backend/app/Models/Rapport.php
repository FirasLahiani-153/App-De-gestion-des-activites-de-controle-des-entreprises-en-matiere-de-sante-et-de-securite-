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
        'niveau_risque',
        'pdf_path',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'date_redaction' => 'datetime',
        'validated_at' => 'datetime',
    ];

    public function visite()
    {
        return $this->belongsTo(Visite::class);
    }

    public function infractions()
    {
        return $this->hasMany(Infraction::class);
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}