import sqlite3
from pathlib import Path

def main():
    db_path = Path(__file__).resolve().parent.parent / 'data' / 'msdos.db'
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute('CREATE TABLE IF NOT EXISTS templates (id INTEGER PRIMARY KEY, name TEXT, text TEXT)')
    name = 'Request for Network Folder Access'
    text = (
        "Dear Team,\n"
        "Please grant access to the network folder for the user below:\n"
        "- Email Address: [Email Address]\n"
        "- Employee ID or External Reference: [ID or Reference]\n"
        "- Folder Path: [\\\\Server\\\\SharedFolder\\\\Subfolder]\n"
        "- Access Level: [Read / Write / Full Control]\n"
        "- Domain Group (if applicable): [Domain Group Name]\n"
        "- Reason for Access: [e.g., Project collaboration, department requirement]\n"
        "- Ticket BR: [Ticket Number]\n"
        "Let me know if you need any additional details to process this request.\n"
        "Thank you for your assistance.\n"
    )
    row = cur.execute('SELECT id FROM templates WHERE name=?', (name,)).fetchone()
    if row:
        cur.execute('UPDATE templates SET text=? WHERE id=?', (text, row[0]))
        print('Updated existing template')
    else:
        cur.execute('INSERT INTO templates (name, text) VALUES (?, ?)', (name, text))
        print('Inserted new template')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()
