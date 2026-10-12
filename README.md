# OpenWindMap : déploiement sur Coolify

Site statique servi par nginx, avec les redirections, déployé sur Coolify via un Dockerfile.

## Structure du dépôt

```
.
├── Dockerfile
├── nginx.conf        # template nginx (utilise la variable ${DOMAIN})
├── README.md
└── www/              # contenu du site
    ├── index.html
    ├── report.html
    ├── widget.html
    ├── css/ img/ js/ vendors/ old/
    └── ...
```

## Fonctionnement

- **Coolify (Traefik)** gère le HTTPS, les certificats Let's Encrypt et la redirection http → https.
- **nginx** écoute uniquement sur le port 80 interne, sans SSL, et applique les règles de redirection et de réécriture.
- Le nom de domaine n'est pas écrit en dur : `nginx.conf` est un **template**. Au démarrage du conteneur, l'image nginx remplace `${DOMAIN}` par la variable d'environnement du même nom.

### Dockerfile

```dockerfile
FROM nginx:alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY www/ /usr/share/nginx/html/

# Ne substituer que les variables DOMAIN* (protège $host, $uri, $1, ...)
ENV NGINX_ENVSUBST_FILTER=DOMAIN

EXPOSE 80
```

> Attention à l'orthographe de la variable : `NGINX_ENVSUBST_FILTER` (avec un **B**).

### nginx.conf (extrait)

```nginx
server {
    listen 80 default_server;
    server_name www.${DOMAIN};

    root /usr/share/nginx/html;
    absolute_redirect off;

    location / {
        try_files $uri $uri/index.html $uri.html =404;
    }

    # ... rewrites (widget, identifiants numériques, forum, etc.)
}

server {
    listen 80;
    server_name ${DOMAIN};
    return 302 https://www.${DOMAIN}$request_uri;
}
```

Les redirections utilisent `$host` pour rester valables quel que soit le domaine (test ou production).

## Configuration dans Coolify

### 1. Créer l'application

- **Source** : le dépôt Git
- **Build Pack** : `Dockerfile`

### 2. Réglages généraux

| Champ | Valeur |
|---|---|
| **Ports Exposes** | `80` |
| **Domains** | `https://www.exemple.org,https://exemple.org` |

> **Important** : *Ports Exposes* vaut `3000` par défaut. Il doit correspondre au `listen` de nginx (80). Le `EXPOSE` du Dockerfile n'est qu'une documentation et n'est pas utilisé par Coolify. Si le port est faux, le résultat est une erreur **502 Bad Gateway**.

### 3. Variables d'environnement

| Variable | Exemple | Description |
|---|---|---|
| `DOMAIN` | `exemple.org` | Domaine sans `www.` |

La variable doit être disponible au **runtime** (c'est le cas par défaut).

### 4. DNS

Les enregistrements A/AAAA de **chaque hôte** doivent pointer vers le serveur Coolify **avant** le déploiement :

- `exemple.org`
- `www.exemple.org`

Sans cela, la génération des certificats échoue.

### 5. Déployer

Utilisez **Redeploy** (et pas seulement Restart) après tout changement de domaine ou de port : les labels Traefik ne sont régénérés qu'au déploiement.

## Règles de redirection

| URL | Comportement |
|---|---|
| `/` | sert `index.html` |
| `/123`, `/PP123` | 302 vers `/pioupiou-123` (selon la plage de l'identifiant) |
| `/850` | 302 vers `/owm-850` |
| `/1500` | 302 vers `/windbird-1500` |
| `/pioupiou-123`, `/owm-900`, ... | sert `report.html` (l'URL ne change pas) |
| `/widget/123` | 301 vers `/widget/PP123` |
| `/widget/PP123` | sert `widget.html` |
| `/123/edit` | sert `edit.html` (voir la remarque ci-dessous) |
| `/description`, `/gps`, `/coop` | 302 vers le forum |
| `/pioupiou/...` | 301 vers la catégorie du forum |
| `/data` | 302 vers developers.openwindmap.org |
| `exemple.org/...` | 302 vers `www.exemple.org/...` |

Les règles sont évaluées **dans l'ordre** du fichier : ne les réordonnez pas sans vérifier les plages d'identifiants.

## Vérifications après déploiement

```bash
# Page d'accueil
curl -I https://www.exemple.org/                  # 200

# Redirection d'un ancien identifiant
curl -I https://www.exemple.org/123               # 302 -> /pioupiou-123

# Page de station
curl -I https://www.exemple.org/pioupiou-123      # 200

# Widget
curl -I https://www.exemple.org/widget/123        # 301 -> /widget/PP123

# Domaine nu vers www
curl -I https://exemple.org/foo                   # 302 -> https://www.exemple.org/foo

# http vers https (Traefik)
curl -I http://www.exemple.org/                   # 301/308 -> https
```

Contrôler que la substitution du domaine s'est bien faite :

```bash
docker exec <conteneur> grep server_name /etc/nginx/conf.d/default.conf
```

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| **502 Bad Gateway** | *Ports Exposes* ≠ port d'écoute de nginx | Mettre `80`, puis Redeploy |
| **404 sur `/`** | `try_files` mal configuré | Utiliser le `location /` ci-dessus |
| **Page sans CSS/JS** | `try_files $uri.html` seul : les fichiers statiques ne sont pas trouvés | Utiliser `try_files $uri $uri/index.html $uri.html =404;` |
| **`${DOMAIN}` visible dans la config générée** | Variable absente, ou fichier pas dans `/etc/nginx/templates/` | Vérifier la variable dans Coolify et le `COPY` du Dockerfile |
| **Boucle de redirection** | Le bloc du domaine nu redirige vers lui-même | Rediriger vers `www.${DOMAIN}`, pas vers `$host` |
| **Erreur de certificat** | DNS non propagé ou hôte manquant dans *Domains* | Vérifier les enregistrements A/AAAA de chaque hôte |
| **Conteneur qui redémarre en boucle** | Erreur de syntaxe nginx | `docker logs <conteneur>` et chercher `[emerg]` |

## Commandes utiles

```bash
# Statut des conteneurs
docker ps -a --format 'table {{.Names}}\t{{.Status}}'

# Logs
docker logs --tail 50 <conteneur>

# Contenu servi
docker exec <conteneur> ls -la /usr/share/nginx/html

# Test interne de nginx
docker exec <conteneur> wget -S -O /dev/null http://localhost/
```