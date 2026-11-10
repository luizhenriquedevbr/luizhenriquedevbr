#!/bin/sh
set -e

php artisan storage:link --force 2>/dev/null || true
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
php artisan migrate --force || true

exec apache2-foreground
