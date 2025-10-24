#!/bin/sh
set -e

# Set default PORT if not provided
PORT=${PORT:-8000}

# Replace PORT in nginx config
sed -i "s/listen 8000;/listen $PORT;/g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
