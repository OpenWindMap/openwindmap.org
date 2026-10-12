FROM nginx:alpine

# Config nginx (redirections)
COPY nginx.conf /etc/nginx/templates/default.conf.template


# Contenu du site www/
COPY www/ /usr/share/nginx/html/

# Ne substituer que les variables commençant par DOMAIN
# (protège les variables nginx comme $host, $uri, $1, $request_uri)
ENV NGINX_ENVSUBST_FILTER=^DOMAIN$


EXPOSE 80