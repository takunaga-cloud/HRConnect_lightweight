import psycopg2
import uuid

def seed():
    conn_str = "postgresql://postgres.shonqzbsrzoivbscaghl:koorinosyo19910328Nt-@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
    print("Connecting to Supabase using sync psycopg2...")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # テンプレートデータ
    templates_to_create = [
        {"name": "A直", "start_time": "09:00:00", "end_time": "18:00:00", "break_minutes": 60},
        {"name": "2直", "start_time": "13:00:00", "end_time": "22:00:00", "break_minutes": 60},
        {"name": "時差", "start_time": "10:00:00", "end_time": "19:00:00", "break_minutes": 60},
        {"name": "午前出張", "start_time": "09:00:00", "end_time": "18:00:00", "break_minutes": 60},
        {"name": "午後出張", "start_time": "09:00:00", "end_time": "18:00:00", "break_minutes": 60},
        {"name": "終日出張", "start_time": "09:00:00", "end_time": "18:00:00", "break_minutes": 60},
        {"name": "社内関連", "start_time": "09:00:00", "end_time": "18:00:00", "break_minutes": 60},
        {"name": "明休", "start_time": "00:00:00", "end_time": "00:00:00", "break_minutes": 0},
    ]
    
    for t in templates_to_create:
        cur.execute("SELECT id FROM shift_templates WHERE name = %s", (t["name"],))
        res = cur.fetchone()
        if not res:
            print(f"Inserting {t['name']}...")
            new_id = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO shift_templates (id, name, start_time, end_time, break_minutes) VALUES (%s, %s, %s, %s, %s)",
                (new_id, t["name"], t["start_time"], t["end_time"], t["break_minutes"])
            )
        else:
            print(f"Skipping {t['name']} (already exists)")
            
    conn.commit()
    cur.close()
    conn.close()
    print("Sync seeding completed successfully!")

if __name__ == "__main__":
    seed()
