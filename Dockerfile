FROM nginx:alpine3.24

LABEL maintainer="boingbasti"
LABEL description="Configuration Generator for NordVPN Gateway"

# Copy web files into nginx html folder
COPY ./html /usr/share/nginx/html

EXPOSE 80