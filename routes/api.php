<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExtraController;
use App\Http\Controllers\Api\FilamentController;
use App\Http\Controllers\Api\PrinterController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::patch('printers/{id}/ativar', [PrinterController::class, 'ativar']);
    Route::patch('filaments/{id}/ativar', [FilamentController::class, 'ativar']);
    Route::patch('extras/{id}/ativar', [ExtraController::class, 'ativar']);
    Route::apiResource('printers', PrinterController::class);
    Route::apiResource('filaments', FilamentController::class);
    Route::apiResource('extras', ExtraController::class);
});
