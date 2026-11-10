FROM php:8.4.27-apache-bookworm

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpng-dev libjpeg62-turbo-dev libzip-dev libcurl4-openssl-dev \
        libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo pdo_mysql gd zip bcmath mbstring pcntl xml opcache \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php.ini /usr/local/etc/php/conf.d/calculadora.ini
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

COPY composer.json composer.lock ./
ARG COMPOSER_FLAGS=""
RUN composer install $COMPOSER_FLAGS --no-scripts --optimize-autoloader

COPY . .
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions \
        storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
