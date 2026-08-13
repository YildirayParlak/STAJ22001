from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import random
import time
from backend.plc.modbus_client import ModbusPLCClient

from datetime import datetime

from backend.database import get_db_connection, hash_password


# ============================================
# FASTAPI UYGULAMASI
# ============================================

app = FastAPI(title="Smart Food Factory API")


# ============================================
# SYSTEM LOG EKLEME FONKSİYONU
# ============================================

def add_system_log(
    event_type: str,
    message: str,
    source_type: str = None,
    source_id: int = None
):

    conn = get_db_connection()

    conn.execute(
        """
        INSERT INTO system_logs
        (
            event_type,
            source_type,
            source_id,
            message,
            created_at
        )
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            event_type,
            source_type,
            source_id,
            message,
            datetime.now().isoformat(timespec="seconds")
        )
    )

    conn.commit()
    conn.close()


# ============================================
# ALARM OLUŞTURMA FONKSİYONU
# ============================================

def create_alarm(
    source_type: str,
    source_id: int,
    message: str,
    level: str = "warning"
):

    conn = get_db_connection()

    # Aynı alarm zaten aktif mi?
    existing_alarm = conn.execute(
        """
        SELECT id
        FROM alarms
        WHERE source_type = ?
          AND source_id = ?
          AND message = ?
          AND active = 1
        """,
        (
            source_type,
            source_id,
            message
        )
    ).fetchone()

    if existing_alarm is not None:
        conn.close()

        return {
            "success": False,
            "message": "Bu alarm zaten aktif."
        }

    cursor = conn.execute(
        """
        INSERT INTO alarms
        (
            source_type,
            source_id,
            message,
            level,
            active,
            acknowledged,
            created_at,
            cleared_at
        )
        VALUES (?, ?, ?, ?, 1, 0, ?, NULL)
        """,
        (
            source_type,
            source_id,
            message,
            level,
            datetime.now().isoformat(timespec="seconds")
        )
    )

    alarm_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return {
        "success": True,
        "alarm_id": alarm_id
    }


# ============================================
# CORS
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# LOGIN MODELİ
# ============================================

class LoginRequest(BaseModel):
    username: str
    password: str


class SettingsRequest(BaseModel):
    operation_mode: str
    plc_model: str
    connection_type: str

    ip_address: str | None = None
    port: int | None = None

    com_port: str | None = None
    baud_rate: int | None = None
    parity: str | None = None
    stop_bits: int | None = None
    slave_id: int | None = None

    motor1_run: str | None = None
    motor1_start: str | None = None
    motor1_stop: str | None = None
    motor1_fault: str | None = None

    motor2_run: str | None = None
    motor2_start: str | None = None
    motor2_stop: str | None = None
    motor2_fault: str | None = None

    motor3_run: str | None = None
    motor3_start: str | None = None
    motor3_stop: str | None = None
    motor3_fault: str | None = None

    motor4_run: str | None = None
    motor4_start: str | None = None
    motor4_stop: str | None = None
    motor4_fault: str | None = None



# ============================================
# MOTOR DURUMLARI
# ============================================






# ============================================
# ANA ENDPOINT
# ============================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "Smart Food Factory API çalışıyor",
        "database": "not_configured"
    }


# ============================================
# LOGIN
# ============================================

@app.post("/auth/login")
def login(login_data: LoginRequest):

    username = login_data.username.strip()
    password = login_data.password

    if not username or not password:
        return {
            "success": False,
            "message": "Kullanıcı adı ve şifre boş bırakılamaz"
        }

    conn = get_db_connection()

    user = conn.execute(
        """
        SELECT id, username, password_hash, fullname, role
        FROM users
        WHERE username = ?
        """,
        (username,)
    ).fetchone()

    conn.close()

    # Kullanıcı yoksa
    if user is None:
        return {
            "success": False,
            "message": "Kullanıcı adı veya şifre yanlış"
        }

    # Girilen şifreyi hashle ve DB'deki hash ile karşılaştır
    if user["password_hash"] != hash_password(password):
        return {
            "success": False,
            "message": "Kullanıcı adı veya şifre yanlış"
        }

    # Giriş başarılı
    return {
        "success": True,
        "message": "Giriş başarılı",
        "token": f"temporary_token_{user['id']}",
        "username": user["username"],
        "fullname": user["fullname"],
        "role": user["role"]
    }


# ============================================
# TEK MOTOR BAŞLAT
# ============================================

@app.post("/motors/{motor_id}/start")
def motor_start(motor_id: int):

    if motor_id < 1 or motor_id > 4:
        return {
            "success": False,
            "message": "Geçersiz motor numarası"
        }

    conn = get_db_connection()

    motor = conn.execute(
        """
        SELECT
            id,
            running,
            fault
        FROM motors
        WHERE id = ?
        """,
        (motor_id,)
    ).fetchone()

    if motor is None:
        conn.close()

        return {
            "success": False,
            "message": "Motor bulunamadı"
        }

    if motor["fault"]:
        conn.close()

        return {
            "success": False,
            "message": (
                f"Motor {motor_id} arızalı. "
                "Önce arıza reset işlemi yapılmalıdır."
            )
        }

    if motor["running"]:
        conn.close()

        return {
            "success": False,
            "message": f"Motor {motor_id} zaten çalışıyor."
        }

    # Motoru başlat ve başlangıç zamanını SQLite'a yaz
    start_time = time.time()

    conn.execute(
        """
        UPDATE motors
        SET
            running = 1,
            started_at = ?
        WHERE id = ?
        """,
        (
            start_time,
            motor_id
        )
    )

    conn.commit()
    conn.close()

    add_system_log(
    event_type="motor_start",
    message=f"Motor {motor_id} başlatıldı",
    source_type="motor",
    source_id=motor_id
)

    return {
        "success": True,
        "message": f"Motor {motor_id} başlatıldı",
        "motor_id": motor_id,
        "running": True,
        "started_at": start_time
    }

@app.post("/motors/{motor_id}/reset")
def motor_fault_reset(motor_id: int):

    # Motor numarası kontrolü
    if motor_id < 1 or motor_id > 4:
        return {
            "success": False,
            "message": "Geçersiz motor numarası"
        }

    conn = get_db_connection()

    # Motoru veritabanından bul
    motor = conn.execute(
        """
        SELECT
            id,
            running,
            fault
        FROM motors
        WHERE id = ?
        """,
        (motor_id,)
    ).fetchone()

    # Motor bulunamadıysa
    if motor is None:
        conn.close()

        return {
            "success": False,
            "message": "Motor bulunamadı"
        }

    # Aktif arıza yoksa
    if not motor["fault"]:
        conn.close()

        return {
            "success": False,
            "message": f"Motor {motor_id} üzerinde aktif arıza bulunmuyor."
        }

    # ============================================
    # MOTORUN ARIZASINI TEMİZLE
    # ============================================

    conn.execute(
        """
        UPDATE motors
        SET
            fault = 0,
            running = 0,
            started_at = NULL
        WHERE id = ?
        """,
        (motor_id,)
    )

    # ============================================
    # MOTORUN AKTİF ALARMLARINI KAPAT
    # ============================================

    conn.execute(
        """
        UPDATE alarms
        SET
            active = 0,
            cleared_at = ?
        WHERE source_type = 'motor'
          AND source_id = ?
          AND active = 1
        """,
        (
            datetime.now().isoformat(timespec="seconds"),
            motor_id
        )
    )

    # ============================================
    # SQLITE DEĞİŞİKLİKLERİNİ KAYDET
    # ============================================

    conn.commit()
    conn.close()

    # ============================================
    # SYSTEM LOG KAYDI
    # ============================================

    add_system_log(
        event_type="fault_reset",
        message=f"Motor {motor_id} arızası resetlendi",
        source_type="motor",
        source_id=motor_id
    )

    return {
        "success": True,
        "message": f"Motor {motor_id} arızası resetlendi.",
        "motor_id": motor_id,
        "fault": False,
        "running": False
    }

@app.post("/motors/{motor_id}/simulate-fault")
def simulate_motor_fault(motor_id: int):

    if motor_id < 1 or motor_id > 4:
        return {
            "success": False,
            "message": "Geçersiz motor numarası"
        }

    conn = get_db_connection()

    motor = conn.execute(
        """
        SELECT id, name, fault
        FROM motors
        WHERE id = ?
        """,
        (motor_id,)
    ).fetchone()

    if motor is None:
        conn.close()

        return {
            "success": False,
            "message": "Motor bulunamadı"
        }

    # Zaten arızalıysa tekrar arıza oluşturma
    if motor["fault"]:
        conn.close()

        return {
            "success": False,
            "message": f"Motor {motor_id} zaten arızalı"
        }

    # Motoru arızalı ve durmuş yap
    conn.execute(
        """
        UPDATE motors
        SET
            fault = 1,
            running = 0,
            started_at = NULL
        WHERE id = ?
        """,
        (motor_id,)
    )

    conn.commit()
    conn.close()

    alarm_message = f"{motor['name']} arızası algılandı"

    # Alarm oluştur
    create_alarm(
        source_type="motor",
        source_id=motor_id,
        message=alarm_message,
        level="critical"
    )

    # Sistem logu oluştur
    add_system_log(
        event_type="motor_fault",
        message=alarm_message,
        source_type="motor",
        source_id=motor_id
    )

    return {
        "success": True,
        "message": alarm_message,
        "motor_id": motor_id,
        "fault": True,
        "running": False
    }



@app.get("/alarms")
def get_alarms():

    conn = get_db_connection()

    rows = conn.execute(
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

    conn.close()

    alarms = []

    for row in rows:
        alarms.append({
            "id": row["id"],
            "source_type": row["source_type"],
            "source_id": row["source_id"],
            "message": row["message"],
            "level": row["level"],
            "active": bool(row["active"]),
            "acknowledged": bool(row["acknowledged"]),
            "created_at": row["created_at"],
            "cleared_at": row["cleared_at"]
        })

    return {
        "success": True,
        "alarms": alarms
    }


@app.post("/alarms/{alarm_id}/acknowledge")
def acknowledge_alarm(alarm_id: int):

    conn = get_db_connection()

    alarm = conn.execute(
        """
        SELECT
            id,
            acknowledged
        FROM alarms
        WHERE id = ?
        """,
        (alarm_id,)
    ).fetchone()

    if alarm is None:
        conn.close()

        return {
            "success": False,
            "message": "Alarm bulunamadı"
        }

    if alarm["acknowledged"]:
        conn.close()

        return {
            "success": False,
            "message": "Bu alarm zaten onaylanmış"
        }

    conn.execute(
        """
        UPDATE alarms
        SET acknowledged = 1
        WHERE id = ?
        """,
        (alarm_id,)
    )

    conn.commit()
    conn.close()

    add_system_log(
        event_type="alarm_acknowledged",
        message=f"Alarm {alarm_id} operatör tarafından onaylandı",
        source_type="alarm",
        source_id=alarm_id
    )

    return {
        "success": True,
        "message": f"Alarm {alarm_id} onaylandı",
        "alarm_id": alarm_id,
        "acknowledged": True
    }


@app.get("/logs")
def get_logs():

    conn = get_db_connection()

    rows = conn.execute(
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

    conn.close()

    logs = []

    for row in rows:

        logs.append({
            "id": row["id"],
            "event_type": row["event_type"],
            "source_type": row["source_type"],
            "source_id": row["source_id"],
            "message": row["message"],
            "created_at": row["created_at"]
        })

    return {
        "success": True,
        "logs": logs
    }



@app.get("/settings")
def get_settings():

    conn = get_db_connection()

    row = conn.execute(
        """
        SELECT *
        FROM plc_settings
        WHERE id = 1
        """
    ).fetchone()

    conn.close()

    if row is None:
        return {
            "success": False,
            "message": "PLC ayarları bulunamadı"
        }

    return {
        "success": True,

        "settings": {
            "operation_mode": row["operation_mode"],
            "plc_model": row["plc_model"],
            "connection_type": row["connection_type"],

            "ip_address": row["ip_address"],
            "port": row["port"],

            "com_port": row["com_port"],
            "baud_rate": row["baud_rate"],
            "parity": row["parity"],
            "stop_bits": row["stop_bits"],
            "slave_id": row["slave_id"],

            "motor1_run": row["motor1_run"],
            "motor1_start": row["motor1_start"],
            "motor1_stop": row["motor1_stop"],
            "motor1_fault": row["motor1_fault"],

            "motor2_run": row["motor2_run"],
            "motor2_start": row["motor2_start"],
            "motor2_stop": row["motor2_stop"],
            "motor2_fault": row["motor2_fault"],

            "motor3_run": row["motor3_run"],
            "motor3_start": row["motor3_start"],
            "motor3_stop": row["motor3_stop"],
            "motor3_fault": row["motor3_fault"],

            "motor4_run": row["motor4_run"],
            "motor4_start": row["motor4_start"],
            "motor4_stop": row["motor4_stop"],
            "motor4_fault": row["motor4_fault"],

            "updated_at": row["updated_at"]
        }
    }

@app.post("/plc/test-connection")
def test_plc_connection():

    plc = ModbusPLCClient()

    result = plc.connect()

    if result["success"]:

        add_system_log(
            event_type="plc_connected",
            message=result["message"],
            source_type="plc",
            source_id=1
        )

    else:

        add_system_log(
            event_type="plc_connection_failed",
            message=result["message"],
            source_type="plc",
            source_id=1
        )

    return result


@app.post("/settings")
def save_settings(settings: SettingsRequest):

    conn = get_db_connection()

    conn.execute(
        """
        UPDATE plc_settings
        SET

            operation_mode = ?,
            plc_model = ?,
            connection_type = ?,

            ip_address = ?,
            port = ?,

            com_port = ?,
            baud_rate = ?,
            parity = ?,
            stop_bits = ?,
            slave_id = ?,

            motor1_run = ?,
            motor1_start = ?,
            motor1_stop = ?,
            motor1_fault = ?,

            motor2_run = ?,
            motor2_start = ?,
            motor2_stop = ?,
            motor2_fault = ?,

            motor3_run = ?,
            motor3_start = ?,
            motor3_stop = ?,
            motor3_fault = ?,

            motor4_run = ?,
            motor4_start = ?,
            motor4_stop = ?,
            motor4_fault = ?,

            updated_at = ?

        WHERE id = 1
        """,
        (

            settings.operation_mode,
            settings.plc_model,
            settings.connection_type,

            settings.ip_address,
            settings.port,

            settings.com_port,
            settings.baud_rate,
            settings.parity,
            settings.stop_bits,
            settings.slave_id,

            settings.motor1_run,
            settings.motor1_start,
            settings.motor1_stop,
            settings.motor1_fault,

            settings.motor2_run,
            settings.motor2_start,
            settings.motor2_stop,
            settings.motor2_fault,

            settings.motor3_run,
            settings.motor3_start,
            settings.motor3_stop,
            settings.motor3_fault,

            settings.motor4_run,
            settings.motor4_start,
            settings.motor4_stop,
            settings.motor4_fault,

            datetime.now().isoformat(timespec="seconds")
        )
    )

    conn.commit()
    conn.close()

    add_system_log(
        event_type="settings_saved",
        message="PLC ayarları güncellendi",
        source_type="system",
        source_id=1
    )

    return {
        "success": True,
        "message": "PLC ayarları başarıyla kaydedildi."
    }

# ============================================
# TEK MOTOR DURDUR
# ============================================

@app.post("/motors/{motor_id}/stop")
def motor_stop(motor_id: int):

    # Motor numarası kontrolü
    if motor_id < 1 or motor_id > 4:
        return {
            "success": False,
            "message": "Geçersiz motor numarası"
        }

    # SQLite bağlantısı
    conn = get_db_connection()

    # Motorun mevcut bilgilerini veritabanından al
    motor = conn.execute(
        """
        SELECT
            id,
            running,
            started_at,
            uptime_seconds
        FROM motors
        WHERE id = ?
        """,
        (motor_id,)
    ).fetchone()

    # Motor bulunamadıysa
    if motor is None:
        conn.close()

        return {
            "success": False,
            "message": "Motor bulunamadı"
        }

    # Motor zaten durmuşsa
    if not motor["running"]:
        conn.close()

        return {
            "success": False,
            "message": f"Motor {motor_id} zaten durmuş."
        }

    # ============================================
    # ÇALIŞMA SÜRESİNİ HESAPLA
    # ============================================

    elapsed_seconds = 0

    if motor["started_at"] is not None:
        elapsed_seconds = time.time() - motor["started_at"]

    # Önceki toplam süre + bu çalışmadaki süre
    new_uptime = motor["uptime_seconds"] + elapsed_seconds

    # ============================================
    # MOTORU DURDUR VE SQLITE'A KAYDET
    # ============================================

    conn.execute(
        """
        UPDATE motors
        SET
            running = 0,
            uptime_seconds = ?,
            started_at = NULL
        WHERE id = ?
        """,
        (
            new_uptime,
            motor_id
        )
    )

    # Değişiklikleri kaydet
    conn.commit()

    # Veritabanı bağlantısını kapat
    conn.close()

    add_system_log(
    event_type="motor_stop",
    message=f"Motor {motor_id} durduruldu",
    source_type="motor",
    source_id=motor_id
)

    return {
        "success": True,
        "message": f"Motor {motor_id} durduruldu",
        "motor_id": motor_id,
        "running": False
    }


# ============================================
# TÜM MOTOR DURUMLARI
# ============================================

@app.get("/motors/status")
def motors_status():

    # SQLite bağlantısını aç
    conn = get_db_connection()

    # Motorların tüm bilgilerini veritabanından al
    rows = conn.execute(
        """
        SELECT
            id,
            name,
            running,
            rpm,
            temperature,
            power,
            load,
            uptime_seconds,
            fault,
            started_at
        FROM motors
        ORDER BY id
        """
    ).fetchall()

    # Veritabanı bağlantısını kapat
    conn.close()

    motors = {}

    # Her motoru tek tek işle
    for row in rows:

        motor_key = f"motor{row['id']}"

        # ============================================
        # CANLI ÇALIŞMA SÜRESİNİ HESAPLA
        # ============================================

        # Daha önce kaydedilmiş toplam çalışma süresi
        current_uptime = row["uptime_seconds"]

        # Motor şu anda çalışıyorsa,
        # son başlatılma anından bugüne kadar geçen
        # süreyi de toplam süreye geçici olarak ekle.
        if row["running"] and row["started_at"] is not None:
            current_uptime += time.time() - row["started_at"]

        # ============================================
        # MOTOR VERİLERİNİ FRONTEND İÇİN HAZIRLA
        # ============================================

        motors[motor_key] = {
            "id": row["id"],

            "name": row["name"],

            "running": bool(row["running"]),

            # Motor durmuşsa RPM 0 göster
            "rpm": (
                row["rpm"]
                if row["running"]
                else 0
            ),

            "temperature": row["temperature"],

            # Motor durmuşsa güç 0 göster
            "power": (
                row["power"]
                if row["running"]
                else 0
            ),

            # Motor durmuşsa yük 0 göster
            "load": (
                row["load"]
                if row["running"]
                else 0
            ),

            # motors.js dakika cinsinden veri bekliyor
            "uptime_minutes": current_uptime / 60,

            "fault": bool(row["fault"])
        }

    # Frontend'e gönderilecek cevap
    return {
        "success": True,
        "motors": motors
    }


# ============================================
# DASHBOARD İÇİN ESKİ STATUS ENDPOINTİ
# Şimdilik dashboard.js bunu da kullanıyor.
# ============================================

@app.get("/status")
def status():
    return motor_status


# ============================================
# DASHBOARD GENEL DURUM
# ============================================

# ============================================
# DASHBOARD GENEL DURUM
# ============================================

@app.get("/dashboard/status")
def dashboard_status():

    conn = get_db_connection()

    active_motor_count = conn.execute(
        """
        SELECT COUNT(*)
        FROM motors
        WHERE running = 1
        """
    ).fetchone()[0]

    total_motor_count = conn.execute(
        """
        SELECT COUNT(*)
        FROM motors
        """
    ).fetchone()[0]

    alarm_count = conn.execute(
        """
        SELECT COUNT(*)
        FROM alarms
        WHERE active = 1
        """
    ).fetchone()[0]

    conn.close()

    return {
        "temperature": round(random.uniform(70, 78), 1),
        "pressure": round(random.uniform(5.8, 6.5), 1),
        "humidity": round(random.uniform(58, 65), 1),
        "cold_storage": round(random.uniform(-20, -17), 1),
        "production": random.randint(1200, 1300),
        "energy": round(random.uniform(52, 58), 1),

        "active_motors": active_motor_count,
        "total_motors": total_motor_count,

        "alarm_count": alarm_count
    }

