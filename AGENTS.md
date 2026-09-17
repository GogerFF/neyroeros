# Neyroeros Deployment Guide

## Local development
```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Local production build
```bash
npx prisma generate
npm run typecheck
npm run test
npx next build --webpack
```

## Deploy to Spaceship cPanel (shared hosting)

### One-time setup
1. Create Node.js app in Setup Node.js App (Node.js 22, Production mode).
2. Clone repo: `git clone https://github.com/GogerFF/neyroeros.git ~/neyroeros`
3. Copy `.env` to `~/neyroeros/.env`
4. Activate venv: `source /home/zogjyjpois/nodevenv/neyroeros/22/bin/activate`
5. Install deps: `npm install --no-audit --no-fund`
6. Apply migrations: `npx prisma migrate deploy && npx prisma generate`

### Routine update (no schema change)
```bash
cd ~/neyroeros && git pull origin master && touch tmp/restart.txt
```

### Update WITH schema migration
```bash
cd ~/neyroeros && source /home/zogjyjpois/nodevenv/neyroeros/22/bin/activate && git pull origin master && npx prisma migrate deploy && npx prisma generate && touch tmp/restart.txt
```

### Verify after deploy
```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://neyroeros.com/
curl -fsS -o /dev/null -w '%{http_code}\n' https://neyroeros.com/robots.txt
curl -fsS -o /dev/null -w '%{http_code}\n' https://neyroeros.com/sitemap.xml
tail -20 stderr.log
```

Page checks alone do NOT prove a deploy: the HTML is rendered server-side from
`.next/server/`, so if the checkout applied only partly the page still returns 200
while the client chunks and CSS it references 404 — the site then looks broken in a
browser but "fine" from curl. Always check the assets the page actually references:

```bash
H=$(curl -sS -H 'Cookie: age_confirmed=1' https://neyroeros.com/)
for u in $(printf '%s' "$H" | grep -o '/_next/static/[A-Za-z0-9._/-]*\.\(js\|css\)' | sort -u); do
  printf '%-56s %s\n' "$(basename "$u")" "$(curl -sS -I "https://neyroeros.com$u" 2>/dev/null | head -1 | tr -d '\r')"
done
```
Every line must be `200 OK`; any `404` means the working tree does not match the
repo — run `git status --short` and re-check out (see recovery below).

### Recovery: partial checkout / 404ing assets
`git fetch origin master && git reset --hard origin/master` is safe here only because
`prisma/dev.db` and `storage/uploads/*` are untracked; back the DB up first anyway:
```bash
cd ~/neyroeros && source /home/zogjyjpois/nodevenv/neyroeros/22/bin/activate
cp -n prisma/dev.db ~/dev.db.bak-$(date +%s)
git fetch origin master && git reset --hard origin/master
npx prisma migrate deploy && npx prisma generate && touch tmp/restart.txt
```
`npx` exists ONLY inside the activated venv: any deploy chain that calls `npx` before
activating the venv aborts on `npx: command not found` and never reaches
`touch tmp/restart.txt`, leaving the old process running against new files on disk.


## Key constraints
- Prisma pinned at 6.19.0 — do NOT upgrade
- Cyrillic slugs fail on Passenger — always use `slugifyLatin()`
- Server Actions fail after deploy due to build version mismatch — use POST Route Handlers instead
- Production `.next` is committed to git (without cache)
- External SSH is blocked — all operations via cPanel Terminal
- `npx` is only available after venv activation
