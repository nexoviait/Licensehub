<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Engagement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class EngagementController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $engagements = Engagement::with('company')->orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'data' => $engagements]);
        } catch (Throwable $e) {
            Log::error('Engagement index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load engagements.'], 500);
        }
    }

    public function show(Engagement $engagement): JsonResponse
    {
        try {
            $engagement->load('company');
            return response()->json(['success' => true, 'data' => $engagement]);
        } catch (Throwable $e) {
            Log::error('Engagement show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load engagement.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'engagement_type' => 'required|string|max:100',
                'accountant' => 'required|string|max:150',
                'fee' => 'required|numeric|min:0',
                'status' => 'required|in:active,on_hold,completed',
                'next_milestone' => 'required|string|max:255',
                'next_milestone_date' => 'required|date',
            ]);

            $engagement = Engagement::create($validated);
            $engagement->load('company');
            return response()->json(['success' => true, 'data' => $engagement, 'message' => 'Engagement created successfully'], 201);
        } catch (Throwable $e) {
            Log::error('Engagement store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create engagement. Please check your input and try again.'], 500);
        }
    }

    public function update(Request $request, Engagement $engagement): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'sometimes|required|exists:companies,id',
                'engagement_type' => 'sometimes|required|string|max:100',
                'accountant' => 'sometimes|required|string|max:150',
                'fee' => 'sometimes|numeric|min:0',
                'status' => 'sometimes|required|in:active,on_hold,completed',
                'next_milestone' => 'sometimes|required|string|max:255',
                'next_milestone_date' => 'sometimes|required|date',
            ]);

            $engagement->update($validated);
            $engagement->load('company');
            return response()->json(['success' => true, 'data' => $engagement, 'message' => 'Engagement updated successfully']);
        } catch (Throwable $e) {
            Log::error('Engagement update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update engagement. Please check your input and try again.'], 500);
        }
    }

    public function destroy(Engagement $engagement): JsonResponse
    {
        try {
            $engagement->delete();
            return response()->json(['success' => true, 'message' => 'Engagement deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Engagement destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete engagement.'], 500);
        }
    }
}
