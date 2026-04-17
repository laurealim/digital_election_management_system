<!DOCTYPE html>
<html lang="bn">

<head>
    <meta charset="UTF-8">
    <title>প্রার্থিতা গ্রহণের প্রত্যয়নপত্র — {{ $nomination->token_number }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'kalpurush', 'freeserif', sans-serif;
            font-size: 10.5pt;
            color: #1a1a1a;
            line-height: 1.7;
        }

        /* ── Letterhead ── */
        .lh-outer {
            border: 2.5px solid #1a4f8a;
            padding: 10px 12px 8px 12px;
            margin-bottom: 0;
        }

        .lh-tbl {
            width: 100%;
            border-collapse: collapse;
        }

        .lh-logo {
            width: 68px;
            text-align: center;
            vertical-align: middle;
            padding-right: 10px;
        }

        .lh-center {
            text-align: center;
            vertical-align: middle;
            padding: 0 8px;
        }

        .lh-seal {
            width: 80px;
            text-align: center;
            vertical-align: middle;
            padding-left: 10px;
            border-left: 1px solid #c0cfe4;
        }

        .logo-ring {
            width: 56px;
            height: 56px;
            border: 2.5px solid #1a4f8a;
            border-radius: 28px;
            margin: 0 auto;
            text-align: center;
            padding-top: 8px;
        }

        .seal-box {
            width: 72px;
            height: 72px;
            border: 2px dashed #bbb;
            margin: 0 auto;
            text-align: center;
            padding-top: 16px;
            font-size: 7.5pt;
            color: #bbb;
            line-height: 1.4;
        }

        /* ── Decorative double rule ── */
        .dbl-rule {
            border-top: 3px double #1a4f8a;
            margin: 8px 0 12px 0;
        }

        /* ── Meta row (ref + date) ── */
        .meta-tbl {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 10pt;
        }

        /* ── Addressee ── */
        .addressee {
            margin-bottom: 12px;
            font-size: 10.5pt;
        }

        /* ── Subject line ── */
        .subject {
            border-left: 4px solid #1a4f8a;
            padding: 4px 10px;
            background: #eef3fb;
            font-size: 10.5pt;
            margin-bottom: 14px;
        }

        /* ── Salutation ── */
        .salute {
            margin-bottom: 10px;
        }

        /* ── Body paragraph ── */
        .para {
            text-indent: 24pt;
            margin-bottom: 10px;
            font-size: 10.5pt;
            text-align: justify;
            line-height: 1.8;
        }

        /* ── Accepted posts table ── */
        .posts-tbl {
            width: 80%;
            border-collapse: collapse;
            margin: 8px auto 14px;
            font-size: 10pt;
        }

        .posts-tbl td {
            border: 1px solid #c0cfe4;
            padding: 4px 10px;
        }

        .posts-tbl td.posts-hd {
            background: #1a4f8a;
            color: #fff;
            border: 1px solid #1a4f8a;
            text-align: left;
        }

        .posts-tbl tr:nth-child(even) td {
            background: #f4f8ff;
        }

        /* ── Election detail table ── */
        .el-tbl {
            width: 80%;
            border-collapse: collapse;
            margin: 8px auto 14px;
            font-size: 10pt;
        }

        .el-tbl td {
            border: 1px solid #c0cfe4;
            padding: 4px 10px;
        }

        .el-tbl td.lb {
            background: #eef3fb;
            color: #1a4f8a;
            width: 42%;
        }

        /* ── Closing ── */
        .closing {
            margin-top: 6px;
            margin-bottom: 4px;
        }

        /* ── Signature block ── */
        .sig-block {
            text-align: right;
            margin-top: 14px;
        }

        .sig-line {
            border-top: 1.5px solid #333;
            width: 210px;
            margin-left: auto;
            margin-top: 44px;
            margin-bottom: 3px;
        }

        /* ── Official stamp area ── */
        .stamp-area {
            width: 88px;
            height: 88px;
            border: 2px dashed #bbb;
            text-align: center;
            padding-top: 22px;
            font-size: 7.5pt;
            color: #bbb;
            line-height: 1.4;
            float: left;
            margin-top: 10px;
        }

        /* ── Cut line ── */
        .cut-outer {
            margin: 14px 0 6px 0;
            clear: both;
        }

        /* ── Candidate acknowledgement copy ── */
        .ack-box {
            border: 1.5px solid #1a4f8a;
            padding: 10px 14px 8px 14px;
            background: #f8faff;
        }

        .ack-inner {
            width: 100%;
            border-collapse: collapse;
        }

        .ack-inner td {
            vertical-align: top;
            font-size: 9.5pt;
        }

        .ack-sign-line {
            border-top: 1px solid #555;
            width: 200px;
            margin-top: 44px;
            margin-bottom: 3px;
        }

        /* ── Footer ── */
        .ltr-footer {
            border-top: 1px solid #ccc;
            margin-top: 10px;
            padding-top: 5px;
            text-align: center;
            font-size: 7.5pt;
            color: #bbb;
        }
    </style>
</head>

<body>

    @php
        $acceptedLog = $nomination->statusLogs->where('to_status', 'accepted')->last();
        $acceptedAt = $acceptedLog?->created_at ?? $nomination->updated_at;
        $acceptedDate = $acceptedAt->setTimezone('Asia/Dhaka')->format('d/m/Y');
        $submittedDate = $nomination->created_at->setTimezone('Asia/Dhaka')->format('d/m/Y');

        $electionDate = $nomination->election->election_date?->format('d/m/Y') ?? '—';
        $startTime = $nomination->election->voting_start_time
            ? substr($nomination->election->voting_start_time, 0, 5)
            : '—';
        $endTime = $nomination->election->voting_end_time ? substr($nomination->election->voting_end_time, 0, 5) : '—';

        $approvedBy = $nomination->approvedBy?->name ?? '';
        $refNo = 'DOA/EC/' . date('Y', strtotime($acceptedAt)) . '/' . $nomination->token_number;
    @endphp

    {{-- ══════════════════════════════════════════════════════════════════ --}}
    {{-- LETTER (MAIN COPY)                                                 --}}
    {{-- ══════════════════════════════════════════════════════════════════ --}}
    <div class="lh-outer">

        {{-- ── Letterhead ────────────────────────────────────────────── --}}
        <table class="lh-tbl" cellspacing="0" cellpadding="0">
            <tr>
                <td class="lh-logo">
                    <div class="logo-ring">
                        <div style="font-size:10pt;color:#1a4f8a;">DOA</div>
                        <div style="font-size:5.5pt;color:#555;line-height:1.3;">নির্বাচন<br>কমিশন</div>
                    </div>
                </td>
                <td class="lh-center">
                    <div style="font-size:13pt;color:#1a4f8a;">আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA)</div>
                    <div style="font-size:9.5pt;color:#555;">নির্বাচন কমিশন, ঢাকা</div>
                    <div style="font-size:8.5pt;color:#999;margin-top:1px;">ICT Department Officers Association —
                        Election Commission</div>
                    <div style="border-top:1.5px solid #1a4f8a;margin:5px 80px 4px;"></div>
                    <div style="font-size:15pt;color:#1a4f8a;">প্রার্থিতা গ্রহণের প্রত্যয়নপত্র</div>
                    <div style="font-size:8.5pt;color:#888;">(Certificate of Nomination Acceptance)</div>
                </td>
                <td class="lh-seal">
                    <div class="seal-box">দাপ্তরিক<br>সিল</div>
                </td>
            </tr>
        </table>

        <div class="dbl-rule"></div>

        {{-- ── Ref + Date ─────────────────────────────────────────────── --}}
        <table class="meta-tbl" cellspacing="0" cellpadding="0">
            <tr>
                <td>স্মারক নং: {{ $refNo }}</td>
                <td style="text-align:right;">তারিখ: {{ $acceptedDate }}</td>
            </tr>
        </table>

        {{-- ── Addressee ──────────────────────────────────────────────── --}}
        <div class="addressee">
            <div>প্রতি,</div>
            <div style="margin-left: 20pt; font-weight: normal;">{{ $nomination->name }}</div>
            @if ($nomination->designation)
                <div style="margin-left: 20pt;">{{ config('constants.designations')[$nomination->designation] ?? '' }}</div>
            @endif
            @if ($nomination->organization_name)
                <div style="margin-left: 20pt;">{{ $nomination->organization_name }}</div>
            @endif
            @if ($nomination->address)
                <div style="margin-left: 20pt;">{{ $nomination->address }}</div>
            @endif
            <div style="margin-left: 20pt;">মোবাইল: {{ $nomination->mobile }}</div>
            <div style="margin-left: 20pt;">ইমেইল: {{ $nomination->email }}</div>
        </div>

        {{-- ── Subject ─────────────────────────────────────────────────── --}}
        <div class="subject">
            বিষয়: {{ $nomination->election->name }} — প্রার্থিতা গ্রহণের প্রত্যয়নপত্র প্রদান প্রসঙ্গে।
        </div>

        {{-- ── Body ───────────────────────────────────────────────────── --}}
        <div class="salute">জনাব/জনাবা,</div>

        <div class="para">
            উপর্যুক্ত বিষয়ের প্রেক্ষিতে আপনাকে জানানো যাচ্ছে যে, আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA)-এর
            {{ $nomination->election->name }}-এ আপনি কর্তৃক দাখিলকৃত মনোনয়নপত্র (টোকেন নং:
            {{ $nomination->token_number }}, দাখিলের তারিখ: {{ $submittedDate }}) নির্বাচন কমিশন
            কর্তৃক যথাযথ পর্যালোচনা ও যাচাই-বাছাই শেষে আপনার প্রার্থিতা আনুষ্ঠানিকভাবে গৃহীত হয়েছে।
        </div>

        <div class="para">
            ২।&nbsp; আপনি নিম্নবর্ণিত পদে (সমূহে) বৈধ প্রার্থী হিসেবে আনুষ্ঠানিকভাবে ঘোষিত হলেন:
        </div>

        <table class="posts-tbl" cellspacing="0">
            <tr>
                <td class="posts-hd" style="width: 12%; text-align: center;">ক্রমিক</td>
                <td class="posts-hd">পদের নাম (Post Title)</td>
            </tr>
            @foreach ($nomination->posts as $post)
                <tr>
                    <td style="text-align: center;">{{ $loop->iteration }}</td>
                    <td>{{ $post->title }}</td>
                </tr>
            @endforeach
        </table>

        <div class="para">
            ৩।&nbsp; নির্বাচনের তারিখ ও ভোটগ্রহণের বিস্তারিত তথ্য নিম্নরূপ:
        </div>

        <table class="el-tbl" cellspacing="0">
            <tr>
                <td class="lb">নির্বাচনের নাম</td>
                <td>{{ $nomination->election->name }}</td>
            </tr>
            <tr>
                <td class="lb">আয়োজক সংস্থা</td>
                <td>{{ $nomination->organization->name ?? '—' }}</td>
            </tr>
            <tr>
                <td class="lb">নির্বাচনের তারিখ</td>
                <td>{{ $electionDate }}</td>
            </tr>
            <tr>
                <td class="lb">ভোটগ্রহণের সময়</td>
                <td>{{ $startTime }} হতে {{ $endTime }}</td>
            </tr>
        </table>

        <div class="para">
            ৪।&nbsp; এই প্রত্যয়নপত্রটি আপনার মনোনয়ন গ্রহণের সরকারি প্রমাণপত্র হিসেবে গণ্য হবে। নির্বাচনের দিন এই
            প্রত্যয়নপত্র এবং উপযুক্ত পরিচয়পত্রসহ নির্ধারিত সময়ের পূর্বে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা
            হচ্ছে।
        </div>

        <div class="closing">আপনাকে আন্তরিক ধন্যবাদ ও শুভকামনা জানানো হচ্ছে।</div>

        {{-- ── Signature ────────────────────────────────────────────────── --}}
        <div style="overflow: hidden;">
            <div class="stamp-area">দাপ্তরিক<br>সিল</div>

            <div class="sig-block">
                <div>নির্বাচন কমিশনের পক্ষে,</div>
                <div class="sig-line"></div>
                @if ($approvedBy)
                    <div style="font-weight: normal;">{{ $approvedBy }}</div>
                @endif
                <div style="font-size: 9.5pt; color: #555;">নির্বাচন কমিশনার</div>
                <div style="font-size: 9pt; color: #555;">আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA)</div>
                <div style="font-size: 9pt; color: #555;">তারিখ: {{ $acceptedDate }}</div>
            </div>
        </div>

        <div class="ltr-footer">
            DEMS — Digital Election Management System &bull; এই প্রত্যয়নপত্রটি স্বয়ংক্রিয়ভাবে তৈরি হয়েছে &bull;
            স্মারক: {{ $refNo }}
        </div>

    </div>{{-- end lh-outer --}}

    {{-- ══════════════════════ CUT LINE ══════════════════════════════════ --}}
    <div class="cut-outer">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="border-top: 1.5px dashed #888; font-size: 0;">&nbsp;</td>
                <td
                    style="width: 170px; text-align: center; font-size: 8.5pt; color: #666; white-space: nowrap; padding: 1px 8px;">
                    ✂&nbsp;&nbsp;প্রার্থী কপি কেটে নিন&nbsp;&nbsp;✂</td>
                <td style="border-top: 1.5px dashed #888; font-size: 0;">&nbsp;</td>
            </tr>
        </table>
    </div>

    {{-- ══════════════════════════════════════════════════════════════════ --}}
    {{-- CANDIDATE ACKNOWLEDGEMENT COPY                                     --}}
    {{-- ══════════════════════════════════════════════════════════════════ --}}
    <div class="ack-box">
        <div style="text-align: center; font-size: 10.5pt; color: #1a4f8a; font-weight: normal; margin-bottom: 8px;">
            প্রার্থী কপি — প্রাপ্তি স্বীকারপত্র (Candidate Acknowledgement)
        </div>

        <table class="ack-inner" cellspacing="0" cellpadding="0">
            <tr>
                <td style="width: 58%; padding-right: 14px; font-size: 9.5pt; line-height: 1.8;">
                    <div>স্মারক নং: {{ $refNo }}</div>
                    <div>প্রার্থীর নাম: {{ $nomination->name }}</div>
                    <div>পিতার নাম: {{ $nomination->father_name ?? '—' }}</div>
                    <div>টোকেন নং: {{ $nomination->token_number }}</div>
                    <div>গৃহীত পদ:
                        @foreach ($nomination->posts as $p)
                            {{ $p->title }}{{ !$loop->last ? ', ' : '' }}
                        @endforeach
                    </div>
                    <div>নির্বাচনের তারিখ: {{ $electionDate }}</div>
                    <div>ভোটগ্রহণ: {{ $startTime }} হতে {{ $endTime }}</div>
                    <div style="margin-top: 6px; font-size: 9pt; color: #555;">
                        আমি উপরোক্ত প্রত্যয়নপত্রটি প্রাপ্ত হইলাম এবং এর সকল শর্ত অবগত হইলাম।
                    </div>
                </td>
                <td
                    style="width: 42%; text-align: center; vertical-align: top; padding-left: 10px; border-left: 1px solid #c0cfe4;">
                    <div style="font-size: 9pt; color: #888; margin-bottom: 4px;">প্রার্থীর ছবি ও স্বাক্ষর</div>
                    <table width="88" cellspacing="0" cellpadding="0" style="margin: 0 auto 6px;">
                        <tr>
                            <td
                                style="width: 88px; height: 100px; border: 1.5px solid #c0cfe4; text-align: center; vertical-align: middle; font-size: 7pt; color: #bbb; line-height: 1.5;">
                                সদ্যতোলা<br>রঙিন ছবি<br>৩&times;৪ সে.মি.
                            </td>
                        </tr>
                    </table>
                    <div class="ack-sign-line" style="margin: 0 auto; width: 180px;"></div>
                    <div style="font-size: 9pt;">প্রার্থীর স্বাক্ষর ও তারিখ</div>
                    <div style="font-size: 8.5pt; color: #666; margin-top: 4px;">তারিখ: ___________________</div>
                    <div style="font-size: 8.5pt; color: #666; margin-top: 3px;">মোবাইল: {{ $nomination->mobile }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

</body>

</html>
