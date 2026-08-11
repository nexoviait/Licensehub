<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ComplianceEvent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

use App\Models\Company;

class ComplianceEventController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $query = ComplianceEvent::with('company')->orderBy('date', 'asc');

            if ($user && $user->hasRole('client')) {
                $companyIds = $this->getAssignedCompanyIds($user);
                $query->whereIn('company_id', $companyIds);
            }

            $events = $query->get();
            return response()->json(['success' => true, 'data' => $events]);
        } catch (Throwable $e) {
            Log::error('Compliance event index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load compliance events.'], 500);
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

    public function show(ComplianceEvent $complianceEvent): JsonResponse
    {
        try {
            $complianceEvent->load('company');
            return response()->json(['success' => true, 'data' => $complianceEvent]);
        } catch (Throwable $e) {
            Log::error('Compliance event show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load compliance event.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'type' => 'required|string|max:100',
                'title' => 'required|string|max:255',
                'status' => 'required|in:upcoming,completed,overdue',
                'assignee' => 'nullable|string|max:100',
                'date' => 'required|date',
            ]);

            $event = ComplianceEvent::create($validated);
            $event->load('company');
            return response()->json(['success' => true, 'data' => $event, 'message' => 'Compliance event created'], 201);
        } catch (Throwable $e) {
            Log::error('Compliance event store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create compliance event. Please check your input and try again.'], 500);
        }
    }

    public function update(Request $request, ComplianceEvent $complianceEvent): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'sometimes|required|exists:companies,id',
                'type' => 'sometimes|required|string|max:100',
                'title' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|required|in:upcoming,completed,overdue',
                'assignee' => 'nullable|string|max:100',
                'date' => 'sometimes|required|date',
            ]);

            $complianceEvent->update($validated);
            $complianceEvent->load('company');
            return response()->json(['success' => true, 'data' => $complianceEvent, 'message' => 'Compliance event updated']);
        } catch (Throwable $e) {
            Log::error('Compliance event update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update compliance event. Please check your input and try again.'], 500);
        }
    }

    public function destroy(ComplianceEvent $complianceEvent): JsonResponse
    {
        try {
            $complianceEvent->delete();
            return response()->json(['success' => true, 'message' => 'Event deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Compliance event destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete compliance event.'], 500);
        }
    }
}
