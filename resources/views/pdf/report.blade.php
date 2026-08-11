<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{{ $title }}</title>
<style>
    @page { margin: 32px 36px; }
    * { box-sizing: border-box; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1f2430; font-size: 10.5px; }

    .brand-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .brand-mark {
        display: inline-block; width: 30px; height: 30px; background: #14532d;
        border-radius: 7px; color: #fff; text-align: center; font-size: 15px;
        font-weight: bold; line-height: 30px;
    }
    .brand-name { font-size: 14px; font-weight: bold; color: #14532d; padding-top: 5px; }
    .doc-title { text-align: right; font-size: 17px; font-weight: bold; color: #14532d; }
    .doc-sub { text-align: right; font-size: 9.5px; color: #6b7280; margin-top: 2px; }

    .rule { border: none; border-top: 2px solid #14532d; margin: 0 0 14px 0; }

    table.data { width: 100%; border-collapse: collapse; }
    table.data thead th {
        background: #14532d; color: #fff; font-size: 8.5px; text-transform: uppercase;
        letter-spacing: 0.4px; text-align: left; padding: 7px 8px;
    }
    table.data tbody td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 9.5px; }
    table.data tbody tr:nth-child(even) td { background: #f9fafb; }

    .footer { margin-top: 18px; font-size: 8.5px; color: #9ca3af; text-align: right; }
</style>
</head>
<body>

    <table class="brand-table">
        <tr>
            <td style="width: 60%;">
                <span class="brand-mark">L</span>
                <div class="brand-name">LicenseHub</div>
            </td>
            <td style="width: 40%;">
                <div class="doc-title">{{ $title }}</div>
                <div class="doc-sub">Generated {{ $generatedAt }} &middot; {{ count($rows) }} record{{ count($rows) === 1 ? '' : 's' }}</div>
            </td>
        </tr>
    </table>

    <hr class="rule">

    <table class="data">
        <thead>
            <tr>
                @foreach ($headings as $h)
                    <th>{{ $h }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr><td colspan="{{ count($headings) }}" style="text-align:center; color:#9ca3af; padding: 16px;">No records found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">LicenseHub Compliance Gateway &middot; {{ $generatedAt }}</div>

</body>
</html>
