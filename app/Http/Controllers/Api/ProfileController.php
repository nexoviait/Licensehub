<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's full profile details.
     */
    public function show(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = auth('api')->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated session. Please log in again.',
                ], 401);
            }

            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : [];
            $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : [];

            $defaultNotifications = [
                'email_alerts' => true,
                'sms_reminders' => true,
                'weekly_digest' => true,
                'system_updates' => false,
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'designation' => $user->designation,
                    'bio' => $user->bio,
                    'avatar' => $user->avatar ?? null,
                    'two_factor_enabled' => (bool) ($user->two_factor_enabled ?? false),
                    'notification_settings' => array_merge($defaultNotifications, $user->notification_settings ?? []),
                    'roles' => $roles,
                    'permissions' => $permissions,
                    'created_at' => $user->created_at ? $user->created_at->toIso8601String() : null,
                ],
            ]);
        } catch (Throwable $e) {
            Log::error('Profile fetch exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to load profile data. Please refresh the page.',
            ], 500);
        }
    }

    /**
     * Update the authenticated user's profile information.
     */
    public function update(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = auth('api')->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated session. Please log in again.',
                ], 401);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'phone' => 'nullable|string|max:50',
                'designation' => 'nullable|string|max:150',
                'bio' => 'nullable|string|max:1000',
                'avatar' => 'nullable|string',
            ]);

            $user->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'designation' => $user->designation,
                    'bio' => $user->bio,
                    'avatar' => $user->avatar,
                    'notification_settings' => $user->notification_settings ?? [],
                    'roles' => method_exists($user, 'getRoleNames') ? $user->getRoleNames() : [],
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error. Please check your form inputs.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            Log::error('Profile update exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update profile. Please ensure all inputs are valid.',
            ], 500);
        }
    }

    /**
     * Change the authenticated user's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = auth('api')->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated session. Please log in again.',
                ], 401);
            }

            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Current password does not match our records.',
                    'errors' => [
                        'current_password' => ['The provided current password is incorrect.']
                    ]
                ], 422);
            }

            $user->password = Hash::make($validated['new_password']);
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Password updated successfully. Please use your new password for future logins.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error. Please check password inputs.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            Log::error('Password update exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update password. Please try again.',
            ], 500);
        }
    }

    /**
     * Update notification preferences.
     */
    public function updateNotifications(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = auth('api')->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated session.',
                ], 401);
            }

            $validated = $request->validate([
                'email_alerts' => 'nullable|boolean',
                'sms_reminders' => 'nullable|boolean',
                'weekly_digest' => 'nullable|boolean',
                'system_updates' => 'nullable|boolean',
                'admin_receive_email' => 'nullable|email|string|max:255',
                'two_factor_enabled' => 'nullable|boolean',
            ]);

            $existing = $user->notification_settings ?? [];
            $merged = array_merge($existing, array_filter($validated, fn($val) => $val !== null));

            $user->notification_settings = $merged;
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Settings saved successfully!',
                'data' => $user->notification_settings,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            Log::error('Notification update exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to save settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload user profile avatar.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = auth('api')->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated session.',
                ], 401);
            }

            $request->validate([
                'avatar_file' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            if ($request->hasFile('avatar_file')) {
                $file = $request->file('avatar_file');
                $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('avatars', $filename, 'public');

                $avatarUrl = Storage::url($path);
                $user->avatar = $avatarUrl;
                $user->save();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Avatar updated successfully',
                    'avatar' => $avatarUrl,
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'No image file uploaded',
            ], 400);
        } catch (Throwable $e) {
            Log::error('Avatar upload exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to upload avatar image.',
            ], 500);
        }
    }

    /**
     * Toggle Two-Factor Authentication (2FA) status.
     */
    public function toggle2FA(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = auth('api')->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated session.',
                ], 401);
            }

            $enabled = $request->boolean('enabled');
            $user->two_factor_enabled = $enabled;

            $notifs = $user->notification_settings ?? [];
            $notifs['two_factor_enabled'] = $enabled;
            $user->notification_settings = $notifs;

            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => $enabled
                    ? 'Two-Factor Authentication (2FA) protection has been activated successfully!'
                    : 'Two-Factor Authentication (2FA) protection has been deactivated.',
                'two_factor_enabled' => (bool) $user->two_factor_enabled,
            ]);
        } catch (Throwable $e) {
            Log::error('2FA toggle exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update 2FA status: ' . $e->getMessage(),
            ], 500);
        }
    }
}
