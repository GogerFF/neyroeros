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

## Key constraints
- Prisma pinned at 6.19.0 — do NOT upgrade
- Cyrillic slugs fail on Passenger — always use `slugifyLatin()`
- Server Actions fail after deploy due to build version mismatch — use POST Route Handlers instead
- Production `.next` is committed to git (without cache)
- External SSH is blocked — all operations via cPanel Terminal
- `npx` is only available after venv activation
