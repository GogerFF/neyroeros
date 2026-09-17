"""Re-run the third audit segment as two narrower runs.

The combined security+a11y+UX prompt hit the 9-minute print timeout with the turn
still in progress and returned an empty body (status was still SUCCESS — a
timeout must be read from stderr, not from the status field). Narrow scopes fit
inside the window and each result is persisted immediately.
"""
import json
import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(r"C:\Users\sklya\Desktop\html")
OUT = ROOT / "agy-audit"
WORKSPACE = "C:/Users/sklya/Desktop/html"
LOCALAPPDATA = os.environ.get("LOCALAPPDATA", str(pathlib.Path.home() / "AppData" / "Local"))
AGY = pathlib.Path(LOCALAPPDATA) / "agy" / "bin" / "agy.exe"

SECURITY = """Аудит БЕЗОПАСНОСТИ проекта в рабочей директории: Neyroeros — 18+ галерея AI-арта (Next.js 16 App Router, Prisma 6.19 + SQLite, Sharp, Auth.js Credentials, деплой cPanel/Passenger).

Файлы НЕ меняй. Только проверь и перечисли максимум 6 самых серьёзных проблем, каждая со ссылкой файл:строка:
1. Загрузка файлов: проверка типа по сигнатуре или по MIME от браузера, лимиты размера, path traversal в lib/storage/*.
2. Авторизация: эндпоинты в app/api/** без проверки requireUser/requireAdmin; может ли пользователь менять чужие записи (сверь authorId).
3. POST-обработчики без проверки Origin/CSRF.
4. Где нужен, но отсутствует rate limit.
5. XSS через dangerouslySetInnerHTML; инъекции в запросы.
6. Утечка чужих данных (черновики, e-mail, внутренние ошибки) в ответах.

ФОРМАТ: markdown на русском, максимум 6 пунктов: файл:строка -> проблема -> влияние (высокое/среднее/низкое) -> действие. Без общих слов. Коротко."""

A11Y_UX = """Аудит ДОСТУПНОСТИ и UX проекта в рабочей директории: Neyroeros — 18+ галерея AI-арта (Next.js 16 App Router, React 19, Tailwind 4).

Файлы НЕ меняй. Только проверь и перечисли максимум 6 самых серьёзных проблем, каждая со ссылкой файл:строка:
1. Изображения без alt или с бесполезным alt в app/** и components/**.
2. Иконочные кнопки без aria-label; кнопки без текста.
3. Формы: label, связь label-input, сообщения об ошибках, автофокус.
4. Порядок заголовков (h1/h2/h3) и пропуски уровней на страницах.
5. Контраст мелкого текста (например, footer, card-meta, .category-hint) на тёмном фоне.
6. UX: состояния загрузки, пустые состояния, что видно при ошибке, понятность главного действия.

ФОРМАТ: markdown на русском, максимум 6 пунктов: файл:строка -> проблема -> влияние (высокое/среднее/низкое) -> действие. Без общих слов. Коротко."""

SEGMENTS = [("3a-security", SECURITY), ("3b-a11y-ux", A11Y_UX)]

if not AGY.exists():
    print(f"FATAL: agy.exe not found at {AGY}")
    sys.exit(1)


def call(prompt: str, timeout_s: int):
    result = subprocess.run(
        [str(AGY), "--add-dir", WORKSPACE, "--mode", "plan",
         "--print-timeout", "8m", "-p", prompt, "--output-format", "json"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        cwd=str(ROOT), timeout=timeout_s,
    )
    stderr = (result.stderr or "").strip()
    try:
        payload = json.loads(result.stdout)
        return payload.get("status", "?"), (payload.get("response") or payload.get("error") or ""), stderr
    except Exception as exc:  # noqa: BLE001
        return f"NO_JSON({exc})", (result.stdout or "")[:4000], stderr


for name, prompt in SEGMENTS:
    try:
        status, body, err = call(prompt, 600)
        (OUT / f"{name}.md").write_text(body, encoding="utf-8")
        (OUT / f"{name}.err").write_text(err, encoding="utf-8")
        timed_out = "print timeout" in err
        print(f"{name}: status={status} chars={len(body)} timeout={timed_out}", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"{name}: FAILED {type(exc).__name__}: {exc}", flush=True)

print("ALL_DONE", flush=True)
