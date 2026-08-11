<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Throwable;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $invoices = Invoice::with('company')->orderBy('issue_date', 'desc')->get();
            return response()->json(['success' => true, 'data' => $invoices]);
        } catch (Throwable $e) {
            Log::error('Invoice index exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load invoices.'], 500);
        }
    }

    public function show(Invoice $invoice): JsonResponse
    {
        try {
            $invoice->load('company');
            return response()->json(['success' => true, 'data' => $invoice]);
        } catch (Throwable $e) {
            Log::error('Invoice show exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Unable to load invoice.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'amount' => 'required|numeric|min:1',
                'issue_date' => 'required|date',
                'due_date' => 'required|date',
                'status' => 'required|in:paid,pending,overdue,draft',
            ]);

            $lastId = Invoice::max('id') + 1;
            $validated['number'] = 'INV-' . now()->year . '-' . str_pad($lastId, 4, '0', STR_PAD_LEFT);

            $invoice = Invoice::create($validated);
            $invoice->load('company');
            return response()->json(['success' => true, 'data' => $invoice, 'message' => 'Invoice created successfully'], 201);
        } catch (Throwable $e) {
            Log::error('Invoice store exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create invoice. Please check your input and try again.'], 500);
        }
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'sometimes|required|in:paid,pending,overdue,draft',
                'amount' => 'sometimes|numeric|min:1',
                'due_date' => 'sometimes|date',
            ]);

            $invoice->update($validated);
            $invoice->load('company');
            return response()->json(['success' => true, 'data' => $invoice, 'message' => 'Invoice updated successfully']);
        } catch (Throwable $e) {
            Log::error('Invoice update exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update invoice. Please check your input and try again.'], 500);
        }
    }

    public function download(Invoice $invoice)
    {
        try {
            $invoice->load('company');
            $companyName = $invoice->company ? $invoice->company->name : 'Client_Company';
            $tin = $invoice->company && $invoice->company->tin ? $invoice->company->tin : 'N/A';
            $bin = $invoice->company && $invoice->company->bin ? $invoice->company->bin : 'N/A';

            $amountVal = (float) $invoice->amount;
            $amountFmt = number_format($amountVal, 2);
            $issueDate = $invoice->issue_date ? (is_string($invoice->issue_date) ? substr($invoice->issue_date, 0, 10) : $invoice->issue_date->format('Y-m-d')) : date('Y-m-d');
            $dueDate = $invoice->due_date ? (is_string($invoice->due_date) ? substr($invoice->due_date, 0, 10) : $invoice->due_date->format('Y-m-d')) : date('Y-m-d');
            $status = strtoupper($invoice->status);
            $invNum = $invoice->number;

            // Company Name Wise PDF Filename (e.g. ABC_Traders_Ltd_INV-2026-0001.pdf)
            $companySlug = preg_replace('/[^A-Za-z0-9_-]/', '_', $companyName);
            $companySlug = trim(preg_replace('/_+/', '_', $companySlug), '_');
            $fileName = "{$companySlug}_{$invNum}.pdf";

            $pdf = Pdf::loadView('pdf.invoice', [
                'invNum' => $invNum,
                'companyName' => $companyName,
                'tin' => $tin,
                'bin' => $bin,
                'issueDate' => $issueDate,
                'dueDate' => $dueDate,
                'amountFmt' => $amountFmt,
                'status' => $status,
            ])->setPaper('a4');

            return $pdf->download($fileName);
        } catch (Throwable $e) {
            Log::error('Invoice download exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to generate invoice PDF.'], 500);
        }
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        try {
            $invoice->delete();
            return response()->json(['success' => true, 'message' => 'Invoice deleted successfully']);
        } catch (Throwable $e) {
            Log::error('Invoice destroy exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete invoice.'], 500);
        }
    }
}
