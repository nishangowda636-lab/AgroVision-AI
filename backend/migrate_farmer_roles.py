import sqlite3

def migrate_roles():
    conn = sqlite3.connect('backend/agrovision.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, role FROM users')
    users = cursor.fetchall()
    print("Existing users before migration:", users)
    
    cursor.execute("UPDATE users SET role = 'Farmer'")
    conn.commit()
    print("All users updated to Farmer. Total rows affected:", cursor.rowcount)
    
    cursor.execute('SELECT id, email, role FROM users')
    print("Users after migration:", cursor.fetchall())
    conn.close()

if __name__ == '__main__':
    migrate_roles()
