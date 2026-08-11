<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalMatter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class LegalMatterController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $matters = LegalMatter::with('company')->orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'data' => $matters]);
        } catch (Throwable $e) {
            Log::error('Legal matter index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load legal matters.'], 500);
        }
    }

    public function show(LegalMatter $legalMatter): JsonResponse
    {
        try {
            $legalMatter->load('company');
            return response()->json(['success' => true, 'data' => $legalMatter]);
        } catch (Throwable $e) {
            Log::error('Legal matter show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load legal matter.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'title' => 'required|string|max:255',
                'matter_type' => 'required|string|max:100',
                'lawyer' => 'required|string|max:150',
                'priority' => 'required|string|max:50',
                'status' => 'required|string|max:50',
                'next_hearing' => 'nullable|string|max:50',
            ]);

            $matter = LegalMatter::create($validated);
            $matter->load('company');
            return response()->json(['success' => true, 'data' => $matter, 'message' => 'Legal matter created successfully'], 201);
        } catch (Throwable $e) {
            Log::error('Legal matter store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create legal matter. Please check your input and try again.'], 500);
        }
    }

    public function update(Request $request, LegalMatter $legalMatter): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'sometimes|required|exists:companies,id',
                'title' => 'sometimes|required|string|max:255',
                'matter_type' => 'sometimes|required|string|max:100',
                'lawyer' => 'sometimes|required|string|max:150',
                'priority' => 'sometimes|required|string|max:50',
                'status' => 'sometimes|required|string|max:50',
                'next_hearing' => 'nullable|string|max:50',
            ]);

            $legalMatter->update($validated);
            $legalMatter->load('company');
            return response()->json(['success' => true, 'data' => $legalMatter, 'message' => 'Legal matter updated successfully']);
        } catch (Throwable $e) {
            Log::error('Legal matter update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update legal matter. Please check your input and try again.'], 500);
        }
    }

    public function destroy(LegalMatter $legalMatter): JsonResponse
    {
        try {
            $legalMatter->delete();
            return response()->json(['success' => true, 'message' => 'Legal matter deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Legal matter destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete legal matter.'], 500);
        }
    }
}
