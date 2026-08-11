<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Create Permissions
        $permissions = [
            'dashboard.view',
            'companies.view',
            'companies.manage',
            'calendar.view',
            'calendar.manage',
            'reminders.view',
            'reminders.manage',
            'vault.view',
            'vault.manage',
            'share.view',
            'share.manage',
            'tax.view',
            'tax.manage',
            'lawyer.view',
            'lawyer.manage',
            'accountant.view',
            'accountant.manage',
            'clients.view',
            'clients.manage',
            'tasks.view',
            'tasks.manage',
            'workflows.view',
            'workflows.manage',
            'billing.view',
            'billing.manage',
            'reports.view',
            'reports.manage',
            'users.view',
            'users.manage',
            'roles.view',
            'roles.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        }

        // 2. Create Roles & Assign Permissions

        // Super Admin
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'api']);
        $superAdmin->syncPermissions(Permission::all());

        // Admin
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin->syncPermissions(Permission::all());

        // Compliance Officer
        $complianceOfficer = Role::firstOrCreate(['name' => 'compliance_officer', 'guard_name' => 'api']);
        $complianceOfficer->syncPermissions([
            'dashboard.view', 'companies.view', 'calendar.view', 'calendar.manage',
            'reminders.view', 'reminders.manage', 'vault.view', 'vault.manage',
            'share.view', 'share.manage', 'tax.view', 'tasks.view', 'tasks.manage', 'reports.view'
        ]);

        // Lawyer
        $lawyer = Role::firstOrCreate(['name' => 'lawyer', 'guard_name' => 'api']);
        $lawyer->syncPermissions([
            'dashboard.view', 'companies.view', 'calendar.view', 'reminders.view',
            'vault.view', 'vault.manage', 'share.view', 'share.manage',
            'lawyer.view', 'lawyer.manage', 'tasks.view', 'tasks.manage'
        ]);

        // Accountant
        $accountant = Role::firstOrCreate(['name' => 'accountant', 'guard_name' => 'api']);
        $accountant->syncPermissions([
            'dashboard.view', 'companies.view', 'calendar.view', 'reminders.view',
            'vault.view', 'tax.view', 'tax.manage', 'accountant.view', 'accountant.manage',
            'billing.view', 'billing.manage', 'reports.view', 'tasks.view'
        ]);

        // Client
        $client = Role::firstOrCreate(['name' => 'client', 'guard_name' => 'api']);
        $client->syncPermissions([
            'dashboard.view', 'companies.view', 'calendar.view', 'reminders.view',
            'vault.view', 'share.view', 'tax.view', 'clients.view', 'billing.view'
        ]);

        // Viewer
        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'api']);
        $viewer->syncPermissions([
            'dashboard.view', 'companies.view', 'calendar.view', 'reminders.view',
            'vault.view', 'share.view', 'tax.view', 'lawyer.view', 'accountant.view',
            'clients.view', 'tasks.view', 'workflows.view', 'billing.view', 'reports.view'
        ]);

        // 3. Create Users for all roles and assign roles & permissions
        $roleUsers = [
            ['name' => 'Sadia Ahmed', 'email' => 'sadia@licensehub.io', 'role' => $superAdmin],
            ['name' => 'Super Admin', 'email' => 'admin@licensehub.io', 'role' => $superAdmin],
            ['name' => 'Admin Manager', 'email' => 'admin.user@licensehub.io', 'role' => $admin],
            ['name' => 'Rahim Compliance', 'email' => 'officer@licensehub.io', 'role' => $complianceOfficer],
            ['name' => 'Adv. Mahbubur Rahman', 'email' => 'lawyer@licensehub.io', 'role' => $lawyer],
            ['name' => 'Kamal Hossain CA', 'email' => 'accountant@licensehub.io', 'role' => $accountant],
            ['name' => 'Mahmudul Karim (Client)', 'email' => 'client@licensehub.io', 'role' => $client],
            ['name' => 'Read-Only Viewer', 'email' => 'viewer@licensehub.io', 'role' => $viewer],
        ];

        foreach ($roleUsers as $uData) {
            $u = User::firstOrCreate(
                ['email' => $uData['email']],
                [
                    'name' => $uData['name'],
                    'password' => Hash::make('password123'),
                ]
            );
            $u->syncRoles([$uData['role']]);
        }
    }
}
