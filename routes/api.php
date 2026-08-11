<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\ComplianceEventController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\VaultDocumentController;
use App\Http\Controllers\Api\ShareLogController;
use App\Http\Controllers\Api\TaxFilingController;
use App\Http\Controllers\Api\LegalMatterController;
use App\Http\Controllers\Api\EngagementController;
use App\Http\Controllers\Api\ClientAccessController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ExportRecordController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingsController;

/*
|--------------------------------------------------------------------------
| Authentication Routes (JWT)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('verify-2fa', [AuthController::class, 'verify2FA']);
    Route::post('resend-2fa', [AuthController::class, 'resend2FA']);

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

/*
|--------------------------------------------------------------------------
| Protected Business API Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {
    // System Settings Routes
    Route::get('settings', [SettingsController::class, 'index']);
    Route::post('settings', [SettingsController::class, 'store']);
    Route::post('settings/test-email', [SettingsController::class, 'sendTestEmail']);

    // Profile Management Routes
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::put('profile/password', [ProfileController::class, 'updatePassword']);
    Route::put('profile/notifications', [ProfileController::class, 'updateNotifications']);
    Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::post('profile/2fa', [ProfileController::class, 'toggle2FA']);

    Route::post('users/{user}/2fa', [UserController::class, 'toggle2FA']);
    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('permissions', PermissionController::class)->only(['index']);

    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('compliance-events', ComplianceEventController::class);
    Route::post('reminders/{reminder}/send', [ReminderController::class, 'send']);
    Route::apiResource('reminders', ReminderController::class);
    Route::get('vault-documents/{vaultDocument}/download', [VaultDocumentController::class, 'download']);
    Route::apiResource('vault-documents', VaultDocumentController::class);
    Route::post('share-logs/reply', [ShareLogController::class, 'reply']);
    Route::apiResource('share-logs', ShareLogController::class);
    Route::apiResource('tax-filings', TaxFilingController::class);
    Route::apiResource('legal-matters', LegalMatterController::class);
    Route::apiResource('engagements', EngagementController::class);
    Route::apiResource('client-accesses', ClientAccessController::class);
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('workflows', WorkflowController::class);
    Route::get('invoices/{invoice}/download', [InvoiceController::class, 'download']);
    Route::apiResource('invoices', InvoiceController::class);
    Route::apiResource('export-records', ExportRecordController::class)->only(['index', 'store']);
    Route::get('reports/{report}/export', [ReportController::class, 'export']);
});
