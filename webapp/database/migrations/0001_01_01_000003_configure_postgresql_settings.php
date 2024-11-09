<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Disable transactions for this migration
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Set PostgreSQL configuration settings
        DB::statement("ALTER SYSTEM SET max_connections = '100';");
        DB::statement("ALTER SYSTEM SET shared_buffers = '4GB';");
        DB::statement("ALTER SYSTEM SET effective_cache_size = '12GB';");
        DB::statement("ALTER SYSTEM SET maintenance_work_mem = '1GB';");
        DB::statement("ALTER SYSTEM SET checkpoint_completion_target = '0.9';");
        DB::statement("ALTER SYSTEM SET wal_buffers = '16MB';");
        DB::statement("ALTER SYSTEM SET default_statistics_target = '100';");
        DB::statement("ALTER SYSTEM SET random_page_cost = '1.1';");
        DB::statement("ALTER SYSTEM SET effective_io_concurrency = '200';");
        DB::statement("ALTER SYSTEM SET work_mem = '20971kB';");
        DB::statement("ALTER SYSTEM SET huge_pages = 'off';");
        DB::statement("ALTER SYSTEM SET min_wal_size = '2GB';");
        DB::statement("ALTER SYSTEM SET max_wal_size = '8GB';");
        DB::statement("ALTER SYSTEM SET max_worker_processes = '4';");
        DB::statement("ALTER SYSTEM SET max_parallel_workers_per_gather = '2';");
        DB::statement("ALTER SYSTEM SET max_parallel_workers = '4';");
        DB::statement("ALTER SYSTEM SET max_parallel_maintenance_workers = '2';");

        // Reload PostgreSQL config after making the changes
        DB::statement("SELECT pg_reload_conf();");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER SYSTEM RESET max_connections;");
        DB::statement("ALTER SYSTEM RESET shared_buffers;");
        DB::statement("ALTER SYSTEM RESET effective_cache_size;");
        DB::statement("ALTER SYSTEM RESET maintenance_work_mem;");
        DB::statement("ALTER SYSTEM RESET checkpoint_completion_target;");
        DB::statement("ALTER SYSTEM RESET wal_buffers;");
        DB::statement("ALTER SYSTEM RESET default_statistics_target;");
        DB::statement("ALTER SYSTEM RESET random_page_cost;");
        DB::statement("ALTER SYSTEM RESET effective_io_concurrency;");
        DB::statement("ALTER SYSTEM RESET work_mem;");
        DB::statement("ALTER SYSTEM RESET huge_pages;");
        DB::statement("ALTER SYSTEM RESET min_wal_size;");
        DB::statement("ALTER SYSTEM RESET max_wal_size;");
        DB::statement("ALTER SYSTEM RESET max_worker_processes;");
        DB::statement("ALTER SYSTEM RESET max_parallel_workers_per_gather;");
        DB::statement("ALTER SYSTEM RESET max_parallel_workers;");
        DB::statement("ALTER SYSTEM RESET max_parallel_maintenance_workers;");
    }
};
