<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailOutbox extends Model
{
    public $timestamps = false;

    protected $table = 'email_outbox';

    protected $fillable = [
        'type',
        'to_address',
        'subject',
        'body',
        'reference_id',
        'organization_id',
        'status',
    ];
}