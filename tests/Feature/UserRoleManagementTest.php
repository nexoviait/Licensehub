<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class UserRoleManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    }

    public function test_can_fetch_users_list_via_api()
    {
        $admin = User::where('email', 'admin@licensehub.io')->first();
        $token = auth('api')->login($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    '*' => ['id', 'name', 'email', 'roles']
                ]
            ]);
    }

    public function test_can_create_user_and_assign_role_via_api()
    {
        $admin = User::where('email', 'admin@licensehub.io')->first();
        $token = auth('api')->login($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/users', [
                'name' => 'Officer Test',
                'email' => 'officer@example.com',
                'password' => 'password123',
                'role' => 'compliance_officer',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'User created successfully'
            ]);

        $createdUser = User::where('email', 'officer@example.com')->first();
        $this->assertNotNull($createdUser);
        $this->assertTrue($createdUser->hasRole('compliance_officer'));
    }

    public function test_can_fetch_roles_and_permissions_via_api()
    {
        $admin = User::where('email', 'admin@licensehub.io')->first();
        $token = auth('api')->login($admin);

        $rolesResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/roles');
        $rolesResponse->assertStatus(200);

        $permsResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/permissions');
        $permsResponse->assertStatus(200);
    }

    public function test_can_create_new_role_via_api()
    {
        $admin = User::where('email', 'admin@licensehub.io')->first();
        $token = auth('api')->login($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/roles', [
                'name' => 'auditor',
                'permissions' => ['companies.view', 'reports.view']
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('roles', ['name' => 'auditor']);
    }
}
