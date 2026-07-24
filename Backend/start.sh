#!/bin/sh

php artisan migrate --force --seed

php artisan storage:link || true

php artisan serve --host=0.0.0.0 --port=$PORT