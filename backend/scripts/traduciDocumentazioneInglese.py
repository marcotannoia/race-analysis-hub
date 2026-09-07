#!/usr/bin/env python3
"""Translate Italian Markdown prose to English while preserving code and URLs."""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_env() -> None:
    for raw in (ROOT / "backend" / ".env").read_text(encoding="utf-8").splitlines():
        if not raw or raw.lstrip().startswith("#") or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def protect(text: str) -> tuple[str, list[str]]:
    values: list[str] = []

    def replace(match: re.Match[str]) -> str:
        values.append(match.group(0))
        return f"ZXQ{len(values) - 1}QXZ"

    return re.sub(r"`[^`]+`|https?://[^\s)>]+", replace, text), values


def restore(text: str, values: list[str]) -> str:
    for index, value in enumerate(values):
        text = text.replace(f"ZXQ{index}QXZ", value)
    return text


def translate(lines: list[str]) -> list[str]:
    endpoint = os.environ["AZURE_TRANSLATOR_ENDPOINT"].rstrip("/")
    query = urllib.parse.urlencode({"api-version": "3.0", "from": "it", "to": "en"})
    request = urllib.request.Request(
        f"{endpoint}/translate?{query}",
        data=json.dumps([{"text": line} for line in lines]).encode(),
        headers={
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": os.environ["AZURE_TRANSLATOR_KEY"],
            "Ocp-Apim-Subscription-Region": os.environ["AZURE_TRANSLATOR_REGION"],
        },
    )
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                payload = json.load(response)
            break
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 5:
                raise
            time.sleep(2 ** attempt)
    return [item["translations"][0]["text"] for item in payload]


def process(path: Path) -> None:
    source = path.read_text(encoding="utf-8").splitlines(keepends=True)
    targets: list[int] = []
    protected: list[str] = []
    tokens: list[list[str]] = []
    in_fence = False
    for index, raw in enumerate(source):
        line = raw.rstrip("\r\n")
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence or not line.strip() or re.fullmatch(r"[-:| ]+", line):
            continue
        safe, values = protect(line)
        targets.append(index)
        protected.append(safe)
        tokens.append(values)
    translated: list[str] = []
    for start in range(0, len(protected), 75):
        translated.extend(translate(protected[start:start + 75]))
        time.sleep(0.5)
    for index, value, values in zip(targets, translated, tokens):
        ending = "\n" if source[index].endswith(("\n", "\r")) else ""
        source[index] = restore(value, values) + ending
    path.write_text("".join(source), encoding="utf-8")
    print(path.relative_to(ROOT))


if __name__ == "__main__":
    load_env()
    for argument in sys.argv[1:]:
        process(ROOT / argument)
