import sqlite3
import json

conn = sqlite3.connect('dev.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cur.fetchall()
print("Tables:", [t[0] for t in tables])

counts = {}
for t in tables:
    name = t[0]
    if not name.startswith('sqlite_') and not name.startswith('_'):
        try:
            cnt = cur.execute(f'SELECT count(*) FROM "{name}"').fetchone()[0]
            counts[name] = cnt
        except Exception as e:
            counts[name] = str(e)

print(json.dumps(counts, indent=2))
