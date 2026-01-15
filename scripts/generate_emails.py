#!/usr/bin/env python3
"""
Generate emails from templates stored in the sqlite DB by recognizing volatile fields
(lines containing ':') and applying provided input values.

Usage:
  python scripts/generate_emails.py --all --sample
  python scripts/generate_emails.py --id 102 --inputs inputs.json
  python scripts/generate_emails.py --all --inputs inputs.json --outdir generated

If --inputs is omitted and --sample is not passed, values default to 'mutavel'.
"""
import argparse
import json
import os
import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / 'data' / 'msdos.db'


def normalize_key(s: str) -> str:
    return re.sub(r'[^a-z0-9_]', '', re.sub(r'\s+', '_', s.strip().lower()))


def extract_fields_from_text(text: str):
    fields = []
    for ln in text.splitlines():
        cleaned = re.sub(r'^\s*[-•\*\u2022\t\s]+', '', ln).strip()
        if not cleaned:
            continue
        if ':' in cleaned:
            left = cleaned.split(':', 1)[0].strip()
            if left:
                fields.append({'label': left, 'key': normalize_key(left)})
        # also capture bracketed placeholders like [email]
        for m in re.findall(r'\[([^\]]+)\]', ln):
            k = normalize_key(m)
            if not any(f['key'] == k for f in fields):
                fields.append({'label': m, 'key': k})
    return fields


def generate_text_from_template(base: str, inputs: dict):
    out_lines = []
    for ln in base.splitlines():
        if ':' in ln:
            left, right = ln.split(':', 1)
            left_s = left.strip()
            key = normalize_key(left_s)
            val = inputs.get(key)
            if val is None:
                # if right contains [placeholder], try to replace bracketed token
                br = re.findall(r'\[([^\]]+)\]', right)
                if br:
                    k2 = normalize_key(br[0])
                    val = inputs.get(k2, '')
                else:
                    val = ''
            # preserve leading bullet characters on the original line
            m = re.match(r'^(\s*[-•\*\u2022\t\s]*)', ln)
            bullet = m.group(1) if m else ''
            out_lines.append(f"{bullet}{left_s}: {val}")
        else:
            # replace any bracketed placeholders within the line
            s = ln
            for ph in re.findall(r'\[([^\]]+)\]', ln):
                v = inputs.get(normalize_key(ph), '')
                s = s.replace(f'[{ph}]', v)
            out_lines.append(s)
    return '\n'.join(out_lines)


def guess_example_value(label: str):
    l = label.lower()
    if 'email' in l:
        return 'tester@example.com'
    if 'name' in l or 'nome' in l:
        return 'John Doe'
    if 'ticket' in l or 'br' in l:
        return 'BR-12345'
    if 'date' in l or 'expiration' in l or 'expir' in l:
        return '2026-12-31'
    if 'employee' in l or 'id' in l or 'reference' in l:
        return 'EMP-12345'
    return 'mutavel'


def load_templates(dbpath: Path, ids=None):
    conn = sqlite3.connect(str(dbpath))
    cur = conn.cursor()
    if ids:
        placeholders = ','.join('?' for _ in ids)
        cur.execute(f'SELECT id,name,text FROM templates WHERE id IN ({placeholders})', ids)
    else:
        cur.execute('SELECT id,name,text FROM templates ORDER BY createdAt DESC')
    rows = cur.fetchall()
    conn.close()
    return [{'id': r[0], 'name': r[1], 'text': r[2]} for r in rows]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--id', type=int, help='Template id to process (optional)')
    p.add_argument('--all', action='store_true', help='Process all templates')
    p.add_argument('--inputs', help='JSON file with input values (keyed by normalized keys)')
    p.add_argument('--sample', action='store_true', help='Use example/sample values for inputs')
    p.add_argument('--outdir', help='Directory to write generated outputs (optional)')
    args = p.parse_args()

    if not args.all and not args.id:
        print('Specify --all or --id')
        return

    if not DB_PATH.exists():
        print('DB not found at', DB_PATH)
        return

    inputs = {}
    if args.inputs:
        with open(args.inputs, 'r', encoding='utf8') as fh:
            inputs = json.load(fh)
            # normalize keys
            inputs = {normalize_key(k): v for k, v in inputs.items()}

    templates = load_templates(DB_PATH, ids=[args.id] if args.id else None)
    outdir = Path(args.outdir) if args.outdir else None
    if outdir:
        outdir.mkdir(parents=True, exist_ok=True)

    for tpl in templates:
        fields = extract_fields_from_text(tpl['text'])
        # build input values for this template
        vals = {}
        for f in fields:
            k = f['key']
            if k in inputs:
                vals[k] = inputs[k]
            elif args.sample:
                vals[k] = guess_example_value(f['label'])
            else:
                vals[k] = inputs.get(k, 'mutavel')
        generated = generate_text_from_template(tpl['text'], vals)
        header = f"--- Template {tpl['id']} - {tpl['name']} ---"
        print(header)
        print(generated)
        print('\n')
        if outdir:
            fn = outdir / f"template_{tpl['id']}.txt"
            with open(fn, 'w', encoding='utf8') as fh:
                fh.write(generated)


if __name__ == '__main__':
    main()
