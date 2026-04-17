<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>মনোনয়নপত্র — {{ $nomination->token_number }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'kalpurush', 'freeserif', sans-serif;
            font-size: 10pt;
            color: #1a1a1a;
            line-height: 1.5;
        }

        /* ── Outer border around commission copy ── */
        .page-border {
            border: 2px solid #1a4f8a;
            padding: 8px 10px 6px 10px;
            margin-bottom: 0;
        }

        /* ── Header ── */
        .hdr-tbl { width: 100%; border-collapse: collapse; border-bottom: 2px double #1a4f8a; padding-bottom: 6px; margin-bottom: 6px; }
        .hdr-logo { width: 62px; text-align: center; vertical-align: middle; padding-right: 8px; }
        .hdr-logo-box {
            width: 54px; height: 54px;
            border: 2.5px solid #1a4f8a;
            border-radius: 27px;
            margin: 0 auto;
            text-align: center;
            padding-top: 7px;
        }
        .hdr-center { text-align: center; vertical-align: middle; padding: 0 6px; }
        .hdr-meta { width: 92px; text-align: center; vertical-align: middle; padding-left: 8px; border-left: 1px solid #c0cfe4; }

        /* ── Section header bar ── */
        .s-hdr {
            background: #1a4f8a;
            color: #fff;
            padding: 2.5px 8px;
            font-size: 9.5pt;
            margin-top: 5px;
            margin-bottom: 0;
        }

        /* ── Info grid ── */
        .ig { width: 100%; border-collapse: collapse; }
        .ig td {
            border: 1px solid #c8d8ef;
            padding: 3px 7px;
            font-size: 9.5pt;
            vertical-align: middle;
        }
        .ig td.lb {
            background: #eef3fb;
            color: #1a4f8a;
            width: 30%;
        }
        .ig td.lb2 {
            background: #eef3fb;
            color: #1a4f8a;
            width: 22%;
        }

        /* ── Posts table ── */
        .pt { width: 100%; border-collapse: collapse; }
        .pt td {
            border: 1px solid #c8d8ef;
            padding: 3px 7px;
            font-size: 9.5pt;
        }
        .pt td.pt-hd {
            background: #eef3fb;
            color: #1a4f8a;
            text-align: left;
        }

        /* ── Declaration box ── */
        .decl {
            border: 1px solid #c8d8ef;
            padding: 6px 10px;
            font-size: 9.5pt;
            line-height: 1.7;
            text-align: justify;
        }

        /* ── Signature row ── */
        .sign-tbl { width: 100%; border-collapse: collapse; }
        .sign-tbl td {
            border: 1px solid #c8d8ef;
            padding: 5px 10px;
            vertical-align: top;
            font-size: 9pt;
        }
        .sign-line { border-top: 1px solid #444; margin-top: 38px; margin-bottom: 2px; }

        /* ── Status-based notice ── */
        .notice { padding: 5px 9px; font-size: 9pt; margin-top: 5px; border: 1px solid; }
        .n-pending  { background: #fffde7; border-color: #e5ac00; color: #4a3200; }
        .n-verified { background: #e8f4fd; border-color: #0aa4c8; color: #01497c; }
        .n-accepted { background: #eaf6ed; border-color: #1a9648; color: #0d4a22; }
        .n-rejected { background: #fef2f2; border-color: #cc2222; color: #7a1515; }

        /* ── Status badge ── */
        .badge { font-size: 8pt; padding: 1px 7px; border: 1px solid; }
        .b-pending  { background: #fff7e0; border-color: #e5ac00; color: #7d5a00; }
        .b-verified { background: #dff5fc; border-color: #0aa4c8; color: #014a62; }
        .b-accepted { background: #d9f0e3; border-color: #1a9648; color: #0d4a22; }
        .b-rejected { background: #fde8e8; border-color: #cc2222; color: #7a1515; }

        /* ── Cut line ── */
        .cut-outer { margin: 7px 0 4px 0; }

        /* ── Candidate copy ── */
        .cand-copy { border: 1.5px solid #1a4f8a; }
        .cand-copy td { font-size: 8.5pt; padding: 5px 8px; }

        /* ── Footer meta ── */
        .fmeta { text-align: right; font-size: 7.5pt; color: #bbb; margin-top: 3px; }
    </style>
</head>
<body>

@php
$sLabels = ['pending'=>'অপেক্ষমাণ','verified'=>'যাচাইকৃত','accepted'=>'গৃহীত','rejected'=>'প্রত্যাখ্যাত'];
$sl = $sLabels[$nomination->status] ?? $nomination->status;
$bClass = 'b-' . $nomination->status;
$nClass = 'n-' . $nomination->status;
@endphp

{{-- ══════════════════════════════════════════════════════════════════ --}}
{{-- COMMISSION COPY                                                    --}}
{{-- ══════════════════════════════════════════════════════════════════ --}}
<div class="page-border">

    {{-- ── Header ──────────────────────────────────────────────────── --}}
    <table class="hdr-tbl" cellspacing="0" cellpadding="0">
        <tr>
            <td class="hdr-logo">
                <div class="hdr-logo-box">
                    <div style="font-size:10pt;color:#1a4f8a;font-weight:normal;">DOA</div>
                    <div style="font-size:5.5pt;color:#555;line-height:1.3;">নির্বাচন<br>কমিশন</div>
                </div>
            </td>
            <td class="hdr-center">
                <div style="font-size:12.5pt;color:#1a4f8a;font-weight:normal;">আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA)</div>
                <div style="font-size:9pt;color:#555;">নির্বাচন কমিশন</div>
                <div style="font-size:9.5pt;color:#333;margin-top:1px;">{{ $nomination->election->name }}</div>
                <div style="border-top:1.5px solid #1a4f8a;margin:4px 60px 3px;"></div>
                <div style="font-size:16pt;color:#1a4f8a;font-weight:normal;">মনোনয়নপত্র</div>
                <div style="font-size:8pt;color:#888;">(Nomination Form)</div>
            </td>
            <td class="hdr-meta">
                <div style="font-size:7pt;color:#888;">ফর্ম নং (Token)</div>
                <div style="font-size:14pt;color:#1a4f8a;font-weight:normal;letter-spacing:2px;">{{ $nomination->token_number }}</div>
                <div style="font-size:7pt;color:#888;margin-top:3px;">দাখিলের তারিখ</div>
                <div style="font-size:8.5pt;">{{ $nomination->created_at->setTimezone('Asia/Dhaka')->format('d/m/Y') }}</div>
                <div style="font-size:8pt;color:#888;margin-top:1px;">{{ $nomination->created_at->setTimezone('Asia/Dhaka')->format('h:i A') }}</div>
                <div style="margin-top:4px;"><div class="badge {{ $bClass }}">{{ $sl }}</div></div>
                <div style="font-size:7pt;color:#aaa;margin-top:3px;">কমিশন কপি</div>
            </td>
        </tr>
    </table>

    {{-- ── Candidate Info + Photo ────────────────────────────────── --}}
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td style="vertical-align:top;padding-right:7px;">

                <div class="s-hdr">১। প্রার্থীর ব্যক্তিগত তথ্য (Personal Information)</div>
                <table class="ig" cellspacing="0">
                    <tr>
                        <td class="lb">প্রার্থীর নাম</td>
                        <td style="width:40%;">{{ $nomination->name }}</td>
                        <td class="lb2">পিতার নাম</td>
                        <td>{{ $nomination->father_name ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td class="lb">মাতার নাম</td>
                        <td>{{ $nomination->mother_name ?? '—' }}</td>
                        <td class="lb2">জাতীয় পরিচয়পত্র নং</td>
                        <td>{{ $nomination->nid ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td class="lb">পদবি / পদমর্যাদা</td>
                        <td>{{ $nomination->designation ? (config('constants.designations')[$nomination->designation] ?? '—') : '—' }}</td>
                        <td class="lb2">মোবাইল নম্বর</td>
                        <td>{{ $nomination->mobile }}</td>
                    </tr>
                    <tr>
                        <td class="lb">ইমেইল ঠিকানা</td>
                        <td>{{ $nomination->email }}</td>
                        <td class="lb2">প্রতিষ্ঠান / কার্যালয়</td>
                        <td>{{ $nomination->organization_name ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td class="lb">স্থায়ী ঠিকানা</td>
                        <td colspan="3">{{ $nomination->address ?? '—' }}</td>
                    </tr>
                </table>

            </td>
            <td style="vertical-align:top;width:92px;">
                <div class="s-hdr" style="text-align:center;margin-right:0;">ছবি</div>
                <table width="92" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="width:92px;height:115px;border:1.5px solid #c8d8ef;text-align:center;vertical-align:middle;font-size:7.5pt;color:#aaa;padding:4px;line-height:1.5;">
                            সদ্যতোলা<br>রঙিন ছবি<br><br>৩&times;৪ সে.মি.<br>(পাসপোর্ট<br>সাইজ)
                        </td>
                    </tr>
                </table>
                <div style="font-size:7pt;color:#aaa;text-align:center;margin-top:2px;">এখানে আটকান</div>
            </td>
        </tr>
    </table>

    {{-- ── Posts Applied ─────────────────────────────────────────── --}}
    <div class="s-hdr">২। প্রার্থিতার পদসমূহ (Posts Applied For)</div>
    <table class="pt" cellspacing="0">
        <tr>
            <td class="pt-hd" style="width:9%;text-align:center;">ক্রমিক</td>
            <td class="pt-hd">পদের নাম (Post Title)</td>
            <td class="pt-hd" style="width:24%;">রিটার্নিং অফিসারের মন্তব্য</td>
        </tr>
        @foreach($nomination->posts as $post)
        <tr>
            <td style="text-align:center;">{{ $loop->iteration }}</td>
            <td>{{ $post->title }}</td>
            <td style="height:20px;"></td>
        </tr>
        @endforeach
    </table>

    {{-- ── Election Info ──────────────────────────────────────────── --}}
    <div class="s-hdr">৩। নির্বাচনের তথ্য (Election Details)</div>
    <table class="ig" cellspacing="0">
        <tr>
            <td class="lb">নির্বাচনের নাম</td>
            <td>{{ $nomination->election->name }}</td>
            <td class="lb2">নির্বাচনের তারিখ</td>
            <td>{{ $nomination->election->election_date?->format('d/m/Y') ?? '—' }}</td>
        </tr>
        <tr>
            <td class="lb">আয়োজক সংস্থা</td>
            <td colspan="3">{{ $nomination->organization->name ?? '—' }}</td>
        </tr>
    </table>

    {{-- ── Declaration ────────────────────────────────────────────── --}}
    <div class="s-hdr">৪। ঘোষণাপত্র (Declaration)</div>
    <div class="decl">
        আমি, {{ $nomination->name }} (পিতা: {{ $nomination->father_name ?? '—' }}), এতদ্বারা সশপথ ঘোষণা করছি যে উপরে প্রদত্ত সকল তথ্য আমার জ্ঞান ও বিশ্বাসমতে সম্পূর্ণ সত্য ও নির্ভুল। আমি আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA)-এর একজন নিয়মিত সদস্য এবং সংগঠনের গঠনতন্ত্র অনুযায়ী উক্ত পদে প্রতিদ্বন্দ্বিতা করার যাবতীয় যোগ্যতা আমার রয়েছে। এই মনোনয়নপত্রে প্রদত্ত কোনো তথ্য অসত্য বা বিভ্রান্তিকর প্রমাণিত হলে নির্বাচন কমিশন আমার প্রার্থিতা বাতিল করতে পারবেন এবং তৎক্ষণাৎ সেক্ষেত্রে আমার কোনো আপত্তি থাকবে না।
    </div>

    {{-- ── Signatures ─────────────────────────────────────────────── --}}
    <table class="sign-tbl" cellspacing="0" style="margin-top:5px;">
        <tr>
            <td style="width:50%;height:80px;vertical-align:top;">
                <div style="font-size:9pt;color:#1a4f8a;font-weight:normal;">প্রার্থীর স্বাক্ষর (Candidate's Signature)</div>
                <div class="sign-line"></div>
                <div style="font-size:8.5pt;">প্রার্থীর স্বাক্ষর ও সিল</div>
                <table width="100%" cellspacing="0" style="margin-top:4px;font-size:8pt;color:#555;">
                    <tr>
                        <td>তারিখ: ____________________</td>
                        <td>স্থান: ____________________</td>
                    </tr>
                </table>
            </td>
            <td style="width:50%;height:80px;vertical-align:top;border-left:1px solid #c8d8ef;">
                <div style="font-size:9pt;color:#1a4f8a;font-weight:normal;">কমিশনের ব্যবহারের জন্য (For Official Use Only)</div>
                <table width="100%" cellspacing="0" style="font-size:8pt;color:#555;margin-top:3px;">
                    <tr>
                        <td>মনোনয়নপত্র গ্রহণের তারিখ: ________________</td>
                        <td style="white-space:nowrap;">সময়: ___________</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding-top:3px;">
                            অবস্থা:&nbsp;
                            &#9744; অপেক্ষমাণ &nbsp;
                            &#9744; যাচাইকৃত &nbsp;
                            &#9744; গৃহীত &nbsp;
                            &#9744; প্রত্যাখ্যাত
                        </td>
                    </tr>
                </table>
                <div class="sign-line"></div>
                <div style="font-size:8.5pt;">রিটার্নিং অফিসারের স্বাক্ষর ও সিল</div>
                <div style="font-size:8pt;color:#555;">নাম: _______________________________</div>
            </td>
        </tr>
    </table>

    {{-- ── Status Notice ───────────────────────────────────────────── --}}
    @if($nomination->isAccepted())
        <div class="notice n-accepted">
            &#10004;&nbsp; এই মনোনয়নপত্র (টোকেন: {{ $nomination->token_number }}) নির্বাচন কমিশন কর্তৃক আনুষ্ঠানিকভাবে গৃহীত হয়েছে। গ্রহণপত্র (Acceptance Letter) আলাদাভাবে ডাউনলোড করুন।
        </div>
    @elseif($nomination->isRejected())
        <div class="notice n-rejected">
            &#10008;&nbsp; এই মনোনয়নপত্র নির্বাচন কমিশন কর্তৃক প্রত্যাখ্যাত হয়েছে।@if($nomination->rejection_reason)&nbsp;কারণ: {{ $nomination->rejection_reason }}@endif
        </div>
    @elseif($nomination->isVerified())
        <div class="notice n-verified">
            &#9432;&nbsp; আপনার মনোনয়নপত্র যাচাই (Verification) সম্পন্ন হয়েছে। নির্ধারিত ফি পরিশোধের পর চূড়ান্ত অনুমোদনের জন্য অপেক্ষা করুন।
        </div>
    @else
        <div class="notice n-pending">
            &#9432;&nbsp; এই মনোনয়নপত্রটি নির্বাচন কমিশন কর্তৃক চূড়ান্ত অনুমোদনের পূর্বে বৈধ নয়। আপনার টোকেন নম্বর {{ $nomination->token_number }} সংরক্ষণ করুন এবং নির্বাচন কমিশনের সাথে যোগাযোগ করুন।
        </div>
    @endif

    <div class="fmeta">DEMS — Digital Election Management System &bull; স্বয়ংক্রিয়ভাবে তৈরি &bull; কমিশন কপি</div>

</div>{{-- end page-border --}}

{{-- ══════════════════════ CUT LINE ══════════════════════════════════ --}}
<div class="cut-outer">
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td style="border-top:1.5px dashed #888;font-size:0;">&nbsp;</td>
            <td style="width:140px;text-align:center;font-size:8pt;color:#666;white-space:nowrap;padding:1px 8px;">✂&nbsp;&nbsp;কেটে নিন&nbsp;&nbsp;✂</td>
            <td style="border-top:1.5px dashed #888;font-size:0;">&nbsp;</td>
        </tr>
    </table>
</div>

{{-- ══════════════════════════════════════════════════════════════════ --}}
{{-- CANDIDATE COPY (Tear-off strip)                                   --}}
{{-- ══════════════════════════════════════════════════════════════════ --}}
<table class="cand-copy" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="border-right:1px solid #c8d8ef;width:38%;vertical-align:middle;padding:5px 8px;">
            <div style="font-size:9.5pt;color:#1a4f8a;font-weight:normal;">মনোনয়নপত্র — প্রার্থী কপি</div>
            <div style="font-size:8pt;color:#555;margin-top:1px;">{{ $nomination->election->name }}</div>
            <div style="font-size:8pt;color:#555;">{{ $nomination->organization->name ?? '' }}</div>
        </td>
        <td style="border-right:1px solid #c8d8ef;width:35%;vertical-align:middle;padding:5px 8px;font-size:8.5pt;">
            <div>{{ $nomination->name }}</div>
            <div style="color:#555;font-size:8pt;">পিতা: {{ $nomination->father_name ?? '—' }}</div>
            <div style="color:#555;font-size:8pt;">পদ: @foreach($nomination->posts as $p){{ $p->title }}{{ !$loop->last ? ', ' : '' }}@endforeach</div>
            <div style="color:#555;font-size:8pt;">তারিখ: {{ $nomination->created_at->setTimezone('Asia/Dhaka')->format('d/m/Y') }}</div>
        </td>
        <td style="width:27%;vertical-align:middle;text-align:center;padding:5px 8px;">
            <div style="font-size:7.5pt;color:#888;">টোকেন নম্বর</div>
            <div style="font-size:16pt;letter-spacing:3px;color:#1a4f8a;font-weight:normal;">{{ $nomination->token_number }}</div>
            <div class="badge {{ $bClass }}">{{ $sl }}</div>
        </td>
    </tr>
    <tr>
        <td colspan="3" style="border-top:1px solid #c8d8ef;background:#f4f7fc;padding:5px 10px;font-size:8pt;">
            <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="width:55%;">প্রার্থীর স্বাক্ষর: _____________________________&nbsp;&nbsp; তারিখ: ________________</td>
                    <td style="width:45%;text-align:right;">রিটার্নিং অফিসারের স্বাক্ষর: _____________________________&nbsp;&nbsp; তারিখ: ________________</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>