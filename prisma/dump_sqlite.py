import sqlite3
import json

conn = sqlite3.connect('dev.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [t[0] for t in cur.fetchall() if not t[0].startswith('sqlite_') and not t[0].startswith('_')]

dump = {}
for t in tables:
    cur.execute(f'SELECT * FROM "{t}"')
    rows = [dict(r) for r in cur.fetchall()]
    dump[t] = rows

with open('prisma/dev_db_dump.json', 'w', encoding='utf-8') as f:
    json.dump(dump, f, indent=2, default=str)

print("Dumped tables:", {t: len(dump[t]) for t in dump})
