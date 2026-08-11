<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('trigger');
            $table->string('action');
            $table->enum('status', ['active', 'paused'])->default('active');
            $table->integer('runs')->default(0);
            $table->string('last_run')->default('Never run');
            $table->integer('success_rate')->default(100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflows');
    }
};
