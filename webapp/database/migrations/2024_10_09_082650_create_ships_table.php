<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Create the ships table
        Schema::create('ships', function (Blueprint $table) {
            $table->id();
            $table->string('mmsi')->unique();
            $table->string('name')->nullable();
            $table->string('callsign')->nullable();
            $table->string('imo')->nullable();
            $table->integer('dim_a')->nullable();
            $table->integer('dim_b')->nullable();
            $table->integer('dim_c')->nullable();
            $table->integer('dim_d')->nullable();
            $table->string('cargo')->nullable();
            $table->decimal('draught', 5, 2)->nullable();

            // Audit Fields
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->softDeletes();

            // Adding foreign keys directly
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('deleted_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('mmsi');
        });
    }

    public function down()
    {
        // Drop the ships table
        Schema::dropIfExists('ships');
    }
};
