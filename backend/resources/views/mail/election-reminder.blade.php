<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .box { background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
<div class="container">
    <h2>Election Reminder</h2>

    <p>Dear {{ $user->name }},</p>

    <p>This is a reminder that you are enrolled as a voter in an upcoming election:</p>

    <div class="box">
        <strong>{{ $election->name }}</strong><br>
        Election Date: {{ $election->election_date->format('F j, Y') }}<br>
        Voting Window: {{ $election->voting_start_time }} – {{ $election->voting_end_time }} (GMT+6)
    </div>

    <p>Please log in to the DEMS portal when the election is active to cast your vote.</p>

    <p><a href="{{ $loginUrl }}" class="btn">Go to DEMS Portal</a></p>

    <p>If you have already set up your account, simply log in with your email and password.</p>

    <div class="footer">
        <p>You are receiving this because you are enrolled as a voter. If this is unexpected, contact your organization admin.</p>
    </div>
</div>
</body>
</html>
