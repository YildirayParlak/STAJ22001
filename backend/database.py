import sqlite3
import os
import hashlib
from datetime import datetime


# ============================================
# VERİTABANI DOSYASININ KONUMU
# ============================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "factory.db")


# ============================================
# VERİTABANI BAĞLANTISI
# ============================================

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ============================================
# ŞİFRE HASHLEME
# ============================================

def hash_password(password: str) -> str:
    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


# ============================================
# VERİTABANINI VE TABLOLARI OLUŞTUR
# ============================================

def init_database():

    # ============================================
    # VERİTABANI BAĞLANTISI
    # ============================================

    conn = get_db_connection()
    cursor = conn.cursor()


    # ============================================
    # USERS TABLOSU
    # ============================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            fullname TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'operator'
        )
    """)


    # ============================================
    # MOTORS TABLOSU
    # ============================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS motors (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            running INTEGER NOT NULL DEFAULT 0,
            rpm INTEGER NOT NULL DEFAULT 0,
            temperature REAL NOT NULL DEFAULT 0,
            power REAL NOT NULL DEFAULT 0,
            load INTEGER NOT NULL DEFAULT 0,
            uptime_seconds REAL NOT NULL DEFAULT 0,
            fault INTEGER NOT NULL DEFAULT 0,
            started_at REAL
        )
    """)


    # ============================================
    # ESKİ VERİTABANI İÇİN STARTED_AT SÜTUNU
    # ============================================

    try:
        cursor.execute("""
            ALTER TABLE motors
            ADD COLUMN started_at REAL
        """)

    except sqlite3.OperationalError:
        # Sütun zaten varsa hiçbir şey yapma
        pass


    # ============================================
    # ALARMS TABLOSU
    # ============================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alarms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_type TEXT NOT NULL,
            source_id INTEGER,
            message TEXT NOT NULL,
            level TEXT NOT NULL DEFAULT 'warning',
            active INTEGER NOT NULL DEFAULT 1,
            acknowledged INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            cleared_at TEXT
        )
    """)

    # ============================================
# SYSTEM LOGS TABLOSU
# ============================================

    # ============================================
    # SYSTEM LOGS TABLOSU
    # ============================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            source_type TEXT,
            source_id INTEGER,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)


    # ============================================
    # PLC SETTINGS TABLOSU
    # ============================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS plc_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),

            operation_mode TEXT NOT NULL DEFAULT 'simulation',

            plc_model TEXT NOT NULL DEFAULT 'fatek_fbs',

            connection_type TEXT NOT NULL DEFAULT 'tcp',

            ip_address TEXT,

            port INTEGER,

            com_port TEXT,

            baud_rate INTEGER,

            parity TEXT,

            stop_bits INTEGER,

            slave_id INTEGER,

            motor1_run TEXT,
            motor1_start TEXT,
            motor1_stop TEXT,
            motor1_fault TEXT,

            motor2_run TEXT,
            motor2_start TEXT,
            motor2_stop TEXT,
            motor2_fault TEXT,

            motor3_run TEXT,
            motor3_start TEXT,
            motor3_stop TEXT,
            motor3_fault TEXT,

            motor4_run TEXT,
            motor4_start TEXT,
            motor4_stop TEXT,
            motor4_fault TEXT,

            updated_at TEXT
        )
    """)


    # ============================================
    # VARSAYILAN PLC AYARLARINI EKLE
    # ============================================

    cursor.execute(
        """
        INSERT OR IGNORE INTO plc_settings
        (
            id,
            operation_mode,
            plc_model,
            connection_type,
            ip_address,
            port,
            com_port,
            baud_rate,
            parity,
            stop_bits,
            slave_id,
            updated_at
        )
        VALUES
        (
            1,
            'simulation',
            'fatek_fbs',
            'tcp',
            '192.168.1.10',
            502,
            'COM3',
            9600,
            'N',
            1,
            1,
            ?
        )
        """,
        (
            datetime.now().isoformat(timespec="seconds"),
        )
    )


    # ============================================
    # KAYDET VE BAĞLANTIYI KAPAT
    # ============================================

    conn.commit()
    conn.close()

    print("SQLite veritabani hazirlandi.")


# ============================================
# VARSAYILAN VERİLERİ EKLE
# ============================================

def seed_database():
    conn = get_db_connection()
    cursor = conn.cursor()

    # ----------------------------------------
    # VARSAYILAN OPERATOR
    # ----------------------------------------

    cursor.execute(
        """
        INSERT OR IGNORE INTO users
        (
            username,
            password_hash,
            fullname,
            role
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            "operator",
            hash_password("op123"),
            "Fabrika Operatörü",
            "operator"
        )
    )

    # ----------------------------------------
    # VARSAYILAN MOTORLAR
    # ----------------------------------------

    motors = [
        (
            1,
            "Konveyör Motor 1",
            1,
            1450,
            68.2,
            18.4,
            82,
            272 * 60,
            0
        ),
        (
            2,
            "Dolum Motor 2",
            1,
            1380,
            55.0,
            15.7,
            71,
            195 * 60,
            0
        ),
        (
            3,
            "Paketleme Motor 3",
            0,
            1420,
            24.0,
            16.8,
            76,
            0,
            1
        ),
        (
            4,
            "Soğutma Motor 4",
            1,
            1500,
            60.5,
            21.2,
            90,
            370 * 60,
            0
        )
    ]

    cursor.executemany(
        """
        INSERT OR IGNORE INTO motors
        (
            id,
            name,
            running,
            rpm,
            temperature,
            power,
            load,
            uptime_seconds,
            fault
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        motors
    )

    conn.commit()
    conn.close()

    print("Varsayilan veriler eklendi.")


# ============================================
# PROGRAM BAŞLANGICI
# ============================================

if __name__ == "__main__":

    init_database()
    seed_database()

    # Veritabanı bağlantısını aç
    conn = get_db_connection()


    # ============================================
    # KULLANICILAR
    # ============================================

    print("\n--- KULLANICILAR ---")

    users = conn.execute(
        """
        SELECT
            id,
            username,
            fullname,
            role
        FROM users
        """
    ).fetchall()

    for user in users:

        print(
            user["id"],
            user["username"],
            user["fullname"],
            user["role"]
        )


    # ============================================
    # MOTORLAR
    # ============================================

    print("\n--- MOTORLAR ---")

    motors = conn.execute(
        """
        SELECT *
        FROM motors
        """
    ).fetchall()

    for motor in motors:

        print(
            motor["id"],
            motor["name"],
            "Running:", motor["running"],
            "Fault:", motor["fault"]
        )


    # ============================================
    # ALARMS
    # ============================================

    print("\n--- ALARMS ---")

    alarms = conn.execute(
        """
        SELECT
            id,
            source_type,
            source_id,
            message,
            level,
            active,
            acknowledged,
            created_at,
            cleared_at
        FROM alarms
        ORDER BY id DESC
        """
    ).fetchall()

    for alarm in alarms:

        print(
            alarm["id"],
            alarm["source_type"],
            alarm["source_id"],
            alarm["message"],
            alarm["level"],
            "Active:", alarm["active"],
            "Acknowledged:", alarm["acknowledged"],
            "Created:", alarm["created_at"],
            "Cleared:", alarm["cleared_at"]
        )


    # ============================================
    # SYSTEM LOGS
    # ============================================

    print("\n--- SYSTEM LOGS ---")

    logs = conn.execute(
        """
        SELECT
            id,
            event_type,
            source_type,
            source_id,
            message,
            created_at
        FROM system_logs
        ORDER BY id DESC
        """
    ).fetchall()

    for log in logs:

        print(
            log["id"],
            log["event_type"],
            log["source_type"],
            log["source_id"],
            log["message"],
            log["created_at"]
        )




    # ============================================
    # BAĞLANTIYI KAPAT
    # ============================================

    conn.close()