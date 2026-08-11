<?php

namespace App\Http\Controllers\Api;

use App\Exports\GenericArrayExport;
use App\Http\Controllers\Controller;
use App\Models\ClientAccess;
use App\Models\Company;
use App\Models\ExportRecord;
use App\Models\Reminder;
use App\Models\ShareLog;
use App\Models\Task;
use App\Models\TaxFiling;
use App\Models\VaultDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class ReportController extends Controller
{
    private const REPORTS = [
        'compliance-summary' => 'Compliance Summary',
        'tax-filing' => 'Tax Filing Report',
        'document-audit' => 'Document Audit Log',
        'company-directory' => 'Company Directory',
        'overdue-items' => 'Overdue Items Report',
        'client-activity' => 'Client Activity Report',
    ];

    public function export(Request $request, string $report)
    {
        try {
            if (!array_key_exists($report, self::REPORTS)) {
                return response()->json(['success' => false, 'message' => 'Unknown report'], 404);
            }

            $format = strtolower($request->query('format', 'pdf'));
            if (!in_array($format, ['pdf', 'csv', 'xlsx'], true)) {
                return response()->json(['success' => false, 'message' => 'Unsupported format'], 422);
            }

            $title = self::REPORTS[$report];
            [$headings, $rows] = $this->dataset($report);

            $generatedAt = now()->format('Y-m-d H:i');
            $slug = str_replace(' ', '_', $title);

            if ($format === 'pdf') {
                $pdf = Pdf::loadView('pdf.report', [
                    'title' => $title,
                    'headings' => $headings,
                    'rows' => $rows,
                    'generatedAt' => $generatedAt,
                ])->setPaper('a4', 'landscape');
                $bytes = $pdf->output();
                $fileName = "{$slug}.pdf";
                $mime = 'application/pdf';
            } elseif ($format === 'csv') {
                $bytes = $this->toCsv($headings, $rows);
                $fileName = "{$slug}.csv";
                $mime = 'text/csv';
            } else {
                $fileName = "{$slug}.xlsx";
                $mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                $bytes = Excel::raw(new GenericArrayExport($headings, $rows, $title), \Maatwebsite\Excel\Excel::XLSX);
            }

            ExportRecord::create([
                'report_name' => $title,
                'format' => strtoupper($format),
                'generated_by' => $request->user('api')?->name ?? 'Unknown',
                'generated_at' => $generatedAt,
                'size' => $this->formatBytes(strlen($bytes)),
            ]);

            return Response::make($bytes, 200, [
                'Content-Type' => $mime,
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            ]);
        } catch (Throwable $e) {
            Log::error('Report export exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to generate report export.'], 500);
        }
    }

    private function toCsv(array $headings, array $rows): string
    {
        $fh = fopen('php://temp', 'w+');
        fputcsv($fh, $headings);
        foreach ($rows as $row) {
            fputcsv($fh, $row);
        }
        rewind($fh);
        $csv = stream_get_contents($fh);
        fclose($fh);
        return $csv;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return number_format($bytes / (1024 * 1024), 1) . ' MB';
        }
        return number_format($bytes / 1024, 1) . ' KB';
    }

    /**
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function dataset(string $report): array
    {
        return match ($report) {
            'compliance-summary' => $this->complianceSummary(),
            'tax-filing' => $this->taxFiling(),
            'document-audit' => $this->documentAudit(),
            'company-directory' => $this->companyDirectory(),
            'overdue-items' => $this->overdueItems(),
            'client-activity' => $this->clientActivity(),
            default => [[], []],
        };
    }

    private function complianceSummary(): array
    {
        $headings = ['Company', 'Entity Type', 'Status', 'Next Obligation', 'Due Date'];
        $rows = Company::orderBy('name')->get()->map(fn ($c) => [
            $c->name,
            $c->entity_type,
            ucfirst($c->status),
            $c->next_due_label,
            optional($c->next_due)->format('Y-m-d') ?? '',
        ])->all();
        return [$headings, $rows];
    }

    private function taxFiling(): array
    {
        $headings = ['Company', 'Tax Type', 'Period', 'Amount (BDT)', 'Due Date', 'Status'];
        $rows = TaxFiling::with('company')->orderBy('due_date')->get()->map(fn ($f) => [
            $f->company->name ?? '—',
            $f->tax_type,
            $f->period,
            number_format($f->amount, 2),
            optional($f->due_date)->format('Y-m-d') ?? '',
            ucfirst($f->status),
        ])->all();
        return [$headings, $rows];
    }

    private function documentAudit(): array
    {
        $headings = ['Event', 'Company', 'Detail', 'Date', 'Status'];
        $uploads = VaultDocument::with('company')->get()->map(fn ($d) => [
            'Upload',
            $d->company->name ?? '—',
            $d->name . ' (' . $d->category . ')',
            optional($d->uploaded_at)->format('Y-m-d') ?? '',
            $d->confidential ? 'Confidential' : 'Standard',
        ]);
        $shares = ShareLog::with('company')->get()->map(fn ($s) => [
            'Share',
            $s->company->name ?? '—',
            $s->subject,
            is_string($s->sent_at) ? substr($s->sent_at, 0, 10) : (string) $s->sent_at,
            ucfirst($s->status),
        ]);
        $rows = $uploads->concat($shares)->sortByDesc(fn ($r) => $r[3])->values()->all();
        return [$headings, $rows];
    }

    private function companyDirectory(): array
    {
        $headings = ['Company', 'Entity Type', 'TIN', 'BIN', 'RJSC', 'Directors', 'Branches', 'Address'];
        $rows = Company::orderBy('name')->get()->map(fn ($c) => [
            $c->name,
            $c->entity_type,
            $c->tin,
            $c->bin,
            $c->rjsc,
            $c->directors,
            $c->branches,
            $c->address,
        ])->all();
        return [$headings, $rows];
    }

    private function overdueItems(): array
    {
        $headings = ['Type', 'Company', 'Description', 'Due Date', 'Assignee/Status'];

        $filings = TaxFiling::with('company')->where('status', 'overdue')->get()->map(fn ($f) => [
            'Tax Filing',
            $f->company->name ?? '—',
            $f->tax_type . ' — ' . $f->period,
            optional($f->due_date)->format('Y-m-d') ?? '',
            'Overdue',
        ]);

        $tasks = Task::with('company')
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '<', now()->toDateString())
            ->get()
            ->map(fn ($t) => [
                'Task',
                $t->company->name ?? '—',
                $t->title,
                optional($t->due_date)->format('Y-m-d') ?? '',
                $t->assignee,
            ]);

        $reminders = Reminder::with('company')->where('status', 'overdue')->get()->map(fn ($r) => [
            'Reminder',
            $r->company->name ?? '—',
            $r->title,
            optional($r->due_date)->format('Y-m-d') ?? '',
            $r->channel,
        ]);

        $rows = $filings->concat($tasks)->concat($reminders)->sortBy(fn ($r) => $r[3])->values()->all();
        return [$headings, $rows];
    }

    private function clientActivity(): array
    {
        $headings = ['Contact', 'Email', 'Company', 'Role', 'Status', 'Last Login', 'Documents Shared'];
        $rows = ClientAccess::with('company')->orderBy('contact_name')->get()->map(fn ($c) => [
            $c->contact_name,
            $c->contact_email,
            $c->company->name ?? '—',
            $c->role,
            ucfirst($c->status),
            $c->last_login ?: 'Never',
            $c->documents_shared,
        ])->all();
        return [$headings, $rows];
    }
}
