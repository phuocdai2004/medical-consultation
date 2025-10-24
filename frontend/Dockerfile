# Build stage - we could add build tools here if needed
FROM node:22-alpine AS builder

WORKDIR /app


# Production stage - serve static files with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy frontend files
COPY . /usr/share/nginx/html/

# Fix permissions for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Set default PORT if not provided
ENV PORT=8000
EXPOSE ${PORT}

# Health check - use PORT variable
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/index.html || exit 1

# Start nginx (nginx docker image will automatically process templates in /etc/nginx/templates/)
CMD ["nginx", "-g", "daemon off;"]
