<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EnergyController;
use App\Http\Controllers\Api\ExtraController;
use App\Http\Controllers\Api\FilamentController;
use App\Http\Controllers\Api\PartController;
use App\Http\Controllers\Api\PrinterController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::patch('printers/{id}/ativar', [PrinterController::class, 'ativar']);
    Route::patch('filaments/{id}/ativar', [FilamentController::class, 'ativar']);
    Route::patch('extras/{id}/ativar', [ExtraController::class, 'ativar']);
    Route::get('energy', [EnergyController::class, 'show']);
    Route::put('energy', [EnergyController::class, 'update']);
    Route::post('energy/refresh', [EnergyController::class, 'refresh']);
    Route::post('parts/preview', [PartController::class, 'preview']);
    Route::post('parts/{id}/recalcular', [PartController::class, 'recalcular']);
    Route::post('parts/{id}/recalcular/aplicar', [PartController::class, 'aplicar']);
    Route::apiResource('parts', PartController::class)->except(['update'])->parameters(['parts' => 'id']);
    Route::put('parts/{id}', [PartController::class, 'update']);
    Route::apiResource('printers', PrinterController::class);
    Route::apiResource('filaments', FilamentController::class);
    Route::apiResource('extras', ExtraController::class);
});
