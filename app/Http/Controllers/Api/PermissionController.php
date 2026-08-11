<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Permission;
use Throwable;

class PermissionController extends Controller
{
    /**
     * Display a listing of all permissions.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $permissions = Permission::all();

            return response()->json([
                'status' => 'success',
                'data' => $permissions
            ]);
        } catch (Throwable $e) {
            Log::error('Permission index exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to load permissions.',
            ], 500);
        }
    }
}
