"""Run the Antigravity audit in short segments.

Two failures this driver must survive:
  * the launcher is a bash script, which Windows Python cannot exec directly —
    call agy.exe by absolute path instead (account/keyring auth mode);
  * a single long run dies on token expiry (UNAUTHENTICATED, ~13 min) and loses
    the whole report — so each segment is bounded and persisted as it returns.
"""
import json
import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(r"C:\Users\sklya\Desktop\html")
OUT = ROOT / "agy-audit"
WORKSPACE = "C:/Users/sklya/Desktop/html"
LOCALAPPDATA = os.environ.get("LOCALAPPDATA", str(pathlib.Path.home() / "AppData/Local"))
AGY = pathlib.Path(LOCALAPPDATA) / "agy" / "bin" / "agy.exe"

SEGMENTS = [
    ("1-live", "prompt-1-live.txt"),
    ("2-code", "prompt-2-code.txt"),
    ("3-security", "prompt-3-security.txt"),
]

if not AGY.exists():
    print(f"FATAL: agy.exe not found at {AGY}")
    sys.exit(1)
print(f"binary: {AGY}", flush=True)


def call(prompt: str, timeout_s: int):
    """Returns (status, body, returncode, stderr)."""
    result = subprocess.run(
        [str(AGY), "--add-dir", WORKSPACE, "--mode", "plan",
         "--print-timeout", "9m", "-p", prompt, "--output-format", "json"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        cwd=str(ROOT), timeout=timeout_s,
    )
    stderr = (result.stderr or "").strip()
    try:
        payload = json.loads(result.stdout)
        body = payload.get("response") or payload.get("error") or ""
        return payload.get("status", "?"), body, result.returncode, stderr
    except Exception as exc:  # noqa: BLE001
        return f"NO_JSON({exc})", (result.stdout or "")[:6000], result.returncode, stderr


# Smoke test first: a dead credential must not cost 20 minutes of segments.
status, body, code, err = call("Reply with exactly: PONG", 150)
print(f"smoke: status={status} exit={code} body={body.strip()[:20]!r}", flush=True)
if "PONG" not in body:
    print(f"ABORT: auth/CLI unusable. stderr tail: {err[-400:]}", flush=True)
    sys.exit(2)

for name, prompt_file in SEGMENTS:
    prompt = (OUT / prompt_file).read_text(encoding="utf-8")
    try:
        status, body, code, err = call(prompt, 700)
        (OUT / f"{name}.md").write_text(body, encoding="utf-8")
        (OUT / f"{name}.err").write_text(err, encoding="utf-8")
        print(f"{name}: status={status} exit={code} chars={len(body)}", flush=True)
    except Exception as exc:  # noqa: BLE001 - one bad segment must not stop the batch
        print(f"{name}: FAILED {type(exc).__name__}: {exc}", flush=True)

print("ALL_DONE", flush=True)
