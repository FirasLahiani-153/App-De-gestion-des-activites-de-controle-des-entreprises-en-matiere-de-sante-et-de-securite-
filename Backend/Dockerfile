FROM php:8.4-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    unzip \
    git \
    curl \
    libzip-dev \
    libonig-dev \
    zlib1g-dev \
    && docker-php-ext-install \
        pdo_mysql \
        zip \
        mbstring \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN php artisan storage:link || true

EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=$PORT