<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use Illuminate\Support\Facades\Log;

use App\Models\Company;
use App\Services\BrevoGatewayService;

class ReminderController extends Controller
{
    protected BrevoGatewayService $gateway;

    public function __construct(BrevoGatewayService $gateway)
    {
        $this->gateway = $gateway;
    }

    public function index(): JsonResponse
    {
        $user = auth('api')->user();
        $query = Reminder::with('company')->orderBy('due_date', 'asc');

        if ($user && $user->hasRole('client')) {
            $companyIds = $this->getAssignedCompanyIds($user);
            $query->whereIn('company_id', $companyIds);
        }

        $reminders = $query->get();
        return response()->json(['success' => true, 'data' => $reminders]);
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

    public function show(Reminder $reminder): JsonResponse
    {
        $reminder->load('company');
        return response()->json(['success' => true, 'data' => $reminder]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'company_id' => 'nullable|exists:companies,id',
            'channel' => 'required|string|max:100',
            'due_date' => 'required|date',
            'status' => 'required|in:upcoming,done,overdue',
        ]);

        $reminder = Reminder::create($validated);
        $reminder->load('company');
        return response()->json(['success' => true, 'data' => $reminder, 'message' => 'Reminder created successfully'], 201);
    }

    public function update(Request $request, Reminder $reminder): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'company_id' => 'nullable|exists:companies,id',
            'channel' => 'sometimes|required|string|max:100',
            'due_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:upcoming,done,overdue',
        ]);

        $reminder->update($validated);
        $reminder->load('company');
        return response()->json(['success' => true, 'data' => $reminder, 'message' => 'Reminder updated successfully']);
    }

    public function destroy(Reminder $reminder): JsonResponse
    {
        $reminder->delete();
        return response()->json(['success' => true, 'message' => 'Reminder deleted successfully']);
    }

    public function send(Request $request, Reminder $reminder): JsonResponse
    {
        $reminder->load('company');
        $companyName = $reminder->company ? $reminder->company->name : 'Client Company';
        $companyEmail = $request->input('recipient') ?: ($reminder->company->email ?? null) ?: $this->gateway->adminReceiveEmail();
        $companyPhone = $request->input('phone') ?: ($reminder->company && $reminder->company->phone ? $reminder->company->phone : '');

        $subject = $request->input('subject') ?: "Compliance Reminder: {$reminder->title}";
        $body = $request->input('body') ?: "Dear {$companyName} Management,\n\nThis is an official compliance reminder regarding: {$reminder->title}.\nDue Date: {$reminder->due_date}.\n\nPlease review and submit required statutory filings at your earliest convenience.\n\nBest regards,\nLicenseHub Compliance Operations";

        $cleanPhone = preg_replace('/[^\d+]/', '', $companyPhone);
        $whatsappUrl = $cleanPhone
            ? "https://api.whatsapp.com/send?phone={$cleanPhone}&text=" . urlencode("{$subject}\n\n{$body}")
            : "https://api.whatsapp.com/send?text=" . urlencode("{$subject}\n\n{$body}");
        $mailtoUrl = "mailto:{$companyEmail}?subject=" . urlencode($subject) . "&body=" . urlencode($body);

        $channel = strtolower($reminder->channel ?: 'email');
        $dispatchedServices = [];
        $smsStatus = null;

        // 1. Send via Brevo Email if channel includes 'email'
        if (str_contains($channel, 'email')) {
            if (empty($companyEmail)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No recipient email available. Add an email to this company or set the Admin Receive Email in System Settings.',
                ], 422);
            }

            try {
                $shareController = new ShareLogController($this->gateway);
                $shareRequest = new Request([
                    'company_id' => $reminder->company_id,
                    'subject' => $subject,
                    'recipients' => $companyEmail,
                    'body' => $body,
                    'status' => 'Sent',
                ]);
                $shareController->store($shareRequest);
                $dispatchedServices[] = "Email ({$companyEmail})";
            } catch (\Exception $e) {
                Log::error("Brevo Email dispatch failed: " . $e->getMessage());
            }
        }

        // 2. Send via Brevo Transactional SMS API if channel includes 'sms'
        if (str_contains($channel, 'sms')) {
            if (!empty($companyPhone)) {
                $smsStatus = $this->gateway->sendSms($companyPhone, "{$subject}: {$body}");
                if ($smsStatus['success']) {
                    $dispatchedServices[] = "Brevo SMS (+{$companyPhone})";
                } else {
                    $dispatchedServices[] = "SMS (Brevo: {$smsStatus['message']})";
                }
            } else {
                $smsStatus = ['success' => false, 'message' => 'No phone number provided for recipient.'];
            }
        }

        $summaryMessage = !empty($dispatchedServices)
            ? "Compliance nudge dispatched via " . implode(' & ', $dispatchedServices)
            : "Compliance nudge prepared.";

        return response()->json([
            'success' => true,
            'data' => $reminder,
            'whatsapp_url' => $whatsappUrl,
            'mailto_url' => $mailtoUrl,
            'sms_status' => $smsStatus,
            'message' => $summaryMessage,
        ]);
    }
}
