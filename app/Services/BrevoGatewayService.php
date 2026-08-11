<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Single source of truth for Brevo credentials & dispatch.
 *
 * Every credential getter is fully DB-driven: it reads the live value stored
 * in the `settings` table (managed entirely from the System Settings page).
 * `.env` is intentionally NOT consulted here — all gateway configuration
 * must be entered and changed from Settings, never by editing files on the
 * server. A hardcoded literal is only used as the last-resort value before
 * any setting has ever been saved.
 */
class BrevoGatewayService
{
    /**
     * Resolve a DB-stored setting, ignoring masked placeholder values
     * (anything containing the literal `****`), falling back to a hardcoded
     * literal default only if nothing has been configured yet.
     */
    protected function resolve(string $settingKey, string $default = ''): string
    {
        $dbValue = Setting::getByKey($settingKey);

        if (!empty($dbValue) && !str_contains((string) $dbValue, '****')) {
            return trim((string) $dbValue);
        }

        return $default;
    }

    public function apiKey(): string
    {
        return $this->resolve('brevo_api_key');
    }

    public function senderEmail(): string
    {
        return $this->resolve('sender_email', 'b41bc4001@smtp-brevo.com');
    }

    public function senderName(): string
    {
        return $this->resolve('sender_name', 'LicenseHub Compliance');
    }

    public function smsSenderName(): string
    {
        return $this->resolve('sms_sender_name', 'LicenseHub');
    }

    public function adminReceiveEmail(): string
    {
        return $this->resolve('admin_receive_email');
    }

    /**
     * SMTP login username used only for the Brevo SMTP relay fallback
     * (smtp-relay.brevo.com). This is the account's SMTP identity, distinct
     * from the API key (password) and the "From" sender email/name.
     */
    public function smtpUser(): string
    {
        return $this->resolve('brevo_smtp_user', 'b41bc4001@smtp-brevo.com');
    }

    /**
     * Send a transactional email: Brevo REST API -> Brevo SMTP relay (if the
     * key is an SMTP key) -> default Laravel mailer. Mirrors the previous
     * per-controller fallback chain.
     *
     * @param string[] $toEmails
     * @param array<int, array{name: string, content: string}> $attachmentPayload Already base64-free raw content; encoded internally.
     */
    public function sendEmail(array $toEmails, string $subject, string $htmlContent, array $attachmentPayload = []): array
    {
        $toEmails = array_values(array_filter(array_map('trim', $toEmails), fn($e) => filter_var($e, FILTER_VALIDATE_EMAIL)));

        if (empty($toEmails)) {
            return ['success' => false, 'error' => 'No valid recipient email address specified.', 'channel' => null];
        }

        $apiKey = $this->apiKey();
        $restError = null;

        if (!empty($apiKey)) {
            $restResult = $this->sendViaRest($apiKey, $toEmails, $subject, $htmlContent, $attachmentPayload);
            if ($restResult['success']) {
                return array_merge($restResult, ['channel' => 'rest', 'rest_error' => null]);
            }
            $restError = $restResult['error'] ?? null;

            if (str_starts_with($apiKey, 'xsmtpsib-')) {
                $smtpResult = $this->sendViaSmtp($apiKey, $toEmails, $subject, $htmlContent, $attachmentPayload);
                if ($smtpResult['success']) {
                    return array_merge($smtpResult, ['channel' => 'smtp', 'rest_error' => $restError]);
                }
            }
        }

        $logResult = $this->sendViaLaravelMailer($toEmails, $subject, $htmlContent, $attachmentPayload);
        return array_merge($logResult, ['channel' => 'log', 'rest_error' => $restError]);
    }

    protected function sendViaRest(string $apiKey, array $toEmails, string $subject, string $htmlContent, array $attachmentPayload): array
    {
        $payload = [
            'sender' => [
                'name' => $this->senderName(),
                'email' => $this->senderEmail(),
            ],
            'to' => array_map(fn($e) => ['email' => $e], $toEmails),
            'subject' => $subject,
            'htmlContent' => $htmlContent,
        ];

        if (!empty($attachmentPayload)) {
            $payload['attachment'] = array_map(fn($file) => [
                'name' => $file['name'],
                'content' => base64_encode($file['content']),
            ], $attachmentPayload);
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(15)->post('https://api.brevo.com/v3/smtp/email', $payload);

            if ($response->successful()) {
                Log::info('Brevo REST API email dispatched: ' . $response->body());
                return ['success' => true];
            }

            Log::error('Brevo REST API error: ' . $response->body());
            $errorBody = $response->json();
            $errorMessage = $errorBody['message'] ?? trim($response->body());
            return ['success' => false, 'error' => $errorMessage];
        } catch (\Exception $ex) {
            Log::error('Brevo REST API exception: ' . $ex->getMessage());
            return ['success' => false, 'error' => $ex->getMessage()];
        }
    }

    protected function sendViaSmtp(string $apiKey, array $toEmails, string $subject, string $htmlContent, array $attachmentPayload): array
    {
        try {
            $smtpUser = $this->smtpUser();

            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp' => [
                    'transport' => 'smtp',
                    'host' => 'smtp-relay.brevo.com',
                    'port' => 587,
                    'encryption' => 'tls',
                    'username' => $smtpUser,
                    'password' => $apiKey,
                    'timeout' => 12,
                ],
                'mail.from' => [
                    'address' => $smtpUser,
                    'name' => $this->senderName(),
                ],
            ]);

            Mail::html($htmlContent, function ($message) use ($toEmails, $subject, $attachmentPayload, $smtpUser) {
                $message->from($smtpUser, $this->senderName());
                $message->to($toEmails)->subject($subject);

                foreach ($attachmentPayload as $file) {
                    $message->attachData($file['content'], $file['name'], ['mime' => 'application/pdf']);
                }
            });

            return ['success' => true];
        } catch (\Throwable $e) {
            Log::error('Brevo SMTP dispatch exception: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Last-resort tier when no live gateway credentials work: writes the
     * email to the application log via Laravel's built-in "log" mailer.
     * Deliberately does NOT touch `.env` SMTP config — self-contained so
     * the gateway never depends on anything outside System Settings.
     */
    protected function sendViaLaravelMailer(array $toEmails, string $subject, string $htmlContent, array $attachmentPayload): array
    {
        try {
            $senderEmail = $this->senderEmail();
            $senderName = $this->senderName();

            config(['mail.default' => 'log']);

            Mail::html($htmlContent, function ($message) use ($toEmails, $subject, $senderEmail, $senderName, $attachmentPayload) {
                $message->from($senderEmail, $senderName);
                $message->to($toEmails)->subject($subject);

                foreach ($attachmentPayload as $file) {
                    $message->attachData($file['content'], $file['name'], ['mime' => 'application/pdf']);
                }
            });

            return ['success' => true];
        } catch (\Throwable $e) {
            Log::error('Laravel Mailer exception: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Dispatch a transactional SMS via the Brevo Transactional SMS API (v3).
     */
    public function sendSms(string $phone, string $message): array
    {
        $apiKey = $this->apiKey();

        if (empty($apiKey)) {
            return [
                'success' => false,
                'message' => 'Brevo API Key is not configured. Add it in System Settings → Email & Gateway.',
            ];
        }

        $cleanPhone = preg_replace('/[^\d]/', '', $phone);

        if (str_starts_with($cleanPhone, '01') && strlen($cleanPhone) === 11) {
            $cleanPhone = '88' . $cleanPhone;
        }

        $senderName = substr(preg_replace('/[^A-Za-z0-9]/', '', $this->smsSenderName()), 0, 11);
        if (empty($senderName)) {
            $senderName = 'LicenseHub';
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $apiKey,
                'accept' => 'application/json',
                'content-type' => 'application/json',
            ])->timeout(10)->post('https://api.brevo.com/v3/transactionalSMS/sendSms', [
                'sender' => $senderName,
                'recipient' => $cleanPhone,
                'content' => mb_substr($message, 0, 160),
                'type' => 'transactional',
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => "SMS sent to +{$cleanPhone} via Brevo API.",
                    'data' => $response->json(),
                ];
            }

            $errorBody = $response->json();
            $errorMessage = $errorBody['message'] ?? ("HTTP error " . $response->status());

            return [
                'success' => false,
                'message' => "Brevo SMS API: {$errorMessage}",
                'response' => $errorBody,
            ];
        } catch (\Exception $e) {
            Log::error('Brevo SMS API Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Brevo SMS connection error: ' . $e->getMessage(),
            ];
        }
    }
}
