<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .btn { display: inline-block; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
<div class="container">
    <h2>You have been invited to vote</h2>

    <p>Dear {{ $user->name }},</p>

    <p>
        You have been enrolled as a voter in the following election:
    </p>

    <p><strong>{{ $election->name }}</strong><br>
    Election Date: {{ $election->election_date->format('F j, Y') }}<br>
    Voting: {{ $election->voting_start_time }} – {{ $election->voting_end_time }} (GMT+6)</p>

    @if (! $user->hasSetPassword())
    <p>To participate, you first need to set up your account password by clicking the button below:</p>

    <p><a href="{{ $setupUrl }}" class="btn">Set Up Account &amp; Vote</a></p>

    <p>This link expires in 60 minutes. If you need a new link, contact your organization admin.</p>
    @else
    <p>Log in to the DEMS portal to cast your vote when the election is active.</p>
    @endif

    <div class="footer">
        <p>If you believe you received this email in error, please ignore it.</p>
    </div>
</div>
</body>
</html>
