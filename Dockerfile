FROM nginx:alpine

# Config nginx (redirections)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Contenu de l'ancien /var/www (widget.html, report.html, edit.html, ...)
COPY www/ /usr/share/nginx/html/

EXPOSE 80
