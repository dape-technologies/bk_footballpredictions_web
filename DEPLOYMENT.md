# Namecheap cPanel deployment

This deployment runs the built Vue PWA and Django API as one same-origin WSGI
application through cPanel's **Setup Python App**. This is important because the
site uses Django session and CSRF cookies.

## Database compatibility

Production uses Namecheap's MariaDB 11.4 service through Django's MySQL backend.
MariaDB 11.4 is supported by Django 5.2. The database must use InnoDB so
transactions and foreign keys are enforced; Namecheap's default MariaDB setup
uses InnoDB.

## 1. Prepare the upload locally

From `bk_footballpredictions_web`, run:

```powershell
npm ci
npm run prepare:cpanel
```

This creates the production frontend in
`bk_footballpredictions_api/frontend_dist`. Upload the contents of
`bk_footballpredictions_api` to a private directory in your cPanel home, such as
`/home/CPANEL_USER/bk_app`. Do not place source code or secrets in `public_html`.
Exclude `.git`, `.venv`, `.env`, `db.sqlite3`, `__pycache__`, and `staticfiles`.

## 2. Create MariaDB

In cPanel, open **MySQL Databases** (the server behind this interface is
MariaDB), create a database and user, then add the user to the database with all
privileges. cPanel prefixes both names with your account username; use the full
displayed names in the environment settings.

## 3. Create the Python application

In cPanel > **Setup Python App**, create an application with:

- Python version: 3.12
- Application root: `bk_app`
- Application URL: the final domain, at `/`
- Application startup file: `passenger_wsgi.py`
- Application entry point: `application`

The root URL lets Django serve both the PWA and `/api` on the same origin.

Create `/home/CPANEL_USER/bk_app/.env` from the API repository's
`.env.cpanel.example`, fill in the real values, and set its permissions to 600.
The deployment pipeline preserves this server-only file. Values configured in
**Setup Python App** take precedence, so the same values may also be entered
there if desired.

```text
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<long-random-secret>
DJANGO_ALLOWED_HOSTS=yourdomain.example,www.yourdomain.example
CSRF_TRUSTED_ORIGINS=https://yourdomain.example,https://www.yourdomain.example
DB_NAME=cpaneluser_bk_predictions
DB_USER=cpaneluser_bk_user
DB_PASSWORD=<database-password>
DB_HOST=localhost
DB_PORT=3306
DJANGO_SECURE_COOKIES=True
DJANGO_SECURE_SSL_REDIRECT=True
DJANGO_SERVE_MEDIA=True
DJANGO_SECURE_HSTS_SECONDS=0
```

In cPanel Terminal:

```bash
chmod 600 /home/CPANEL_USER/bk_app/.env
```

Generate `DJANGO_SECRET_KEY` locally with:

```powershell
..\bk_footballpredictions_api\.venv\Scripts\python.exe -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 4. Install and initialize

Use the activation command shown by cPanel, then run these commands from the
application root in cPanel Terminal/SSH:

```bash
python -m pip install -r requirements.txt
python manage.py check --deploy
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

Do not run `seed_demo` in production. Restart the app from **Setup Python App**.

## 5. Verify

After Namecheap SSL is active, check:

- `https://yourdomain.example/`
- `https://yourdomain.example/api/health/`
- `https://yourdomain.example/admin/`
- registration, login, logout, and an image upload

Keep `DJANGO_SECURE_HSTS_SECONDS=0` until HTTPS and redirects work correctly.
Then set it to `31536000`; enable subdomains/preload only if every subdomain is
permanently HTTPS.

## Automatic GitHub deployments

Both repositories contain a GitHub Actions workflow. Pull requests from
`marcdemo` into `main` run their checks without receiving production secrets.
Merging into `main` deploys automatically:

- The API workflow installs dependencies, runs all Django tests, uploads a
  staged release, runs the production check and migrations, publishes the code,
  collects static files, and restarts Passenger.
- The web workflow builds the PWA, uploads it to a staged directory, atomically
  swaps `frontend_dist`, and restarts Passenger.

The workflows never upload or delete `.env`, `media`, the database,
`staticfiles`, `.htaccess`, logs, or the cPanel virtual environment.

### 1. Enable deployment SSH

Enable SSH in cPanel's **Manage Shell** tool. Create a dedicated Ed25519
deployment key without a passphrase (Actions is non-interactive), authorize its
public key in cPanel, and retain the private key for GitHub. Keep this key scoped
to deployment and never reuse a personal SSH key. Namecheap shared hosting uses
port `21098`.

```bash
ssh-keygen -t ed25519 -C github-actions-cpanel -f cpanel_deploy -N ""
```

Connect manually once and verify the server fingerprint. Then capture the
server's complete known-hosts line for GitHub, for example:

```bash
ssh-keyscan -p 21098 server123.web-hosting.com
```

Do not rely on an unverified scan: compare its fingerprint with the one from the
verified manual connection or Namecheap support.

### 2. Configure both GitHub repositories

In each repository, open **Settings > Environments**, create an environment
named `production`, and add these environment secrets:

| Secret | Value |
| --- | --- |
| `CPANEL_HOST` | Namecheap server hostname, not the website URL |
| `CPANEL_USERNAME` | cPanel account username |
| `CPANEL_SSH_PRIVATE_KEY` | Complete dedicated OpenSSH private key |
| `CPANEL_KNOWN_HOSTS` | Verified `ssh-keyscan` output |

Add these environment variables to both repositories:

| Variable | Example |
| --- | --- |
| `CPANEL_SSH_PORT` | `21098` |
| `CPANEL_APP_ROOT` | `/home/cpaneluser/bk_app` |
| `PRODUCTION_URL` | `https://yourdomain.example` |

Add this additional variable to the API repository:

| Variable | Example |
| --- | --- |
| `CPANEL_VENV_ROOT` | `/home/cpaneluser/virtualenv/bk_app/3.12` |

Use the exact virtual-environment path shown in cPanel's activation command.
Optionally add required reviewers to the `production` environment if deployments
should wait for manual approval.

### 3. First automated release

Commit and push the cPanel deployment changes to `marcdemo`, then open pull
requests into `main`. The pull-request workflows validate both projects. Merge
the API pull request first; after its deployment succeeds, merge the web pull
request. Later merges deploy only the changed component. A failed build or test
never reaches the server, and a failed staged validation does not publish the
API code.

Each workflow can also be started manually from **GitHub > Actions**. Back up
MariaDB and the `media` directory independently; deployments do not constitute
a data backup.
