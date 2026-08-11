<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $tasks = Task::with('company')->orderBy('due_date', 'asc')->get();
            return response()->json(['success' => true, 'data' => $tasks]);
        } catch (Throwable $e) {
            Log::error('Task index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load tasks.'], 500);
        }
    }

    public function show(Task $task): JsonResponse
    {
        try {
            $task->load('company');
            return response()->json(['success' => true, 'data' => $task]);
        } catch (Throwable $e) {
            Log::error('Task show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load task.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'title' => 'required|string|max:255',
                'assignee' => 'required|string|max:150',
                'priority' => 'required|in:low,medium,high',
                'status' => 'required|in:todo,in_progress,done',
                'due_date' => 'required|date',
            ]);

            $task = Task::create($validated);
            $task->load('company');
            return response()->json(['success' => true, 'data' => $task, 'message' => 'Task created successfully'], 201);
        } catch (Throwable $e) {
            Log::error('Task store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create task. Please check your input and try again.'], 500);
        }
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'sometimes|required|exists:companies,id',
                'title' => 'sometimes|required|string|max:255',
                'assignee' => 'sometimes|required|string|max:150',
                'priority' => 'sometimes|required|in:low,medium,high',
                'status' => 'sometimes|required|in:todo,in_progress,done',
                'due_date' => 'sometimes|required|date',
            ]);

            $task->update($validated);
            $task->load('company');
            return response()->json(['success' => true, 'data' => $task, 'message' => 'Task updated successfully']);
        } catch (Throwable $e) {
            Log::error('Task update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update task. Please check your input and try again.'], 500);
        }
    }

    public function destroy(Task $task): JsonResponse
    {
        try {
            $task->delete();
            return response()->json(['success' => true, 'message' => 'Task deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Task destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete task.'], 500);
        }
    }
}
