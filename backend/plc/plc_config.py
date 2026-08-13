"""
PLC Configuration Manager

SQLite veritabanındaki PLC ayarlarını okur.
"""

from backend.database import get_db_connection


def load_plc_settings():

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
        return None

    return dict(row)