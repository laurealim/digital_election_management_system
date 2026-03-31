<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only apply to API responses — don't interfere with file downloads
        if ($request->is('api/*') && ! $this->isBinaryResponse($response)) {
            $response->headers->set('X-Content-Type-Options', 'nosniff');
            $response->headers->set('X-Frame-Options', 'DENY');
            $response->headers->set('X-XSS-Protection', '1; mode=block');
            $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
            $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'none'; frame-ancestors 'none'"
            );
            // Remove server-identifying headers
            $response->headers->remove('X-Powered-By');
            $response->headers->remove('Server');
        }

        return $response;
    }

    private function isBinaryResponse(Response $response): bool
    {
        $contentType = $response->headers->get('Content-Type', '');
        return str_starts_with($contentType, 'application/pdf')
            || str_starts_with($contentType, 'application/vnd.openxmlformats')
            || str_starts_with($contentType, 'application/octet-stream');
    }
}
