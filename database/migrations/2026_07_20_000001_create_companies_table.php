<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('entity_type');
            $table->string('tin')->nullable();
            $table->string('bin')->nullable();
            $table->string('rjsc')->nullable();
            $table->string('address')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->integer('directors')->default(1);
            $table->integer('branches')->default(1);
            $table->date('next_due')->nullable();
            $table->string('next_due_label')->nullable();
            $table->enum('status', ['upcoming', 'completed', 'overdue'])->default('upcoming');
            $table->string('logo', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
