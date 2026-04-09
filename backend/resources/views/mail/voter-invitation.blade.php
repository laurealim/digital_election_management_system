<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.8; background: #f4f4f4; margin: 0; padding: 0; }
        .wrapper { background: #f4f4f4; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a4fba; padding: 28px 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px; }
        .header p { color: #c8d8f8; margin: 6px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .body p { margin: 0 0 16px; font-size: 15px; color: #444; }
        .election-box { background: #f0f5ff; border-left: 4px solid #1a4fba; padding: 14px 18px; border-radius: 4px; margin: 20px 0; }
        .election-box p { margin: 4px 0; font-size: 14px; color: #333; }
        .election-box strong { color: #1a4fba; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; padding: 14px 36px; background: #1a4fba; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; letter-spacing: 0.3px; }
        .notice { background: #fffbea; border: 1px solid #f0d060; border-radius: 4px; padding: 12px 16px; font-size: 13px; color: #7a5c00; margin-top: 20px; }
        .footer { background: #f8f8f8; border-top: 1px solid #eee; padding: 20px 32px; text-align: center; font-size: 12px; color: #999; }
        .footer a { color: #1a4fba; text-decoration: none; }
    </style>
</head>
<body>
<div class="wrapper">
<div class="container">

    <div class="header">
        <h1>Digital Election Management System</h1>
        <p>আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA)</p>
    </div>

    <div class="body">
        <p>জনাব/জনাবা <strong>{{ $user->name }}</strong>,</p>

        <p>
            আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA)-এর <strong>নির্বাচন-২০২৬</strong>-এ আপনাকে একজন সম্মানিত ভোটার হিসেবে মনোনীত করা হয়েছে।
            <strong>Digital Election Management System (DEMS)</strong>-এ আপনার জন্য একটি একাউন্ট তৈরি করা হয়েছে।
        </p>

        <div class="election-box">
            <p><strong>নির্বাচন:</strong> {{ $election->name }}</p>
            <p><strong>তারিখ:</strong> {{ $election->election_date->format('d F, Y') }}</p>
            <p><strong>ভোটগ্রহণের সময়:</strong> {{ $election->voting_start_time }} – {{ $election->voting_end_time }} (GMT+6)</p>
        </div>

        @if (! $user->hasSetPassword())
        <p>
            সিস্টেমে প্রবেশ করতে এবং যথাসময়ে আপনার মূল্যবান ভোট প্রদান করতে নিচের বাটনে ক্লিক করে প্রথমে আপনার পাসওয়ার্ড সেট করুন।
        </p>

        <div class="btn-wrap">
            <a href="{{ $setupUrl }}" class="btn">পাসওয়ার্ড সেট করুন</a>
        </div>

        <div class="notice">
            ⚠️ নিরাপত্তার স্বার্থে এই লিংকটি প্রেরণের সময় থেকে <strong>২৪ ঘন্টা</strong> পর্যন্ত কার্যকর থাকবে।
            নির্ধারিত সময়ের মধ্যে পাসওয়ার্ড সেট না করলে আপনার প্রতিষ্ঠানের অ্যাডমিনের সাথে যোগাযোগ করুন।
        </div>
        @else
        <p>
            আপনার একাউন্ট ইতোমধ্যে সক্রিয় রয়েছে। নির্বাচন সক্রিয় হলে DEMS পোর্টালে লগইন করে আপনার ভোট প্রদান করুন।
        </p>
        @endif
    </div>

    <div class="footer">
        <p>এই ইমেইলটি স্বয়ংক্রিয়ভাবে প্রেরিত হয়েছে। অনুগ্রহ করে এই ইমেইলে সরাসরি উত্তর প্রদান করবেন না।</p>
        <p>আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA) &mdash; Digital Election Management System</p>
    </div>

</div>
</div>
</body>
</html>