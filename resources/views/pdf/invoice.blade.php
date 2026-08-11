<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{{ $invNum }}</title>
<style>
    @page { margin: 34px 40px; }
    * { box-sizing: border-box; }
    body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        color: #1f2430;
        font-size: 12px;
        line-height: 1.5;
    }

    .brand-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
    .brand-table td { vertical-align: top; }
    .brand-mark {
        display: inline-block;
        width: 34px;
        height: 34px;
        background: #14532d;
        border-radius: 8px;
        color: #ffffff;
        text-align: center;
        font-size: 17px;
        font-weight: bold;
        line-height: 34px;
    }
    .brand-name { font-size: 18px; font-weight: bold; color: #14532d; padding-top: 6px; }
    .brand-sub { font-size: 10px; color: #6b7280; margin-top: 1px; }

    .doc-title { text-align: right; font-size: 22px; font-weight: bold; letter-spacing: 1px; color: #14532d; }
    .doc-number { text-align: right; font-size: 11px; color: #6b7280; margin-top: 3px; }

    .status-pill {
        display: inline-block;
        margin-top: 8px;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.5px;
    }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .status-draft { background: #e5e7eb; color: #374151; }

    .rule { border: none; border-top: 2px solid #14532d; margin: 0 0 20px 0; }

    .parties-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
    .parties-table td { width: 33.33%; vertical-align: top; padding-right: 16px; }
    .party-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: #9ca3af; font-weight: bold; margin-bottom: 5px; }
    .party-name { font-size: 12.5px; font-weight: bold; color: #111827; margin-bottom: 3px; }
    .party-line { font-size: 10.5px; color: #4b5563; margin-bottom: 1px; }

    table.items { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    table.items thead th {
        background: #14532d;
        color: #ffffff;
        font-size: 9.5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-align: left;
        padding: 9px 10px;
    }
    table.items thead th.num { text-align: right; }
    table.items tbody td {
        padding: 10px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 11.5px;
        color: #1f2430;
    }
    table.items tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
    table.items tbody tr:nth-child(even) td { background: #f9fafb; }

    .totals-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .totals-table td { padding: 4px 0; font-size: 11.5px; }
    .totals-table td.label { text-align: right; color: #6b7280; padding-right: 14px; }
    .totals-table td.value { text-align: right; width: 130px; font-variant-numeric: tabular-nums; }
    .totals-table tr.grand td { border-top: 2px solid #14532d; padding-top: 8px; }
    .totals-table tr.grand td.label { color: #14532d; font-weight: bold; font-size: 13px; }
    .totals-table tr.grand td.value { color: #14532d; font-weight: bold; font-size: 15px; }

    .notes-box {
        margin-top: 26px;
        background: #f6f8f6;
        border-left: 3px solid #14532d;
        padding: 12px 14px;
        font-size: 10.5px;
        color: #374151;
    }
    .notes-box .notes-title { font-weight: bold; color: #14532d; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
    .notes-box p { margin: 2px 0; }

    .footer-table { width: 100%; border-collapse: collapse; margin-top: 34px; }
    .footer-table td { vertical-align: bottom; font-size: 10px; color: #6b7280; }
    .sig-line { border-top: 1px solid #9ca3af; width: 180px; margin-bottom: 4px; }
    .sig-label { font-size: 10px; color: #6b7280; }
    .footer-note { text-align: right; font-size: 9px; color: #9ca3af; }
</style>
</head>
<body>

    <table class="brand-table">
        <tr>
            <td style="width: 60%;">
                <span class="brand-mark">L</span>
                <div class="brand-name">LicenseHub</div>
                <div class="brand-sub">Compliance Gateway &middot; Bangladesh</div>
            </td>
            <td style="width: 40%;">
                <div class="doc-title">INVOICE</div>
                <div class="doc-number">{{ $invNum }}</div>
                <div style="text-align: right;">
                    <span class="status-pill status-{{ strtolower($status) }}">{{ $status }}</span>
                </div>
            </td>
        </tr>
    </table>

    <hr class="rule">

    <table class="parties-table">
        <tr>
            <td>
                <div class="party-label">Issued By</div>
                <div class="party-name">LicenseHub Bangladesh Ltd.</div>
                <div class="party-line">Gulshan Tower, Level 8, Dhaka</div>
                <div class="party-line">billing@licensehub.io</div>
                <div class="party-line">www.licensehub.io</div>
            </td>
            <td>
                <div class="party-label">Billed To</div>
                <div class="party-name">{{ $companyName }}</div>
                <div class="party-line">TIN: {{ $tin }}</div>
                <div class="party-line">BIN: {{ $bin }}</div>
            </td>
            <td>
                <div class="party-label">Invoice Details</div>
                <div class="party-line"><strong>Issue Date:</strong> {{ $issueDate }}</div>
                <div class="party-line"><strong>Due Date:</strong> {{ $dueDate }}</div>
                <div class="party-line"><strong>Currency:</strong> BDT</div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 8%;">SL</th>
                <th style="width: 52%;">Description</th>
                <th class="num" style="width: 10%;">Qty</th>
                <th class="num" style="width: 15%;">Unit Price</th>
                <th class="num" style="width: 15%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>01</td>
                <td>Corporate Tax &amp; License Compliance Service</td>
                <td class="num">1</td>
                <td class="num">BDT {{ $amountFmt }}</td>
                <td class="num">BDT {{ $amountFmt }}</td>
            </tr>
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td class="label">Subtotal</td>
            <td class="value">BDT {{ $amountFmt }}</td>
        </tr>
        <tr>
            <td class="label">VAT (0%)</td>
            <td class="value">BDT 0.00</td>
        </tr>
        <tr class="grand">
            <td class="label">Grand Total</td>
            <td class="value">BDT {{ $amountFmt }}</td>
        </tr>
    </table>

    <div class="notes-box">
        <div class="notes-title">Terms &amp; Payment Instructions</div>
        <p>1. Pay via direct bank transfer or MFS gateway &mdash; City Bank, A/C #1501009842.</p>
        <p>2. This is an electronically generated invoice and does not require a physical signature.</p>
    </div>

    <table class="footer-table">
        <tr>
            <td style="width: 50%;">
                <div class="sig-line">&nbsp;</div>
                <div class="sig-label">Authorized Signatory &middot; LicenseHub Accounts</div>
            </td>
            <td class="footer-note">Generated by LicenseHub Compliance Gateway on {{ $issueDate }}</td>
        </tr>
    </table>

</body>
</html>
