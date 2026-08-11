<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

class UserController extends Controller
{
    /**
     * Display a listing of all users with their roles.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $users = User::with(['roles', 'permissions'])->get();

            return response()->json([
                'status' => 'success',
                'data' => $users
            ]);
        } catch (Throwable $e) {
            Log::error('User index exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to load users.',
            ], 500);
        }
    }

    /**
     * Store a newly created user and assign role.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'role' => 'required|string|exists:roles,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            $user->assignRole($request->role);

            return response()->json([
                'status' => 'success',
                'message' => 'User created successfully',
                'data' => $user->load('roles')
            ], 201);
        } catch (Throwable $e) {
            Log::error('User store exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create user. Please check your input and try again.',
            ], 500);
        }
    }

    /**
     * Display the specified user.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $user = User::with(['roles', 'permissions'])->find($id);

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $user
            ]);
        } catch (Throwable $e) {
            Log::error('User show exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to load user.',
            ], 500);
        }
    }

    /**
     * Update the specified user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8',
                'role' => 'sometimes|required|string|exists:roles,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->has('name')) {
                $user->name = $request->name;
            }

            if ($request->has('email')) {
                $user->email = $request->email;
            }

            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            if ($request->has('role')) {
                $user->syncRoles([$request->role]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'User updated successfully',
                'data' => $user->load('roles')
            ]);
        } catch (Throwable $e) {
            Log::error('User update exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user. Please check your input and try again.',
            ], 500);
        }
    }

    /**
     * Remove the specified user.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
            }

            if (auth('api')->id() == $id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You cannot delete your own account'
                ], 403);
            }

            $user->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully'
            ]);
        } catch (Throwable $e) {
            Log::error('User destroy exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete user.',
            ], 500);
        }
    }

    /**
     * Toggle 2FA status for specified user.
     *
     * @param  int  $id
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggle2FA($id, Request $request)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
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
                    ? "2FA enabled for {$user->name}"
                    : "2FA disabled for {$user->name}",
                'data' => [
                    'id' => $user->id,
                    'two_factor_enabled' => (bool) $user->two_factor_enabled,
                ]
            ]);
        } catch (Throwable $e) {
            Log::error('User toggle2FA exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update 2FA status.',
            ], 500);
        }
    }
}
