<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>DEMS — প্রতিষ্ঠানের ইমেইল যাচাই করুন</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.8; background: #f4f4f4; margin: 0; padding: 0; }
        .wrapper { background: #f4f4f4; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a4fba; padding: 28px 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px; }
        .header p { color: #c8d8f8; margin: 6px 0 0; font-size: 13px; }
        .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 14px; border-radius: 99px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
        .body { padding: 32px; }
        .body p { margin: 0 0 16px; font-size: 15px; color: #444; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; padding: 14px 36px; background: #1a4fba; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; }
        .notice { background: #fffbea; border: 1px solid #f0d060; border-radius: 4px; padding: 12px 16px; font-size: 13px; color: #7a5c00; margin-top: 20px; }
        .url-box { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px 14px; font-size: 12px; word-break: break-all; margin-top: 12px; color: #555; }
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
        <div class="badge">ইমেইল যাচাইকরণ</div>

        <p>জনাব/জনাবা <strong>{{ $organization->name }}</strong>,</p>

        <p>
            <strong>Digital Election Management System (DEMS)</strong>-এ আপনার প্রতিষ্ঠান নিবন্ধনের জন্য আন্তরিক ধন্যবাদ।
            আপনার একাউন্টটি সক্রিয় করতে নিচের বাটনে ক্লিক করে আপনার ইমেইল ঠিকানা যাচাই করুন।
        </p>

        <div class="btn-wrap">
            <a href="{{ $verifyUrl }}" class="btn">ইমেইল যাচাই করুন</a>
        </div>

        <div class="notice">
            ⚠️ নিরাপত্তার স্বার্থে এই লিংকটি প্রেরণের সময় থেকে <strong>২৪ ঘন্টা</strong> পর্যন্ত কার্যকর থাকবে।
            নির্ধারিত সময়ের মধ্যে যাচাই না করলে পুনরায় নিবন্ধন করুন অথবা সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।
        </div>

        <p style="font-size:13px; color:#888; margin-top:20px;">বাটনটি কাজ না করলে নিচের লিংকটি কপি করে ব্রাউজারে পেস্ট করুন:</p>
        <div class="url-box"><a href="{{ $verifyUrl }}">{{ $verifyUrl }}</a></div>
    </div>

    <div class="footer">
        <p>এই ইমেইলটি স্বয়ংক্রিয়ভাবে প্রেরিত হয়েছে। অনুগ্রহ করে এই ইমেইলে সরাসরি উত্তর প্রদান করবেন না।</p>
        <p>আইসিটি অধিদপ্তর অফিসার্স এসোসিয়েশন (DOA) &mdash; Digital Election Management System</p>
    </div>

</div>
</div>
</body>
</html>