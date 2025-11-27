FROM nginx:alpine

# Metadaten
LABEL maintainer="boingbasti"
LABEL description="Configuration Generator for NordVPN Gateway"

# Kopiere die Webseiten-Dateien in den Nginx-Ordner
# (Stelle sicher, dass du index.html und generator.js im Unterordner 'html' hast)
COPY ./html /usr/share/nginx/html

# Exponiere Port 80
EXPOSE 80