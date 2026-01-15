"""INGEST PDF -> JSON catalog

Usage:
  python scripts/ingest_pdf.py examples/modelos\ de\ email.pdf --out data/templates_from_pdf.json

This script extracts text from a PDF using PyPDF2 and applies simple heuristics to
segment templates (by lines starting with 'Subject:' or 'Template:' or by double newlines).
It emits a JSON array of templates with fields: id, name, subject, body, slots.
"""
from __future__ import annotations
import re
import sys
import json
from pathlib import Path
from typing import List, Dict

PLACEHOLDER_RE = re.compile(r"{{\s*([^}]+)\s*}}|\[([^\]]+)\]|\{([^}]+)\}")


def extract_placeholders(text: str) -> List[str]:
    matches = PLACEHOLDER_RE.findall(text)
    slots = []
    for a, b, c in matches:
        v = a or b or c
        v = v.strip()
        if v and v not in slots:
            slots.append(v)
    return slots


def split_templates_from_text(text: str) -> List[Dict]:
    # Normalize spacing
    blocks = re.split(r"\n{2,}", text)
    templates = []
    for blk in blocks:
        s = blk.strip()
        if not s:
            continue
        # find subject
        subject = ""
        name = None
        lines = [l.strip() for l in s.splitlines() if l.strip()]
        if not lines:
            continue
        first = lines[0]
        if first.lower().startswith("template:"):
            name = first.split(":", 1)[1].strip()
            lines = lines[1:]
        # search for a Subject: line
        for i, ln in enumerate(lines[:3]):
            if ln.lower().startswith("subject:"):
                subject = ln.split(":", 1)[1].strip()
                # remove that line
                lines.pop(i)
                break

        body = "\n".join(lines).strip()
        slots = extract_placeholders(body)
        templates.append({
            "id": len(templates) + 1,
            "name": name or (subject or (body[:30] + "...")),
            "subject": subject,
            "body": body,
            "slots": slots,
        })
    return templates


def extract_text_from_pdf(path: Path) -> str:
    try:
        from PyPDF2 import PdfReader
    except Exception as e:
        raise RuntimeError("PyPDF2 is required. Install with: pip install PyPDF2") from e

    reader = PdfReader(str(path))
    parts = []
    for p in reader.pages:
        try:
            txt = p.extract_text() or ""
        except Exception:
            txt = ""
        parts.append(txt)
    return "\n\n".join(parts)


def main(argv: List[str] | None = None) -> int:
    argv = argv or sys.argv[1:]
    if not argv:
        print("Usage: python scripts/ingest_pdf.py path/to/file.pdf [--out out.json]")
        return 1
    path = Path(argv[0])
    out = Path("data/templates_from_pdf.json")
    if "--out" in argv:
        i = argv.index("--out")
        if i + 1 < len(argv):
            out = Path(argv[i + 1])

    if not path.exists():
        print(f"File not found: {path}")
        return 2

    text = extract_text_from_pdf(path)
    templates = split_templates_from_text(text)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(templates, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(templates)} templates to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
