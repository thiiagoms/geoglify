<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Users
            [
                'id' => 1,
                'title' => 'users_create',
                'description' => 'Create users',
            ],
            [
                'id' => 2,
                'title' => 'users_edit',
                'description' => 'Edit users',
            ],
            [
                'id' => 3,
                'title' => 'users_destroy',
                'description' => 'Destroy users',
            ],
            [
                'id' => 4,
                'title' => 'users_show',
                'description' => 'Show users',
            ],
            [
                'id' => 5,
                'title' => 'users_index',
                'description' => 'List users',
            ],

            // Roles
            [
                'id' => 6,
                'title' => 'roles_create',
                'description' => 'Create roles',
            ],
            [
                'id' => 7,
                'title' => 'roles_edit',
                'description' => 'Edit roles',
            ],
            [
                'id' => 8,
                'title' => 'roles_destroy',
                'description' => 'Destroy roles',
            ],
            [
                'id' => 9,
                'title' => 'roles_show',
                'description' => 'Show roles',
            ],
            [
                'id' => 10,
                'title' => 'roles_index',
                'description' => 'List roles',
            ],

            // Layers
            [
                'id' => 11,
                'title' => 'layers_create',
                'description' => 'Create layers',
            ],
            [
                'id' => 12,
                'title' => 'layers_edit',
                'description' => 'Edit layers',
            ],
            [
                'id' => 13,
                'title' => 'layers_destroy',
                'description' => 'Destroy layers',
            ],
            [
                'id' => 14,
                'title' => 'layers_show',
                'description' => 'Show layers',
            ],
            [
                'id' => 15,
                'title' => 'layers_index',
                'description' => 'List layers',
            ],

            // Features
            [
                'id' => 16,
                'title' => 'features_create',
                'description' => 'Create features',
            ],
            [
                'id' => 17,
                'title' => 'features_edit',
                'description' => 'Edit features',
            ],
            [
                'id' => 18,
                'title' => 'features_destroy',
                'description' => 'Destroy features',
            ],
            [
                'id' => 19,
                'title' => 'features_show',
                'description' => 'Show features',
            ],
            [
                'id' => 20,
                'title' => 'features_index',
                'description' => 'List features',
            ],
        ];

        Permission::insert($permissions);
    }
}
