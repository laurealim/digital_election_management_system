<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Organization Email</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; padding: 40px; }
        .header { font-size: 22px; font-weight: bold; color: #1a1a2e; margin-bottom: 8px; }
        .badge { display: inline-block; background: #ede9fe; color: #5b21b6; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
        .btn { display: inline-block; padding: 14px 28px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; }
        .note { margin-top: 24px; font-size: 12px; color: #888; }
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">DEMS — Digital Election Management System</div>
        <div class="badge">Email Verification</div>

        <p>Hello <strong>{{ $organization->name }}</strong>,</p>

        <p>Thank you for registering your organization on DEMS. Please verify your email address to activate your account.</p>

        <p>This link will expire in <strong>24 hours</strong>.</p>

        <p>
            <a href="{{ $verifyUrl }}" class="btn">Verify Email Address</a>
        </p>

        <hr class="divider">

        <p class="note">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <a href="{{ $verifyUrl }}">{{ $verifyUrl }}</a>
        </p>

        <p class="note">This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
