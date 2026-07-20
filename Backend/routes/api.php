<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ── Public routes (no token required) ──────────────────────────────────
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->name('login');
    Route::post('register', [AuthController::class, 'register'])->name('register');
});

// ── Protected routes (Sanctum token required) ──────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('logout',          [AuthController::class, 'logout'])->name('logout');
        Route::get('me',               [AuthController::class, 'me'])->name('me');
        Route::post('change-password', [AuthController::class, 'changePassword'])->name('change-password');
    });

    // CRUD API Routes

    Route::get('dashboard', [\App\Http\Controllers\Api\DashboardController::class, 'index'])
    ->name('dashboard');
    Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
    Route::apiResource('entreprises', \App\Http\Controllers\Api\EntrepriseController::class);
    Route::apiResource('visites', \App\Http\Controllers\Api\VisiteController::class);
    Route::apiResource('rapports', \App\Http\Controllers\Api\RapportController::class);
    Route::post('rapports/{rapport}/valider', [\App\Http\Controllers\Api\RapportController::class, 'valider'])
    ->name('rapports.valider');
    Route::apiResource('infractions', \App\Http\Controllers\Api\InfractionController::class);
    Route::apiResource('documents', \App\Http\Controllers\Api\DocumentController::class);
    Route::get('documents/{document}/telecharger', [\App\Http\Controllers\Api\DocumentController::class, 'download'])
    ->name('documents.download');
    Route::post('documents/{document}/nouvelle-version', [\App\Http\Controllers\Api\DocumentController::class, 'nouvelleVersion'])
        ->name('documents.nouvelle-version');
    Route::get('documents/{document}/apercu', [\App\Http\Controllers\Api\DocumentController::class, 'apercu'])
    ->name('documents.apercu');
});
