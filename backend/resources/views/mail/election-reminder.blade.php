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
        .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 14px; border-radius: 99px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; padding: 14px 36px; background: #1a4fba; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; }
        .footer { background: #f8f8f8; border-top: 1px solid #eee; padding: 20px 32px; text-align: center; font-size: 12px; color: #999; }
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
        <div class="badge">ভোট প্রদানের অনুস্মারক</div>

        <p>জনাব/জনাবা <strong>{{ $user->name }}</strong>,</p>

        <p>
            আপনাকে বিনীতভাবে স্মরণ করিয়ে দেওয়া হচ্ছে যে, নিচের নির্বাচনে আপনি একজন নিবন্ধিত ভোটার।
            নির্ধারিত সময়ে আপনার মূল্যবান ভোট প্রদান করুন।
        </p>

        <div class="election-box">
            <p><strong>নির্বাচন:</strong> {{ $election->name }}</p>
            <p><strong>তারিখ:</strong> {{ $election->election_date->format('d F, Y') }}</p>
            <p><strong>ভোটগ্রহণের সময়:</strong> {{ $election->voting_start_time }} – {{ $election->voting_end_time }} (GMT+6)</p>
        </div>

        <p>
            নির্ধারিত সময়ে DEMS পোর্টালে আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন এবং আপনার ভোট প্রদান করুন।
        </p>

        <div class="btn-wrap">
            <a href="{{ $loginUrl }}" class="btn">DEMS পোর্টালে প্রবেশ করুন</a>
        </div>
    </div>

    <div class="footer">
        <p>এই ইমেইলটি স্বয়ংক্রিয়ভাবে প্রেরিত হয়েছে কারণ আপনি এই নির্বাচনে একজন নিবন্ধিত ভোটার।</p>
        <p>কোনো সমস্যা হলে আপনার প্রতিষ্ঠানের অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
        <p>আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA) &mdash; Digital Election Management System</p>
    </div>

</div>
</div>
</body>
</html>