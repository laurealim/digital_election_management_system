<?php

namespace App\Providers;

use App\Events\ElectionCompleted;
use App\Events\VoteCast;
use App\Listeners\LogVoteCast;
use App\Listeners\PublishElectionResults;
use App\Models\Election;
use App\Observers\ElectionObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Fix MySQL key length issue for older MySQL / MariaDB versions
        Schema::defaultStringLength(191);

        // Per-user rate limiter for voting (not IP-based, so multiple users on
        // the same network / laptop each get their own independent bucket)
        RateLimiter::for('voting', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        Election::observe(ElectionObserver::class);

        Event::listen(VoteCast::class, LogVoteCast::class);
        Event::listen(ElectionCompleted::class, PublishElectionResults::class);
    }
}
