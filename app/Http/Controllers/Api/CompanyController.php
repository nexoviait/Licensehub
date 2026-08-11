<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class CompanyController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $user = auth('api')->user();

            $query = Company::orderBy('name');

            // Scoping for client users: clients only see companies assigned to them
            if ($user && $user->hasRole('client')) {
                $userId = $user->id;
                $userEmail = strtolower($user->email);
                $query->where(function ($q) use ($userId, $userEmail) {
                    $q->whereJsonContains('assigned_user_ids', (int)$userId)
                      ->orWhereJsonContains('assigned_user_ids', (string)$userId)
                      ->orWhereRaw('LOWER(email) = ?', [$userEmail]);
                });
            }

            $companies = $query->get();
            return response()->json(['success' => true, 'data' => $companies]);
        } catch (Throwable $e) {
            Log::error('Company index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load companies.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'entity_type' => 'required|string|max:100',
                'tin' => 'nullable|string|max:50',
                'bin' => 'nullable|string|max:50',
                'rjsc' => 'nullable|string|max:50',
                'address' => 'nullable|string|max:255',
                'email' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:50',
                'directors' => 'nullable|integer|min:1',
                'branches' => 'nullable|integer|min:1',
                'next_due' => 'nullable|date',
                'next_due_label' => 'nullable|string|max:150',
                'status' => 'nullable|in:upcoming,completed,overdue',
                'logo' => 'nullable|string|max:10',
                'assigned_user_ids' => 'nullable|array',
                'assigned_user_ids.*' => 'nullable|integer',
            ]);

            if (empty($validated['logo'])) {
                $words = explode(' ', $validated['name']);
                $validated['logo'] = strtoupper(substr($words[0] ?? 'C', 0, 1) . substr($words[1] ?? 'O', 0, 1));
            }

            $company = Company::create($validated);
            return response()->json(['success' => true, 'data' => $company, 'message' => 'Company created successfully'], 201);
        } catch (Throwable $e) {
            Log::error('Company store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create company. Please check your input and try again.'], 500);
        }
    }

    public function show(Company $company): JsonResponse
    {
        try {
            return response()->json(['success' => true, 'data' => $company]);
        } catch (Throwable $e) {
            Log::error('Company show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load company.'], 500);
        }
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'entity_type' => 'sometimes|required|string|max:100',
                'tin' => 'nullable|string|max:50',
                'bin' => 'nullable|string|max:50',
                'rjsc' => 'nullable|string|max:50',
                'address' => 'nullable|string|max:255',
                'email' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:50',
                'directors' => 'nullable|integer|min:1',
                'branches' => 'nullable|integer|min:1',
                'next_due' => 'nullable|date',
                'next_due_label' => 'nullable|string|max:150',
                'status' => 'nullable|in:upcoming,completed,overdue',
                'logo' => 'nullable|string|max:10',
                'assigned_user_ids' => 'nullable|array',
                'assigned_user_ids.*' => 'nullable|integer',
            ]);

            $company->update($validated);
            return response()->json(['success' => true, 'data' => $company, 'message' => 'Company updated successfully']);
        } catch (Throwable $e) {
            Log::error('Company update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update company. Please check your input and try again.'], 500);
        }
    }

    public function destroy(Company $company): JsonResponse
    {
        try {
            $company->delete();
            return response()->json(['success' => true, 'message' => 'Company deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Company destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete company.'], 500);
        }
    }
}
