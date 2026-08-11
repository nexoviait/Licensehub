<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;
use Throwable;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $roles = Role::with('permissions')->get();

            return response()->json([
                'status' => 'success',
                'data' => $roles
            ]);
        } catch (Throwable $e) {
            Log::error('Role index exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to load roles.',
            ], 500);
        }
    }

    /**
     * Store a newly created role.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:roles,name',
                'permissions' => 'nullable|array',
                'permissions.*' => 'string|exists:permissions,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'api',
            ]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Role created successfully',
                'data' => $role->load('permissions')
            ], 201);
        } catch (Throwable $e) {
            Log::error('Role store exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create role. Please check your input and try again.',
            ], 500);
        }
    }

    /**
     * Display the specified role.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $role = Role::with('permissions')->find($id);

            if (!$role) {
                return response()->json(['status' => 'error', 'message' => 'Role not found'], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $role
            ]);
        } catch (Throwable $e) {
            Log::error('Role show exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to load role.',
            ], 500);
        }
    }

    /**
     * Update the specified role.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return response()->json(['status' => 'error', 'message' => 'Role not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:roles,name,' . $id,
                'permissions' => 'nullable|array',
                'permissions.*' => 'string|exists:permissions,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $role->update(['name' => $request->name]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Role updated successfully',
                'data' => $role->load('permissions')
            ]);
        } catch (Throwable $e) {
            Log::error('Role update exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update role. Please check your input and try again.',
            ], 500);
        }
    }

    /**
     * Remove the specified role.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return response()->json(['status' => 'error', 'message' => 'Role not found'], 404);
            }

            if (in_array($role->name, ['super_admin', 'admin'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete system critical roles'
                ], 403);
            }

            $role->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Role deleted successfully'
            ]);
        } catch (Throwable $e) {
            Log::error('Role destroy exception: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete role.',
            ], 500);
        }
    }
}
