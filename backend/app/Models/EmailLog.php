<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'mailable',
        'recipient',
        'subject',
        'status',
        'error',
        'related_id',
        'related_type',
    ];

    /**
     * Log a successful send.
     */
    public static function record(
        string $mailable,
        string $recipient,
        string $subject = '',
        ?int $relatedId = null,
        ?string $relatedType = null,
    ): void {
        static::create([
            'mailable'     => class_basename($mailable),
            'recipient'    => $recipient,
            'subject'      => $subject,
            'status'       => 'sent',
            'related_id'   => $relatedId,
            'related_type' => $relatedType,
        ]);
    }

    /**
     * Log a failed send.
     */
    public static function recordFailure(
        string $mailable,
        string $recipient,
        string $error,
        ?int $relatedId = null,
        ?string $relatedType = null,
    ): void {
        static::create([
            'mailable'     => class_basename($mailable),
            'recipient'    => $recipient,
            'status'       => 'failed',
            'error'        => $error,
            'related_id'   => $relatedId,
            'related_type' => $relatedType,
        ]);
    }
}
