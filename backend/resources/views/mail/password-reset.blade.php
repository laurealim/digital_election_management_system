<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $mailSubject }}</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; padding: 40px; }
        .header { font-size: 22px; font-weight: bold; color: #1a1a2e; margin-bottom: 8px; }
        .sub { color: #555; font-size: 14px; margin-bottom: 24px; }
        .btn { display: inline-block; padding: 14px 28px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; }
        .note { margin-top: 24px; font-size: 12px; color: #888; }
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">DEMS — Digital Election Management System</div>

        <p>Hello <strong>{{ $user->name }}</strong>,</p>

        @if($type === 'setup')
            <p>Your account has been created on DEMS. To get started, please set up your password by clicking the button below.</p>
            <p>This link will expire in <strong>60 minutes</strong>.</p>
        @else
            <p>We received a request to reset your DEMS password. Click the button below to choose a new password.</p>
            <p>This link will expire in <strong>60 minutes</strong>. If you did not request a reset, you can safely ignore this email.</p>
        @endif

        <p>
            <a href="{{ $actionUrl }}" class="btn">
                {{ $type === 'setup' ? 'Set Up My Password' : 'Reset My Password' }}
            </a>
        </p>

        <hr class="divider">

        <p class="note">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <a href="{{ $actionUrl }}">{{ $actionUrl }}</a>
        </p>

        <p class="note">This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
