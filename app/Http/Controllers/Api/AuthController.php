<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\BrevoGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    protected BrevoGatewayService $gateway;

    public function __construct(BrevoGatewayService $gateway)
    {
        $this->gateway = $gateway;
    }

    /**
     * Register a new user and return a JWT token.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = auth('api')->login($user);

        return $this->respondWithToken($token, $user, 201);
    }

    /**
     * Get a JWT via given credentials.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Invalid email or password'
            ], 401);
        }

        $user = auth('api')->user();

        // Check if 2FA Protection is enabled
        $notifs = $user->notification_settings ?? [];
        $is2FAEnabled = (bool) ($user->two_factor_enabled ?? ($notifs['two_factor_enabled'] ?? false));

        if ($is2FAEnabled) {
            $otp = sprintf("%06d", mt_rand(100000, 999999));
            $tempToken = encrypt([
                'user_id' => $user->id,
                'otp' => $otp,
                'expires_at' => now()->addMinutes(10)->timestamp,
            ]);

            Log::info("2FA OTP generated for user {$user->email}");

            // Dispatch real 2FA verification email via Brevo REST API / Mailer
            $this->send2FAEmail($user->email, $user->name, $otp);

            return response()->json([
                'status' => '2fa_required',
                'message' => 'Two-Factor Verification required. A 6-digit OTP code has been sent to your email address.',
                'email' => $user->email,
                'temp_token' => $tempToken,
            ]);
        }

        return $this->respondWithToken($token, $user);
    }

    /**
     * Resend 2FA OTP verification code via Brevo REST API.
     */
    public function resend2FA(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'temp_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Temporary token is required to resend 2FA code.'
            ], 422);
        }

        try {
            $data = decrypt($request->temp_token);
            $user = User::findOrFail($data['user_id']);

            $otp = sprintf("%06d", mt_rand(100000, 999999));
            $newTempToken = encrypt([
                'user_id' => $user->id,
                'otp' => $otp,
                'expires_at' => now()->addMinutes(10)->timestamp,
            ]);

            Log::info("2FA OTP re-generated for user {$user->email}");
            $this->send2FAEmail($user->email, $user->name, $otp);

            return response()->json([
                'status' => 'success',
                'message' => 'A new 6-digit OTP verification code has been sent to your email address.',
                'temp_token' => $newTempToken,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired 2FA session. Please log in again.'
            ], 400);
        }
    }

    /**
     * Verify 2FA OTP Code and complete JWT authentication.
     */
    public function verify2FA(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'temp_token' => 'required|string',
            'otp' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'OTP verification code and temporary token are required.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = decrypt($request->temp_token);

            if (time() > $data['expires_at']) {
                return response()->json([
                    'status' => 'error',
                    'message' => '2FA OTP code has expired. Please log in again to receive a new code.'
                ], 422);
            }

            $userOtp = trim((string)$request->otp);
            $expectedOtp = (string)$data['otp'];

            if ($userOtp !== $expectedOtp) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid 2FA OTP verification code. Please check your email and try again.'
                ], 422);
            }

            $user = User::findOrFail($data['user_id']);
            $token = auth('api')->login($user);

            return $this->respondWithToken($token, $user);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired 2FA session. Please log in again.'
            ], 400);
        }
    }

    /**
     * Send 2FA OTP Email via Brevo REST API v3 with Laravel Mail fallback.
     */
    protected function send2FAEmail(string $recipientEmail, string $recipientName, string $otpCode): void
    {
        $subject = 'LicenseHub Security: Your 2FA Verification Code';
        $htmlContent = '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">'
            . '<div style="max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">'
            . '<div style="text-align: center; margin-bottom: 20px;">'
            . '<h2 style="color: #0f172a; margin: 0;">LicenseHub Security Gateway</h2>'
            . '<p style="color: #64748b; font-size: 13px; margin-top: 4px;">Two-Factor Authentication Verification</p>'
            . '</div>'
            . '<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">'
            . '<p style="font-size: 13px; color: #475569; margin-top: 0;">Hello ' . e($recipientName) . ', use the following 6-digit OTP code to complete your login:</p>'
            . '<div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace; margin: 12px 0;">' . e($otpCode) . '</div>'
            . '<p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">This code is valid for 10 minutes and should not be shared with anyone.</p>'
            . '</div>'
            . '<p style="font-size: 12px; color: #64748b;">If you did not request this verification code, please contact your system administrator immediately.</p>'
            . '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />'
            . '<p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Protected by LicenseHub Security Gateway • 256-bit SSL</p>'
            . '</div></body></html>';

        $result = $this->gateway->sendEmail([$recipientEmail], $subject, $htmlContent);

        if ($result['success']) {
            Log::info("2FA OTP email dispatched via Brevo ({$result['channel']}) to {$recipientEmail}");
        } else {
            Log::error("2FA OTP email dispatch failed for {$recipientEmail}: " . ($result['error'] ?? 'unknown error'));
        }
    }

    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found or unauthenticated'
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'user' => $this->formatUserData($user)
        ]);
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        try {
            auth('api')->logout();
            return response()->json([
                'status' => 'success',
                'message' => 'Successfully logged out'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to logout, token may already be invalidated'
            ], 500);
        }
    }

    /**
     * Refresh a token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        try {
            $newToken = auth('api')->refresh();
            return $this->respondWithToken($newToken, auth('api')->user());
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Could not refresh token: ' . $e->getMessage()
            ], 401);
        }
    }

    /**
     * Get the token array structure.
     *
     * @param  string $token
     * @param  \App\Models\User|null $user
     * @param  int $code
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithToken($token, $user = null, $code = 200)
    {
        $targetUser = $user ?? auth('api')->user();

        return response()->json([
            'status' => 'success',
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $this->formatUserData($targetUser),
        ], $code);
    }

    /**
     * Format user data with Spatie roles and permissions.
     *
     * @param  \App\Models\User|null $user
     * @return array|null
     */
    protected function formatUserData($user)
    {
        if (!$user) {
            return null;
        }

        $roles = $user->getRoleNames()->toArray();
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        return array_merge($user->toArray(), [
            'role' => $roles[0] ?? 'viewer',
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }
}
