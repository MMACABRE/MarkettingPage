# klerk marketing site

The public introduction page for **klerk** («کلرک»), the Persian patient-records and clinic management web app. It is a
static, right-to-left Persian page: plain HTML, CSS and one small script, with no build step, no server code, no
database and nothing loaded from other websites. It is separate from the clinic app and holds no patient data.

```
site/                the website: index.html, site.css, site.js, img/, fonts/, icons
Caddyfile            web server config: HTTPS, security headers, caching
docker-compose.yml   runs Caddy in Docker and serves site/
.env.example         copy to .env and set DOMAIN
```

## Preview on a computer

Any static file server works, for example `python -m http.server 8000 --directory site`, then open
http://127.0.0.1:8000/. Opening `site/index.html` straight from the disk also works.

## Runbook for a deployment agent

You install this site on a Linux server (Ubuntu 24.04 or similar) and keep it up to date. Stop at the first
failure and report it. When a step needs the owner, write `needs input:` and say exactly what they must do.

**What only the owner can supply**

| Item | Why you cannot do it |
|---|---|
| The domain name and its DNS **A record** pointing at the server's public IP | It lives at the registrar |
| The server itself, with SSH access | The owner rents and pays for it |

**Do not put this site on a server that already runs a klerk clinic.** That server's Caddy already holds ports 80 and
443; a second one cannot start, and changing the clinic's configuration is not your job. Use a separate server, or
ask the owner.

### First install

1. **Check DNS.** `getent hosts <domain>` must print this server's public IP (`curl -s https://api.ipify.org`). If
   not: `needs input:` ask the owner to set the A record. Also check there is no wrong AAAA record
   (`getent ahostsv6 <domain>`); a wrong one breaks certificate issuing.
2. **Firewall.** Allow SSH first, so the owner is not locked out:
   ```
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 443/udp
   sudo ufw --force enable
   ```
3. **Docker.** If `docker compose version` fails: `curl -fsSL https://get.docker.com | sudo sh`, then
   `sudo usermod -aG docker "$USER"` and start a new shell (or prefix the docker commands with `sudo`).
4. **Code.** `sudo mkdir -p /opt/klerk-site && sudo chown "$USER": /opt/klerk-site && git clone https://github.com/MMACABRE/MarkettingPage.git /opt/klerk-site`
5. **Settings.** `cp /opt/klerk-site/.env.example /opt/klerk-site/.env`, then set `DOMAIN=` to the domain (name
   only: no `https://`, no slash). Check with `grep ^DOMAIN= /opt/klerk-site/.env`.
6. **Start.** `cd /opt/klerk-site && docker compose up -d`. Caddy requests the certificate by itself; the first one
   can take a minute. Read `docker compose logs --tail 50 web` if it does not come up.
7. **Check.** Record each result in your report:

| # | Check | Expect |
|---|---|---|
| 1 | `curl -sI http://<domain>` | `308` redirect to `https://` |
| 2 | `curl -sI https://<domain>/` | `200`, a `strict-transport-security` and a `content-security-policy` header, no `server` header |
| 3 | `curl -s https://<domain>/ \| grep -c klerk` | a number above 0 |
| 4 | `curl -s -o /dev/null -w '%{http_code}' https://<domain>/Caddyfile` | `404`: only `site/` is served |
| 5 | `docker compose ps` after `sudo reboot` (ask the owner first) | `web` is running again by itself |

### Update to a new version

When the owner says the site changed:

```
cd /opt/klerk-site
git pull --ff-only
docker compose up -d
docker compose restart web
```

Files in `site/` are live as soon as the pull finishes. The restart is for `Caddyfile`: it is mounted as a single
file, and such a mount keeps showing the old file until the container restarts (a second or two without the site).
Then run checks 1 to 4 again. If `git pull --ff-only` refuses, do not force it: report `git status` to the owner.

### Rules

- Never edit files under `site/` on the server. Changes come only through the repository.
- Never commit or push from the server.
- `.env` stays on the server; it is not in the repository.
