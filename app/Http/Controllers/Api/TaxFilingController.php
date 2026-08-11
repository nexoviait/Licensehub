<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxFiling;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

use App\Models\Company;

class TaxFilingController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $query = TaxFiling::with('company')->orderBy('due_date', 'desc');

            if ($user && $user->hasRole('client')) {
                $companyIds = $this->getAssignedCompanyIds($user);
                $query->whereIn('company_id', $companyIds);
            }

            $filings = $query->get();
            return response()->json(['success' => true, 'data' => $filings]);
        } catch (Throwable $e) {
            Log::error('Tax filing index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load tax filings.'], 500);
        }
    }

    protected function getAssignedCompanyIds($user): array
    {
        if (!$user) return [];
        $userId = $user->id;
        $userEmail = strtolower($user->email ?? '');

        return Company::where(function ($q) use ($userId, $userEmail) {
            $q->whereJsonContains('assigned_user_ids', (int)$userId)
              ->orWhereJsonContains('assigned_user_ids', (string)$userId)
              ->orWhereRaw('LOWER(email) = ?', [$userEmail]);
        })->pluck('id')->toArray();
    }

    public function show(TaxFiling $taxFiling): JsonResponse
    {
        try {
            $taxFiling->load('company');
            return response()->json(['success' => true, 'data' => $taxFiling]);
        } catch (Throwable $e) {
            Log::error('Tax filing show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load tax filing.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'tax_type' => 'required|string|max:150',
                'period' => 'required|string|max:100',
                'amount' => 'required|numeric|min:0',
                'due_date' => 'required|date',
                'status' => 'required|string|max:50',
                'reference' => 'nullable|string|max:100',
            ]);

            if (in_array($validated['status'], ['completed', 'filed']) && empty($validated['reference'])) {
                $validated['reference'] = 'VAT-' . date('Y-m-') . rand(100, 999);
            }

            $filing = TaxFiling::create($validated);
            $filing->load('company');
            return response()->json(['success' => true, 'data' => $filing, 'message' => 'Tax filing recorded successfully'], 201);
        } catch (Throwable $e) {
            Log::error('Tax filing store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create tax filing. Please check your input and try again.'], 500);
        }
    }

    public function update(Request $request, TaxFiling $taxFiling): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'sometimes|required|string|max:50',
                'reference' => 'nullable|string|max:100',
                'amount' => 'sometimes|numeric|min:0',
            ]);

            if (in_array($validated['status'] ?? null, ['completed', 'filed']) && empty($taxFiling->reference)) {
                $validated['reference'] = 'VAT-' . date('Y-m-') . rand(100, 999);
            }

            $taxFiling->update($validated);
            $taxFiling->load('company');
            return response()->json(['success' => true, 'data' => $taxFiling, 'message' => 'Tax filing updated successfully']);
        } catch (Throwable $e) {
            Log::error('Tax filing update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update tax filing. Please check your input and try again.'], 500);
        }
    }

    public function destroy(TaxFiling $taxFiling): JsonResponse
    {
        try {
            $taxFiling->delete();
            return response()->json(['success' => true, 'message' => 'Tax filing deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Tax filing destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete tax filing.'], 500);
        }
    }
}
