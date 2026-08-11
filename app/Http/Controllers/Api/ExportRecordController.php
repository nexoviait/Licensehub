<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExportRecord;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class ExportRecordController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $exports = ExportRecord::orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'data' => $exports]);
        } catch (Throwable $e) {
            Log::error('Export record index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load export records.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'report_name' => 'required|string|max:255',
                'format' => 'required|in:PDF,CSV,XLSX',
            ]);

            $validated['generated_by'] = auth('api')->user()?->name ?? 'Unknown';
            $validated['generated_at'] = now()->format('Y-m-d H:i');
            $validated['size'] = null;

            $export = ExportRecord::create($validated);
            return response()->json(['success' => true, 'data' => $export, 'message' => "{$validated['report_name']} generated as {$validated['format']}"], 201);
        } catch (Throwable $e) {
            Log::error('Export record store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create export record. Please check your input and try again.'], 500);
        }
    }
}
