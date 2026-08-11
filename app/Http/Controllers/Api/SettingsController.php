<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\BrevoGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class SettingsController extends Controller
{
    protected BrevoGatewayService $gateway;

    public function __construct(BrevoGatewayService $gateway)
    {
        $this->gateway = $gateway;
    }

    /**
     * Display all system settings.
     */
    public function index(): JsonResponse
    {
        $defaults = [
            'admin_receive_email' => '',
            'sender_name' => 'LicenseHub Compliance',
            'sender_email' => 'b41bc4001@smtp-brevo.com',
            'brevo_api_key' => '',
            'brevo_smtp_user' => 'b41bc4001@smtp-brevo.com',
            'sms_sender_name' => 'LicenseHub',
            'sms_default_country' => '+880',
            'platform_name' => 'LicenseHub Statutory Compliance Platform',
            'timezone' => 'Asia/Dhaka (GMT+6)',
            'currency' => 'BDT (৳)',
            'session_timeout_hours' => '24',
            'enable_sms_nudges' => true,
            'enable_email_alerts' => true,
        ];

        $dbSettings = Setting::all()->pluck('value', 'key')->toArray();

        // Clean out dummy asterisks from brevo_api_key if present
        if (isset($dbSettings['brevo_api_key']) && str_contains($dbSettings['brevo_api_key'], '****')) {
            unset($dbSettings['brevo_api_key']);
        }

        // Merge defaults with DB stored values
        $settings = array_merge($defaults, $dbSettings);

        // Never expose the live secret key to the client; only a masked preview.
        if (!empty($settings['brevo_api_key'])) {
            $settings['brevo_api_key'] = $this->maskApiKey($settings['brevo_api_key']);
        }

        return response()->json([
            'status' => 'success',
            'data' => $settings,
        ]);
    }

    /**
     * Mask a secret key for display, keeping a short recognizable prefix/suffix.
     * Uses the literal `****` marker so store() correctly detects & ignores
     * an unmodified masked value on save.
     */
    protected function maskApiKey(string $key): string
    {
        $key = trim($key);

        if (strlen($key) <= 12) {
            return '****';
        }

        return substr($key, 0, 8) . '****' . substr($key, -4);
    }

    /**
     * Store or update system settings.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->all();

            foreach ($data as $key => $value) {
                if (is_string($key) && $key !== '') {
                    if ($key === 'brevo_api_key') {
                        if (str_contains((string)$value, '****')) {
                            continue;
                        }
                        if (trim((string)$value) === '') {
                            Setting::where('key', 'brevo_api_key')->delete();
                            continue;
                        }
                    }
                    Setting::setKey($key, $value);
                }
            }

            // Return updated settings
            return $this->index();
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to save system settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send a live test email using the currently saved gateway settings, and
     * report back exactly which transport handled it (and why, if it had to
     * fall back). This exists because a Brevo SMTP "success" only means the
     * relay accepted the message for queueing — it does NOT guarantee actual
     * delivery (e.g. an unverified sender gets silently rejected after
     * acceptance, visible only in Brevo's own Email Activity log).
     */
    public function sendTestEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient' => 'required|email',
        ]);

        $senderEmail = $this->gateway->senderEmail();
        $senderName = $this->gateway->senderName();
        $apiKey = $this->gateway->apiKey();

        if (empty($apiKey)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No Brevo API key configured. Add one above before sending a test email.',
            ], 422);
        }

        $subject = 'LicenseHub Test Email - Configuration Check';
        $htmlContent = '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">'
            . '<div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">'
            . '<h2 style="color: #0f172a; margin-top: 0;">LicenseHub Test Email</h2>'
            . '<p style="font-size: 14px; color: #334155;">This is a test email sent from System Settings to verify your Brevo gateway configuration.</p>'
            . '<p style="font-size: 12px; color: #64748b;">Sender: ' . e($senderName) . ' &lt;' . e($senderEmail) . '&gt;<br />Sent at: ' . now()->toDateTimeString() . '</p>'
            . '</div></body></html>';

        $result = $this->gateway->sendEmail([$validated['recipient']], $subject, $htmlContent);

        if ($result['channel'] === 'rest') {
            return response()->json([
                'status' => 'success',
                'message' => "Delivered via Brevo REST API to {$validated['recipient']}. This is the most reliable channel — Brevo validates the sender synchronously, so this confirms your sender identity is verified and working.",
                'channel' => 'rest',
            ]);
        }

        if ($result['channel'] === 'smtp') {
            return response()->json([
                'status' => 'warning',
                'message' => "Sent via Brevo SMTP relay fallback (REST API failed: " . ($result['rest_error'] ?? 'unknown error') . "). "
                    . "The SMTP relay accepted the message, but that does NOT guarantee delivery — Brevo can silently reject an unverified sender after acceptance. "
                    . "Check Brevo Dashboard → Transactional → Email Activity for {$validated['recipient']} to confirm the real delivery status.",
                'channel' => 'smtp',
                'rest_error' => $result['rest_error'] ?? null,
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => "Test email could not be delivered via any live channel. " . ($result['rest_error'] ? "REST error: {$result['rest_error']}. " : '') . ($result['error'] ?? ''),
            'channel' => $result['channel'],
        ], 422);
    }
}
