<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('export_records', function (Blueprint $table) {
            $table->id();
            $table->string('report_name');
            $table->enum('format', ['PDF', 'CSV', 'XLSX'])->default('PDF');
            $table->string('generated_by');
            $table->string('generated_at');
            $table->string('size');
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('export_records');
    }
};
