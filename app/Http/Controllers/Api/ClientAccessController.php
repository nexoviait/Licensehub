<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientAccess;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class ClientAccessController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $accesses = ClientAccess::with('company')->orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'data' => $accesses]);
        } catch (Throwable $e) {
            Log::error('Client access index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load client access records.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'contact_name' => 'required|string|max:150',
                'contact_email' => 'required|email|max:255',
                'role' => 'required|in:Owner,Finance,Viewer',
                'status' => 'nullable|in:active,invited,revoked',
            ]);

            $validated['status'] = $validated['status'] ?? 'invited';
            $validated['last_login'] = 'Never';
            $validated['documents_shared'] = 0;

            $access = ClientAccess::create($validated);
            $access->load('company');
            return response()->json(['success' => true, 'data' => $access, 'message' => 'Client access invitation sent'], 201);
        } catch (Throwable $e) {
            Log::error('Client access store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create client access. Please check your input and try again.'], 500);
        }
    }

    public function show(ClientAccess $clientAccess): JsonResponse
    {
        try {
            $clientAccess->load('company');
            return response()->json(['success' => true, 'data' => $clientAccess]);
        } catch (Throwable $e) {
            Log::error('Client access show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load client access record.'], 500);
        }
    }

    public function update(Request $request, ClientAccess $clientAccess): JsonResponse
    {
        try {
            $validated = $request->validate([
                'role' => 'sometimes|required|in:Owner,Finance,Viewer',
                'status' => 'sometimes|required|in:active,invited,revoked',
            ]);

            $clientAccess->update($validated);
            $clientAccess->load('company');
            return response()->json(['success' => true, 'data' => $clientAccess, 'message' => 'Client access updated']);
        } catch (Throwable $e) {
            Log::error('Client access update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update client access. Please check your input and try again.'], 500);
        }
    }

    public function destroy(ClientAccess $clientAccess): JsonResponse
    {
        try {
            $clientAccess->delete();
            return response()->json(['success' => true, 'message' => 'Client access deleted']);
        } catch (Throwable $e) {
            Log::error('Client access destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete client access.'], 500);
        }
    }
}
