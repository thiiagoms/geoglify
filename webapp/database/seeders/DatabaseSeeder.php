<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\RolesTableSeeder;
use Database\Seeders\PermissionsTableSeeder;
use Database\Seeders\PermissionRoleTableSeeder;
use Database\Seeders\UsersTableSeeder;
use Database\Seeders\RoleUserTableSeeder;
use Database\Seeders\CargoCategoriesSeeder;
use Database\Seeders\CargoTypesSeeder;
use Database\Seeders\CountriesTableSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        $this->call([
            RolesTableSeeder::class,
            PermissionsTableSeeder::class,
            PermissionRoleTableSeeder::class,
            UsersTableSeeder::class,
            RoleUserTableSeeder::class,
            CargoCategoriesSeeder::class,
            CargoTypesSeeder::class,
            CountriesTableSeeder::class,
        ]);
    }
}
