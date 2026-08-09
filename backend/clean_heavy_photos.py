import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'erp_crm.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check table existence
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance';")
    if cursor.fetchone():
        # Clean old check_in_photo_url if string is huge (>150,000 chars)
        cursor.execute("SELECT id, LENGTH(check_in_photo_url) FROM attendance WHERE check_in_photo_url IS NOT NULL;")
        rows = cursor.fetchall()
        print(f"Total attendance records: {len(rows)}")
        cleaned = 0
        for r_id, length in rows:
            if length and length > 150000:
                # Replace with placeholder or null to free space
                cursor.execute("UPDATE attendance SET check_in_photo_url = NULL WHERE id = ?", (r_id,))
                cleaned += 1
        
        cursor.execute("SELECT id, LENGTH(check_out_photo_url) FROM attendance WHERE check_out_photo_url IS NOT NULL;")
        out_rows = cursor.fetchall()
        for r_id, length in out_rows:
            if length and length > 150000:
                cursor.execute("UPDATE attendance SET check_out_photo_url = NULL WHERE id = ?", (r_id,))
                cleaned += 1

        conn.commit()
        cursor.execute("VACUUM;")
        print(f"Cleaned {cleaned} heavy photo records and VACUUM completed.")
    conn.close()
