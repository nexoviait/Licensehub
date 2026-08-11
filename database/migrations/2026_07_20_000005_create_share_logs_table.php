<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('share_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('set null');
            $table->string('subject');
            $table->string('recipients');
            $table->text('body')->nullable();
            $table->text('attachments')->nullable();
            $table->string('sent_at');
            $table->string('status')->default('Delivered');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('share_logs');
    }
};
