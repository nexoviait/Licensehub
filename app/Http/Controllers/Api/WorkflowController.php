<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class WorkflowController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $workflows = Workflow::orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'data' => $workflows]);
        } catch (Throwable $e) {
            Log::error('Workflow index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load workflows.'], 500);
        }
    }

    public function show(Workflow $workflow): JsonResponse
    {
        try {
            return response()->json(['success' => true, 'data' => $workflow]);
        } catch (Throwable $e) {
            Log::error('Workflow show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load workflow.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'trigger' => 'required|string|max:255',
                'action' => 'required|string|max:255',
                'status' => 'required|in:active,paused',
            ]);

            $validated['runs'] = 0;
            $validated['last_run'] = 'Never run';
            $validated['success_rate'] = 100;

            $workflow = Workflow::create($validated);
            return response()->json(['success' => true, 'data' => $workflow, 'message' => 'Workflow created successfully'], 201);
        } catch (Throwable $e) {
            Log::error('Workflow store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create workflow. Please check your input and try again.'], 500);
        }
    }

    public function update(Request $request, Workflow $workflow): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'trigger' => 'sometimes|required|string|max:255',
                'action' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|required|in:active,paused',
            ]);

            $workflow->update($validated);
            return response()->json(['success' => true, 'data' => $workflow, 'message' => 'Workflow updated successfully']);
        } catch (Throwable $e) {
            Log::error('Workflow update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update workflow. Please check your input and try again.'], 500);
        }
    }

    public function destroy(Workflow $workflow): JsonResponse
    {
        try {
            $workflow->delete();
            return response()->json(['success' => true, 'message' => 'Workflow deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Workflow destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete workflow.'], 500);
        }
    }
}
