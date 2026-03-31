<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 28px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
<div class="container">
    <h2>Election Results Published</h2>

    <p>Dear {{ $user->name }},</p>

    <p>The results for the following election have been published:</p>

    <div class="box">
        <strong>{{ $election->name }}</strong><br>
        Election Date: {{ $election->election_date->format('F j, Y') }}<br>
        Completed: {{ $election->completed_at?->format('F j, Y g:i A') ?? 'N/A' }} (GMT+6)
    </div>

    <p>You can view the full results including winner details and turnout statistics in the DEMS portal.</p>

    <p><a href="{{ $resultsUrl }}" class="btn">View Results</a></p>

    <div class="footer">
        <p>You are receiving this as the administrator of this election.</p>
    </div>
</div>
</body>
</html>
