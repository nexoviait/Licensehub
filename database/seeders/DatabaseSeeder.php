<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\ComplianceEvent;
use App\Models\Reminder;
use App\Models\VaultDocument;
use App\Models\ShareLog;
use App\Models\TaxFiling;
use App\Models\LegalMatter;
use App\Models\Engagement;
use App\Models\ClientAccess;
use App\Models\Task;
use App\Models\Workflow;
use App\Models\Invoice;
use App\Models\ExportRecord;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleAndPermissionSeeder::class);

        // 1. Companies
        $companiesData = [
            ['name' => 'ABC Traders Ltd.', 'entity_type' => 'Private Limited Company', 'tin' => '123456789012', 'bin' => '001234567-0101', 'rjsc' => 'C-145892/2018', 'address' => 'Motijheel C/A, Dhaka 1000', 'email' => 'md.sahadathossain.ld@gmail.com', 'phone' => '+8801712345678', 'directors' => 4, 'branches' => 3, 'next_due' => '2026-08-02', 'next_due_label' => 'Trade License Renewal', 'status' => 'upcoming', 'logo' => 'AT'],
            ['name' => 'Nova Textiles', 'entity_type' => 'Public Limited Company', 'tin' => '987654321098', 'bin' => '009876543-0202', 'rjsc' => 'C-198234/2021', 'address' => 'Uttara Sector 3, Dhaka 1230', 'email' => 'nexoviait@gmail.com', 'phone' => '+8801812345679', 'directors' => 3, 'branches' => 5, 'next_due' => '2026-07-25', 'next_due_label' => 'VAT Return (Monthly)', 'status' => 'upcoming', 'logo' => 'NT'],
            ['name' => 'Meridian Foods', 'entity_type' => 'Sole Proprietorship', 'tin' => '456789123045', 'bin' => '004567891-0303', 'rjsc' => 'TR-88912', 'address' => 'Khatunganj, Chattogram', 'email' => 'info@meridianfoods.com', 'phone' => '+8801912345680', 'directors' => 1, 'branches' => 2, 'next_due' => '2026-07-15', 'next_due_label' => 'Income Tax Return', 'status' => 'overdue', 'logo' => 'MF'],
            ['name' => 'Kabir & Sons', 'entity_type' => 'Partnership', 'tin' => '654321987065', 'bin' => '006543219-0404', 'rjsc' => 'P-44512/2015', 'address' => 'Zindabazar, Sylhet', 'email' => 'contact@kabirsons.com', 'phone' => '+8801612345681', 'directors' => 2, 'branches' => 1, 'next_due' => '2026-09-10', 'next_due_label' => 'Partnership Deed Renewal', 'status' => 'completed', 'logo' => 'KS'],
            ['name' => 'Zenith Logistics', 'entity_type' => 'One Person Company (OPC)', 'tin' => '321987654032', 'bin' => '003219876-0505', 'rjsc' => 'C-220194/2022', 'address' => 'Agrabad C/A, Chattogram', 'email' => 'admin@zenithlogistics.com', 'phone' => '+8801512345682', 'directors' => 1, 'branches' => 4, 'next_due' => '2026-07-28', 'next_due_label' => 'AGM Filing (Schedule X)', 'status' => 'upcoming', 'logo' => 'ZL'],
            ['name' => 'Ariya Pharmaceuticals', 'entity_type' => 'Private Limited Company', 'tin' => '789123456078', 'bin' => '007891234-0606', 'rjsc' => 'C-112340/2014', 'address' => 'Tejgaon I/A, Dhaka 1208', 'email' => 'compliance@ariyapharma.com', 'phone' => '+8801712345683', 'directors' => 6, 'branches' => 12, 'next_due' => '2026-08-15', 'next_due_label' => 'Drug License Renewal', 'status' => 'completed', 'logo' => 'AP'],
            ['name' => 'Rahman Consulting', 'entity_type' => 'Sole Proprietorship', 'tin' => '159753486015', 'bin' => '001597534-0707', 'rjsc' => 'TR-99012', 'address' => 'Dhanmondi, Dhaka 1209', 'email' => 'support@rahmanconsulting.com', 'phone' => '+8801812345684', 'directors' => 1, 'branches' => 1, 'next_due' => '2026-07-30', 'next_due_label' => 'TDS Return Q2', 'status' => 'upcoming', 'logo' => 'RC'],
            ['name' => 'Sundarban Ventures', 'entity_type' => 'Branch Office', 'tin' => '852963741085', 'bin' => '008529637-0808', 'rjsc' => 'C-205114/2023', 'address' => 'Khulna Sadar, Khulna', 'email' => 'info@sundarbanventures.com', 'phone' => '+8801912345685', 'directors' => 3, 'branches' => 2, 'next_due' => '2026-08-08', 'next_due_label' => 'Audit Report Submission', 'status' => 'upcoming', 'logo' => 'SV'],
            ['name' => 'Hope Foundation', 'entity_type' => 'NGO', 'tin' => '963852741096', 'bin' => '009638527-0909', 'rjsc' => 'NGO-77812/2010', 'address' => 'Mirpur 10, Dhaka 1216', 'email' => 'contact@hopefoundation.org', 'phone' => '+8801612345686', 'directors' => 7, 'branches' => 8, 'next_due' => '2026-08-20', 'next_due_label' => 'NGO Bureau Annual Return', 'status' => 'upcoming', 'logo' => 'HF'],
            ['name' => 'Emerald Realty', 'entity_type' => 'Trust', 'tin' => '741852963074', 'bin' => '007418529-1010', 'rjsc' => 'C-188901/2020', 'address' => 'Gulshan 2, Dhaka 1212', 'email' => 'sales@emeraldrealty.com', 'phone' => '+8801512345687', 'directors' => 4, 'branches' => 2, 'next_due' => '2026-08-02', 'next_due_label' => 'Trade License Renewal', 'status' => 'upcoming', 'logo' => 'ER'],
        ];

        foreach ($companiesData as $c) {
            Company::create($c);
        }

        $c1 = Company::first();
        $now = Carbon::now();
        $prevMonth = $now->copy()->subMonth();
        $nextMonth = $now->copy()->addMonth();
        $nextMonth2 = $now->copy()->addMonths(2);

        // 2. Compliance Events across Previous, Current, Next, and Following Months
        $eventsData = [
            // Previous Month Events
            ['company_id' => 1, 'type' => 'Income Tax', 'title' => 'Annual Income Tax Return', 'status' => 'completed', 'assignee' => 'Rahat CA', 'date' => $prevMonth->copy()->startOfMonth()->addDays(4)->format('Y-m-d')],
            ['company_id' => 2, 'type' => 'VAT Return', 'title' => 'Monthly VAT (Mushak 9.1)', 'status' => 'completed', 'assignee' => 'Nadia CA', 'date' => $prevMonth->copy()->startOfMonth()->addDays(11)->format('Y-m-d')],
            ['company_id' => 3, 'type' => 'RJSC Filing', 'title' => 'Return of Allotment', 'status' => 'completed', 'assignee' => 'Adv. Hasan', 'date' => $prevMonth->copy()->startOfMonth()->addDays(17)->format('Y-m-d')],
            ['company_id' => 4, 'type' => 'Audit Report', 'title' => 'Q2 Internal Audit', 'status' => 'completed', 'assignee' => 'M. Karim', 'date' => $prevMonth->copy()->startOfMonth()->addDays(23)->format('Y-m-d')],

            // Current Month Events
            ['company_id' => 1, 'type' => 'VAT Return', 'title' => 'Monthly VAT (Mushak 9.1)', 'status' => 'completed', 'assignee' => 'Nadia CA', 'date' => $now->copy()->startOfMonth()->addDays(1)->format('Y-m-d')],
            ['company_id' => 1, 'type' => 'Trade License', 'title' => 'Trade License Renewal', 'status' => 'completed', 'assignee' => 'Adv. Hasan', 'date' => $now->copy()->startOfMonth()->addDays(4)->format('Y-m-d')],
            ['company_id' => 5, 'type' => 'TDS Return', 'title' => 'TDS Return (Quarterly)', 'status' => 'overdue', 'assignee' => 'Rahat CA', 'date' => $now->copy()->startOfMonth()->addDays(7)->format('Y-m-d')],
            ['company_id' => 2, 'type' => 'VAT Return', 'title' => 'Monthly VAT (Mushak 9.1)', 'status' => 'upcoming', 'assignee' => 'Nadia CA', 'date' => $now->copy()->startOfMonth()->addDays(11)->format('Y-m-d')],
            ['company_id' => 6, 'type' => 'Trade License', 'title' => 'Drug License Renewal', 'status' => 'upcoming', 'assignee' => 'Adv. Hasan', 'date' => $now->copy()->startOfMonth()->addDays(14)->format('Y-m-d')],
            ['company_id' => 7, 'type' => 'Trade License', 'title' => 'City Corp Trade License', 'status' => 'upcoming', 'assignee' => 'Adv. Hasan', 'date' => $now->copy()->startOfMonth()->addDays(19)->format('Y-m-d')],
            ['company_id' => 8, 'type' => 'RJSC Filing', 'title' => 'AGM Filing (Schedule X)', 'status' => 'upcoming', 'assignee' => 'Adv. Hasan', 'date' => $now->copy()->startOfMonth()->addDays(24)->format('Y-m-d')],
            ['company_id' => 3, 'type' => 'Audit Report', 'title' => 'Statutory Audit Submission', 'status' => 'upcoming', 'assignee' => 'M. Karim', 'date' => $now->copy()->startOfMonth()->addDays(27)->format('Y-m-d')],

            // Next Month Events
            ['company_id' => 9, 'type' => 'NGO Bureau Report', 'title' => 'NGO Bureau Annual Report', 'status' => 'upcoming', 'assignee' => 'Adv. Hasan', 'date' => $nextMonth->copy()->startOfMonth()->addDays(3)->format('Y-m-d')],
            ['company_id' => 1, 'type' => 'VAT Return', 'title' => 'Monthly VAT (Mushak 9.1)', 'status' => 'upcoming', 'assignee' => 'Nadia CA', 'date' => $nextMonth->copy()->startOfMonth()->addDays(9)->format('Y-m-d')],
            ['company_id' => 4, 'type' => 'Partnership Deed', 'title' => 'Partnership Deed Renewal', 'status' => 'upcoming', 'assignee' => 'M. Karim', 'date' => $nextMonth->copy()->startOfMonth()->addDays(14)->format('Y-m-d')],
            ['company_id' => 2, 'type' => 'Income Tax', 'title' => 'Advance Income Tax Q3', 'status' => 'upcoming', 'assignee' => 'Rahat CA', 'date' => $nextMonth->copy()->startOfMonth()->addDays(21)->format('Y-m-d')],
            ['company_id' => 5, 'type' => 'RJSC Filing', 'title' => 'Form XII Directors Return', 'status' => 'upcoming', 'assignee' => 'Adv. Hasan', 'date' => $nextMonth->copy()->startOfMonth()->addDays(26)->format('Y-m-d')],

            // Following Month (+2 Months) Events
            ['company_id' => 6, 'type' => 'Drug License', 'title' => 'Bi-Annual Inspection Report', 'status' => 'upcoming', 'assignee' => 'M. Karim', 'date' => $nextMonth2->copy()->startOfMonth()->addDays(6)->format('Y-m-d')],
            ['company_id' => 1, 'type' => 'Trade License', 'title' => 'Fire License Renewal', 'status' => 'upcoming', 'assignee' => 'Adv. Hasan', 'date' => $nextMonth2->copy()->startOfMonth()->addDays(15)->format('Y-m-d')],
            ['company_id' => 3, 'type' => 'VAT Return', 'title' => 'Quarterly VAT Audit', 'status' => 'upcoming', 'assignee' => 'Nadia CA', 'date' => $nextMonth2->copy()->startOfMonth()->addDays(22)->format('Y-m-d')],
        ];
        foreach ($eventsData as $ed) {
            ComplianceEvent::create($ed);
        }

        // 3. Reminders across Previous, Current, and Next Months
        Reminder::create(['company_id' => $c1->id, 'title' => 'Trade License Renewal – Acme Ltd', 'channel' => 'Email + SMS', 'due_date' => $now->copy()->addDays(5)->format('Y-m-d'), 'status' => 'upcoming']);
        Reminder::create(['company_id' => 2, 'title' => 'VAT Return – Nova Foods', 'channel' => 'Email', 'due_date' => $now->copy()->addDays(9)->format('Y-m-d'), 'status' => 'upcoming']);
        Reminder::create(['company_id' => 3, 'title' => 'BIDA Renewal – Helios Tech', 'channel' => 'Email + SMS', 'due_date' => $prevMonth->copy()->addDays(10)->format('Y-m-d'), 'status' => 'overdue']);
        Reminder::create(['company_id' => 5, 'title' => 'TDS Return Filing – Zenith Group', 'channel' => 'SMS', 'due_date' => $prevMonth->copy()->addDays(15)->format('Y-m-d'), 'status' => 'overdue']);
        Reminder::create(['company_id' => 1, 'title' => 'Income Tax filing – ABC Traders', 'channel' => 'Email', 'due_date' => $prevMonth->copy()->addDays(20)->format('Y-m-d'), 'status' => 'done']);

        // 4. Vault Documents
        $docsData = [
            ['company_id' => 1, 'name' => 'ABC-Traders-TradeLicense-2026.pdf', 'category' => 'Trade License', 'size' => '1.2 MB', 'uploaded_at' => '2026-07-04', 'starred' => true, 'confidential' => true, 'ext' => 'pdf'],
            ['company_id' => 2, 'name' => 'NovaTextiles-VAT-JuneReturn.xlsx', 'category' => 'VAT Return', 'size' => '312 KB', 'uploaded_at' => '2026-07-10', 'starred' => false, 'confidential' => false, 'ext' => 'xlsx'],
            ['company_id' => 3, 'name' => 'MeridianFoods-IncomeTax-FY2025.pdf', 'category' => 'Tax Return', 'size' => '2.8 MB', 'uploaded_at' => '2026-06-30', 'starred' => true, 'confidential' => true, 'ext' => 'pdf'],
            ['company_id' => 5, 'name' => 'Zenith-RJSC-AGM-Filing.pdf', 'category' => 'RJSC Filing', 'size' => '890 KB', 'uploaded_at' => '2026-07-12', 'starred' => false, 'confidential' => false, 'ext' => 'pdf'],
            ['company_id' => 6, 'name' => 'Ariya-Drug-License-Renewal.pdf', 'category' => 'Trade License', 'size' => '1.6 MB', 'uploaded_at' => '2026-05-22', 'starred' => true, 'confidential' => true, 'ext' => 'pdf'],
            ['company_id' => 9, 'name' => 'Hope-NGO-BIN-Certificate.png', 'category' => 'BIN/VAT Registration', 'size' => '540 KB', 'uploaded_at' => '2026-04-15', 'starred' => false, 'confidential' => false, 'ext' => 'png'],
            ['company_id' => 4, 'name' => 'Kabir-Sons-Partnership-Deed.docx', 'category' => 'Contract', 'size' => '220 KB', 'uploaded_at' => '2026-03-11', 'starred' => true, 'confidential' => true, 'ext' => 'docx'],
        ];
        foreach ($docsData as $dd) {
            VaultDocument::create($dd);
        }

        // 5. Share Logs
        ShareLog::create(['company_id' => $c1->id, 'subject' => 'Trade License Renewal – Nova Textiles', 'recipients' => 'cfo@novatextiles.com', 'body' => 'Notice for trade license renewal.', 'attachments' => 'Nova-TL-2026.pdf', 'sent_at' => '2026-07-14 10:22', 'status' => 'Opened']);
        ShareLog::create(['company_id' => 2, 'subject' => 'VAT Return Q2 filed – Ariya Pharma', 'recipients' => 'accounts@ariya.com, director@ariya.com', 'body' => 'VAT Return Q2 filed successfully.', 'attachments' => 'Ariya-VAT-Q2.xlsx, Ack.pdf', 'sent_at' => '2026-07-12 16:05', 'status' => 'Delivered']);
        ShareLog::create(['company_id' => 5, 'subject' => 'Documents required – Zenith Logistics', 'recipients' => 'ops@zenith.co', 'body' => 'Please provide bank statements and sales register.', 'attachments' => 'Zenith-DocRequest.pdf', 'sent_at' => '2026-07-10 09:12', 'status' => 'pending']);
        ShareLog::create(['company_id' => 3, 'subject' => 'AGM Filing acknowledgement', 'recipients' => 'board@meridianfoods.com', 'body' => 'AGM Filing acknowledgement attached.', 'attachments' => 'Meridian-AGM.pdf', 'sent_at' => '2026-07-08 12:45', 'status' => 'bounced']);

        // 6. Tax Filings
        TaxFiling::create(['company_id' => $c1->id, 'tax_type' => 'Monthly VAT (Mushak 9.1)', 'period' => 'June 2026', 'amount' => 450000, 'due_date' => '2026-07-15', 'status' => 'completed', 'reference' => 'VAT-2026-07-889']);
        TaxFiling::create(['company_id' => 2, 'tax_type' => 'Monthly VAT (Mushak 9.1)', 'period' => 'June 2026', 'amount' => 1280000, 'due_date' => '2026-07-15', 'status' => 'completed', 'reference' => 'VAT-2026-07-991']);

        // 7. Legal Matters
        LegalMatter::create(['company_id' => $c1->id, 'title' => 'Share transfer dispute with minority shareholder', 'matter_type' => 'RJSC Dispute', 'lawyer' => 'Adv. Mahbubur Rahman', 'priority' => 'high', 'status' => 'active', 'next_hearing' => '2026-07-28']);

        // 8. Engagements
        Engagement::create(['company_id' => $c1->id, 'engagement_type' => 'Statutory Audit', 'accountant' => 'Kamal Hossain', 'fee' => 250000, 'status' => 'active', 'next_milestone' => 'Draft financial statements', 'next_milestone_date' => '2026-07-25']);

        // 9. Client Accesses
        ClientAccess::create(['company_id' => $c1->id, 'contact_name' => 'Mahmudul Karim', 'contact_email' => 'mahmudul@abctraders.com', 'role' => 'Owner', 'status' => 'active', 'last_login' => '2026-07-18 08:40', 'documents_shared' => 12]);

        // 10. Tasks
        Task::create(['company_id' => $c1->id, 'title' => 'Collect trade license documents', 'assignee' => 'Rahim Uddin', 'priority' => 'high', 'status' => 'in_progress', 'due_date' => '2026-07-22']);

        // 11. Workflows
        Workflow::create(['name' => 'Trade license renewal nudge', 'trigger' => 'Deadline approaching (7 days)', 'action' => 'Send email reminder', 'status' => 'active', 'runs' => 142, 'last_run' => '2026-07-18 09:00', 'success_rate' => 98]);

        // 12. Invoices
        Invoice::create(['company_id' => $c1->id, 'number' => 'INV-2026-0001', 'amount' => 45000, 'issue_date' => '2026-06-01', 'due_date' => '2026-06-15', 'status' => 'paid']);

        // 13. Export Records
        ExportRecord::create(['report_name' => 'Compliance Summary', 'format' => 'PDF', 'generated_by' => 'Sadia Ahmed', 'generated_at' => '2026-07-15 09:12', 'size' => '1.4 MB']);
    }
}
