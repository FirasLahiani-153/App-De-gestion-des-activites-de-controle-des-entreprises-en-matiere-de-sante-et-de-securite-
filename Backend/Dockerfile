FROM richarvey/nginx-php-fpm:php8.3

# Copy the Laravel app
COPY . /var/www/html/

# Laravel-specific settings for this image
ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 1
ENV REAL_IP_HEADER 1
ENV APP_ENV production
ENV APP_DEBUG false
ENV LOG_CHANNEL stderr

# Runs composer install, artisan migrate (if configured), key:generate, storage:link, caching
ENV COMPOSER_ALLOW_SUPERUSER 1
ENV SKIP_COMPOSER 0
ENV SKIP_CHOWN 0

EXPOSE 8080
CMD ["/start.sh"]