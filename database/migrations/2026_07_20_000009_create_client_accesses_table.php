<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('contact_name');
            $table->string('contact_email');
            $table->enum('role', ['Owner', 'Finance', 'Viewer'])->default('Viewer');
            $table->enum('status', ['active', 'invited', 'revoked'])->default('invited');
            $table->string('last_login')->default('Never');
            $table->integer('documents_shared')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_accesses');
    }
};
