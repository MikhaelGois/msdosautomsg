import sqlite3
import json
from pathlib import Path

db_path = Path(__file__).resolve().parents[1] / 'data' / 'msdos.db'
out = {}
if not db_path.exists():
    out['error'] = 'DB_NOT_FOUND'
    print(json.dumps(out))
    raise SystemExit(0)

conn = sqlite3.connect(str(db_path))
cur = conn.cursor()
cur.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='templates'")
has = cur.fetchone()[0]
if not has:
    out['templates_table'] = False
    print(json.dumps(out))
    raise SystemExit(0)

cur.execute('SELECT count(*) FROM templates')
out['count'] = cur.fetchone()[0]
cur.execute('SELECT id,name FROM templates ORDER BY createdAt DESC LIMIT 5')
out['recent'] = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]
print(json.dumps(out, ensure_ascii=False, indent=2))
