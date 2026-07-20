<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\Infraction;
use App\Models\Rapport;
use App\Models\Visite;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class DashboardController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:voir-tableau-de-bord'),
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $isInspecteurOnly = $user->hasRole('inspecteur') && ! $user->hasAnyRole(['admin', 'responsable']);
        $canValidate = $user->can('valider-rapports');

        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();

        $entrepriseFilter = $request->integer('entreprise_id') ?: null;

        // ---- Visites ----
        $visitesQuery = Visite::query();
        if ($isInspecteurOnly) {
            $visitesQuery->where('inspecteur_id', $user->id);
        }
        if ($entrepriseFilter) {
            $visitesQuery->where('entreprise_id', $entrepriseFilter);
        }

        $visitesParStatut = (clone $visitesQuery)
            ->selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $visitesAujourdhui = (clone $visitesQuery)
            ->whereDate('date_prevue', $today)
            ->with(['entreprise:id,raison_sociale', 'inspecteur:id,name'])
            ->orderBy('date_prevue')
            ->get();

        $visitesSemaine = (clone $visitesQuery)
            ->whereBetween('date_prevue', [$weekStart, $weekEnd])
            ->with(['entreprise:id,raison_sociale', 'inspecteur:id,name'])
            ->orderBy('date_prevue')
            ->get()
            ->groupBy(fn ($v) => Carbon::parse($v->date_prevue)->format('Y-m-d'));

        // ---- Rapports ----
        $rapportsQuery = Rapport::query();
        if ($isInspecteurOnly) {
            $rapportsQuery->whereHas('visite', fn ($q) => $q->where('inspecteur_id', $user->id));
        }
        if ($entrepriseFilter) {
            $rapportsQuery->whereHas('visite', fn ($q) => $q->where('entreprise_id', $entrepriseFilter));
        }

        $rapportsParStatut = (clone $rapportsQuery)
            ->selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $rapportsEnAttente = null;
        if ($canValidate) {
            $rapportsEnAttente = Rapport::where('statut', 'en_attente_validation')
                ->with(['visite.entreprise:id,raison_sociale', 'visite.inspecteur:id,name'])
                ->orderBy('date_redaction')
                ->get();
        }

        // ---- Infractions ----
        $infractionsQuery = Infraction::query();
        if ($isInspecteurOnly) {
            $infractionsQuery->whereHas('rapport.visite', fn ($q) => $q->where('inspecteur_id', $user->id));
        }
        if ($entrepriseFilter) {
            $infractionsQuery->where('entreprise_id', $entrepriseFilter);
        }

        $infractionsParGravite = (clone $infractionsQuery)
            ->selectRaw('gravite, count(*) as total')
            ->groupBy('gravite')
            ->pluck('total', 'gravite');

        $infractionsParStatut = (clone $infractionsQuery)
            ->selectRaw('statut_correction, count(*) as total')
            ->groupBy('statut_correction')
            ->pluck('total', 'statut_correction');

        $infractionsRecidives = (clone $infractionsQuery)->where('is_recidive', true)->count();

        $infractionsEnRetard = (clone $infractionsQuery)
            ->where('statut_correction', '!=', 'corrigée')
            ->whereDate('date_limite_correction', '<', $today)
            ->count();

        // ---- Entreprises (global context only — not personal to an inspecteur) ----
        $entreprises = null;
        $visitesParEntreprise = null;
        if (! $isInspecteurOnly) {
            $entreprises = [
                'total' => Entreprise::count(),
                'actives' => Entreprise::where('is_active', true)->count(),
                'par_risque' => Entreprise::selectRaw('niveau_risque, count(*) as total')
                    ->groupBy('niveau_risque')
                    ->pluck('total', 'niveau_risque'),
            ];

            // Top 10 entreprises by visit count — helps spot which companies get the most attention.
            $visitesParEntreprise = Visite::selectRaw('entreprise_id, count(*) as total')
                ->groupBy('entreprise_id')
                ->orderByDesc('total')
                ->limit(10)
                ->with('entreprise:id,raison_sociale')
                ->get()
                ->map(fn ($row) => [
                    'entreprise_id' => $row->entreprise_id,
                    'raison_sociale' => $row->entreprise?->raison_sociale,
                    'total' => $row->total,
                ]);
        }

        $entrepriseSelectionnee = null;
        if ($entrepriseFilter) {
            $entrepriseSelectionnee = Entreprise::select('id', 'raison_sociale')->find($entrepriseFilter);
        }

        return response()->json([
            'scope' => $isInspecteurOnly ? 'personal' : 'global',
            'entreprise_selectionnee' => $entrepriseSelectionnee,
            'visites' => [
                'total' => (clone $visitesQuery)->count(),
                'par_statut' => $visitesParStatut,
                'aujourdhui' => $visitesAujourdhui,
                'cette_semaine' => $visitesSemaine,
            ],
            'rapports' => [
                'total' => (clone $rapportsQuery)->count(),
                'par_statut' => $rapportsParStatut,
                'en_attente_validation' => $rapportsEnAttente,
            ],
            'infractions' => [
                'total' => (clone $infractionsQuery)->count(),
                'par_gravite' => $infractionsParGravite,
                'par_statut_correction' => $infractionsParStatut,
                'recidives' => $infractionsRecidives,
                'en_retard' => $infractionsEnRetard,
            ],
            'entreprises' => $entreprises,
            'visites_par_entreprise' => $visitesParEntreprise,
        ]);
    }
}