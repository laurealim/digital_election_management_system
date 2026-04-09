# Server Configuration Log

## Server Details
| Key | Value |
|-----|-------|
| **IP** | 172.104.183.180 |
| **OS** | Ubuntu 24.04.3 LTS (Noble) |
| **User** | root |
| **Purpose** | DEMS Production Server |
| **Provider** | Linode |

---

## Installed Stack

| Software | Version | Status |
|----------|---------|--------|
| Apache2 | 2.4.58 | active |
| PHP | 8.4.19 | active (Apache + CLI) |
| MySQL | 8.0.45 | active |
| phpMyAdmin | 5.2.1 | active |
| Node.js | 22.22.2 | installed |
| npm | 10.9.7 | installed |
| Composer | 2.9.5 | installed |
| Git | 2.43.0 | installed |

> Note: PHP 8.5.4 is also present on the system (pulled by phpMyAdmin as dependency).
> Apache and CLI are both pinned to PHP 8.4.19 via `a2enmod php8.4` and `update-alternatives`.

---

## Configuration Details

### Apache
- Document root: `/var/www/html`
- Enabled modules: `mod_rewrite`, `mod_php8.4`, `mpm_prefork`
- PHP module: `php8.4` (disabled php8.5 for Apache)
- Config dir: `/etc/apache2/sites-available/`

### PHP 8.4
- Apache module: `/etc/apache2/mods-enabled/php8.4.load`
- CLI binary: `/usr/bin/php8.4` (set as default via update-alternatives)
- Extensions installed: `mysql`, `cli`, `common`, `mbstring`, `xml`, `curl`, `zip`, `bcmath`, `intl`, `gd`, `tokenizer`, `fileinfo`, `redis`, `fpm`

### MySQL 8.0
- Service: `mysql` (enabled, auto-start)
- Root user: `root@localhost`
- Root password: `laurealIM@1234`
- Auth plugin: `mysql_native_password`
- Config file: `/etc/mysql/mysql.conf.d/mysqld.cnf`

### phpMyAdmin 5.2.1
- URL: `http://172.104.183.180/phpmyadmin`
- Apache config: `/etc/apache2/conf-enabled/phpmyadmin.conf`
- DB user: `phpmyadmin@localhost` (auto-created)
- phpMyAdmin DB: `phpmyadmin` (auto-created)

### Node.js 22.x LTS
- Binary: `/usr/bin/node`
- Source: NodeSource PPA (`setup_22.x`)

### Composer 2.9.5
- Binary: `/usr/local/bin/composer`

### Git 2.43.0
- Binary: `/usr/bin/git`

---

## Application Deployment

### DEMS Application — Deployed
- [x] Clone repo from GitHub to `/var/www/dems`
- [x] Configure `.env` for production (`APP_ENV=production`, `APP_DEBUG=false`)
- [x] Run `composer install --no-dev --optimize-autoloader`
- [x] Run `php artisan key:generate`
- [x] Run `php artisan migrate --force` — 23 migrations
- [x] Run `php artisan db:seed` — roles, permissions, super admin seeded
- [x] Run `php artisan storage:link`
- [x] Run `php artisan config:cache && route:cache && view:cache`
- [x] Build frontend: `npm install && npm run build` → `/var/www/dems/frontend/dist`
- [x] Configure Apache virtual host (`/etc/apache2/sites-available/dems.conf`)
- [x] Set file permissions (`storage/`, `bootstrap/cache/` → `www-data:www-data 775`)
- [x] Configure queue worker (supervisor) — 2 worker processes running
- [x] Configure scheduler (cron) — runs every minute

### Application URLs
| URL | Purpose |
|-----|---------|
| `http://172.104.183.180/` | Frontend (React SPA) |
| `http://172.104.183.180/api/v1/` | Backend API (Laravel) |
| `http://172.104.183.180/phpmyadmin` | phpMyAdmin |

### Default Login
| Field | Value |
|-------|-------|
| Email | `admin@dems.app` |
| Password | `Admin@1234` |

### Production .env Key Settings
| Key | Value |
|-----|-------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `http://172.104.183.180` |
| `DB_DATABASE` | `dems_production` |
| `DB_PASSWORD` | `laurealIM@1234` |
| `QUEUE_CONNECTION` | `database` |
| `CACHE_STORE` | `file` |
| `SESSION_DRIVER` | `file` |
| `FRONTEND_URL` | `http://172.104.183.180` |
| `MAIL_MAILER` | `smtp` |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `465` |
| `MAIL_USERNAME` | `laureal.seu@gmail.com` |
| `MAIL_ENCRYPTION` | `ssl` |
| `MAIL_FROM_ADDRESS` | `laureal.seu@gmail.com` |

### Apache Virtual Host
- Config: `/etc/apache2/sites-available/dems.conf`
- Frontend root: `/var/www/dems/frontend/dist` (SPA with FallbackResource)
- API rewrite: `/api/*` → `/var/www/dems/backend/public/index.php`

### Queue Worker (Supervisor 4.2.5)
- Config: `/etc/supervisor/conf.d/dems-worker.conf`
- Command: `php artisan queue:work --queue=emails,heavy,elections --sleep=3 --tries=3 --max-time=3600`
- Run as: `www-data`
- Processes: `2` (`dems-worker_00`, `dems-worker_01`)
- Auto-restart: yes
- Log file: `/var/www/dems/backend/storage/logs/worker.log` (max 10MB, 5 backups)
- Manage with:
  ```bash
  supervisorctl status                  # check status
  supervisorctl restart dems-worker:*  # restart workers
  supervisorctl stop dems-worker:*     # stop workers
  ```

### Cron Scheduler
- Config: `/etc/cron.d/dems-scheduler`
- Entry: `* * * * * www-data cd /var/www/dems/backend && php artisan schedule:run`
- Runs: every minute as `www-data`
- Log: `/var/log/dems-scheduler.log`
- Purpose: auto start/stop elections (`StartElectionJob` / `StopElectionJob`)

---

## Change Log

| Date | Action | Details |
|------|--------|---------|
| 2026-04-08 | Server rebuild | Fresh Ubuntu 24.04.3 LTS install |
| 2026-04-08 | System update | `apt-get update && upgrade` |
| 2026-04-08 | Apache installed | v2.4.58, `mod_rewrite` enabled |
| 2026-04-08 | PHP 8.4 installed | v8.4.19 via ondrej/php PPA, set as default |
| 2026-04-08 | MySQL installed | v8.0.45, root password set to `laurealIM@1234` |
| 2026-04-08 | Node.js installed | v22.22.2 via NodeSource PPA |
| 2026-04-08 | Composer installed | v2.9.5 at `/usr/local/bin/composer` |
| 2026-04-08 | Git installed | v2.43.0 |
| 2026-04-08 | phpMyAdmin installed | v5.2.1, accessible at `/phpmyadmin` |
| 2026-04-09 | DEMS app deployed | Repo at `/var/www/dems`, frontend built, API live |
| 2026-04-09 | Apache configured | Virtual host serving frontend + API on port 80 |
| 2026-04-09 | DB seeded | 23 migrations, roles/permissions/super admin seeded |
| 2026-04-09 | Supervisor installed | v4.2.5, 2 queue worker processes running (`dems-worker_00`, `dems-worker_01`) |
| 2026-04-09 | Queue worker configured | NEW `/etc/supervisor/conf.d/dems-worker.conf` — queues: emails, heavy, elections |
| 2026-04-09 | Cron scheduler configured | NEW `/etc/cron.d/dems-scheduler` — runs `php artisan schedule:run` every minute |
| 2026-04-09 | Gmail SMTP configured | Server `.env` updated — `smtp.gmail.com:465 SSL`, from `laureal.seu@gmail.com` |