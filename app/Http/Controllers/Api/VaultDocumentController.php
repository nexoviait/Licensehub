<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VaultDocument;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

use App\Models\Company;

class VaultDocumentController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $query = VaultDocument::with('company')->orderBy('uploaded_at', 'desc');

            if ($user && $user->hasRole('client')) {
                $companyIds = $this->getAssignedCompanyIds($user);
                $query->whereIn('company_id', $companyIds);
            }

            $documents = $query->get();
            return response()->json(['success' => true, 'data' => $documents]);
        } catch (Throwable $e) {
            Log::error('Vault document index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load documents.'], 500);
        }
    }

    protected function getAssignedCompanyIds($user): array
    {
        if (!$user) return [];
        $userId = $user->id;
        $userEmail = strtolower($user->email ?? '');

        return Company::where(function ($q) use ($userId, $userEmail) {
            $q->whereJsonContains('assigned_user_ids', (int)$userId)
              ->orWhereJsonContains('assigned_user_ids', (string)$userId)
              ->orWhereRaw('LOWER(email) = ?', [$userEmail]);
        })->pluck('id')->toArray();
    }

    public function show(VaultDocument $vaultDocument): JsonResponse
    {
        try {
            $vaultDocument->load('company');
            return response()->json(['success' => true, 'data' => $vaultDocument]);
        } catch (Throwable $e) {
            Log::error('Vault document show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load document.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'name' => 'nullable|string|max:255',
                'category' => 'required|string|max:100',
                'size' => 'nullable|string|max:50',
                'uploaded_at' => 'nullable|date',
                'starred' => 'nullable|boolean',
                'confidential' => 'nullable|boolean',
                'ext' => 'nullable|string|max:10',
                'file' => 'nullable|file|max:10240',
            ]);

            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $originalName = $file->getClientOriginalName();
                $ext = strtolower($file->getClientOriginalExtension());
                $bytes = $file->getSize();

                $sizeStr = $bytes > 1048576
                    ? number_format($bytes / 1048576, 1) . ' MB'
                    : number_format($bytes / 1024, 0) . ' KB';

                $path = $file->store('vault', 'public');

                $validated['name'] = $validated['name'] ?: $originalName;
                $validated['ext'] = $ext;
                $validated['size'] = $sizeStr;
                $validated['file_path'] = $path;
            }

            $validated['name'] = $validated['name'] ?? 'Document.pdf';
            $validated['size'] = $validated['size'] ?? '1.2 MB';
            $validated['uploaded_at'] = $validated['uploaded_at'] ?? now()->toDateString();
            $validated['ext'] = $validated['ext'] ?? pathinfo($validated['name'], PATHINFO_EXTENSION) ?: 'pdf';
            $validated['starred'] = filter_var($request->input('starred', false), FILTER_VALIDATE_BOOLEAN);
            $validated['confidential'] = filter_var($request->input('confidential', false), FILTER_VALIDATE_BOOLEAN);

            $doc = VaultDocument::create($validated);
            $doc->load('company');
            return response()->json(['success' => true, 'data' => $doc, 'message' => 'Document uploaded successfully'], 201);
        } catch (Throwable $e) {
            Log::error('Vault document store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to upload document. Please check your input and try again.'], 500);
        }
    }

    public function update(Request $request, VaultDocument $vaultDocument): JsonResponse
    {
        try {
            $validated = $request->validate([
                'starred' => 'sometimes|boolean',
                'confidential' => 'sometimes|boolean',
                'category' => 'sometimes|string|max:100',
                'name' => 'sometimes|string|max:255',
            ]);

            $vaultDocument->update($validated);
            $vaultDocument->load('company');
            return response()->json(['success' => true, 'data' => $vaultDocument, 'message' => 'Document updated successfully']);
        } catch (Throwable $e) {
            Log::error('Vault document update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update document. Please check your input and try again.'], 500);
        }
    }

    public function destroy(VaultDocument $vaultDocument): JsonResponse
    {
        try {
            if ($vaultDocument->file_path && Storage::disk('public')->exists($vaultDocument->file_path)) {
                Storage::disk('public')->delete($vaultDocument->file_path);
            }
            $vaultDocument->delete();
            return response()->json(['success' => true, 'message' => 'Document deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Vault document destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete document.'], 500);
        }
    }

    public function download(VaultDocument $vaultDocument)
    {
        try {
            if ($vaultDocument->file_path && Storage::disk('public')->exists($vaultDocument->file_path)) {
                return Storage::disk('public')->download($vaultDocument->file_path, $vaultDocument->name);
            }

            $companyName = $vaultDocument->company ? $vaultDocument->company->name : 'LicenseHub';
            $content = "LicenseHub Document Vault\n";
            $content .= "----------------------------------------\n";
            $content .= "Document: {$vaultDocument->name}\n";
            $content .= "Company: {$companyName}\n";
            $content .= "Category: {$vaultDocument->category}\n";
            $content .= "Uploaded Date: {$vaultDocument->uploaded_at}\n";
            $content .= "Confidential: " . ($vaultDocument->confidential ? 'Yes' : 'No') . "\n";
            $content .= "----------------------------------------\n";
            $content .= "This is an official document stored in LicenseHub Vault.";

            return response()->streamDownload(function () use ($content) {
                echo $content;
            }, $vaultDocument->name, [
                'Content-Type' => 'application/octet-stream',
            ]);
        } catch (Throwable $e) {
            Log::error('Vault document download exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to download document.'], 500);
        }
    }
}
