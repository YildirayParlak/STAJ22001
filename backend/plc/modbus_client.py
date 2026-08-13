"""
Smart Food Factory - Modbus PLC Client

SQLite veritabanındaki PLC ayarlarını kullanarak
Modbus TCP veya Modbus RTU bağlantısını yönetir.
"""

from typing import Any

from pymodbus.client import ModbusSerialClient, ModbusTcpClient

from backend.plc.plc_config import load_plc_settings


class ModbusPLCClient:
    """Modbus TCP/RTU bağlantısını yöneten istemci sınıfı."""

    def __init__(self) -> None:
        self.settings: dict[str, Any] = {}
        self.client: ModbusTcpClient | ModbusSerialClient | None = None
        self.connected: bool = False
        self.reload_settings()

    def reload_settings(self) -> dict[str, Any]:
        loaded_settings = load_plc_settings()
        self.settings = loaded_settings if loaded_settings else {}
        return self.settings

    def get_operation_mode(self) -> str:
        return str(
            self.settings.get("operation_mode", "simulation")
        ).lower()

    def is_plc_mode(self) -> bool:
        return self.get_operation_mode() == "plc"

    def get_connection_type(self) -> str:
        return str(
            self.settings.get("connection_type", "tcp")
        ).lower()

    def connect(self) -> dict[str, Any]:
        self.reload_settings()

        if not self.is_plc_mode():
            return {
                "success": False,
                "message": (
                    "Sistem Simulation Mode durumunda. "
                    "PLC bağlantısı kullanılmıyor."
                ),
            }

        connection_type = self.get_connection_type()

        if connection_type == "tcp":
            return self.connect_tcp()

        if connection_type == "rtu":
            return self.connect_rtu()

        return {
            "success": False,
            "message": "Geçersiz PLC bağlantı türü.",
        }

    def connect_tcp(self) -> dict[str, Any]:
        ip_address = str(
            self.settings.get("ip_address") or ""
        ).strip()

        port = int(
            self.settings.get("port") or 502
        )

        if not ip_address:
            return {
                "success": False,
                "message": "PLC IP adresi tanımlanmamış.",
            }

        self.disconnect()

        try:
            self.client = ModbusTcpClient(
                host=ip_address,
                port=port,
                timeout=3,
            )

            self.connected = bool(
                self.client.connect()
            )

            if not self.connected:
                self.disconnect()

                return {
                    "success": False,
                    "message": (
                        "Modbus TCP bağlantısı kurulamadı: "
                        f"{ip_address}:{port}"
                    ),
                }

            return {
                "success": True,
                "message": (
                    "Modbus TCP bağlantısı başarılı: "
                    f"{ip_address}:{port}"
                ),
                "connection_type": "tcp",
                "target": f"{ip_address}:{port}",
            }

        except Exception as error:
            self.disconnect()

            return {
                "success": False,
                "message": (
                    "Modbus TCP bağlantı hatası: "
                    f"{error}"
                ),
            }

    def connect_rtu(self) -> dict[str, Any]:
        com_port = str(
            self.settings.get("com_port") or ""
        ).strip()

        baud_rate = int(
            self.settings.get("baud_rate") or 9600
        )

        parity = str(
            self.settings.get("parity") or "N"
        ).upper()

        stop_bits = int(
            self.settings.get("stop_bits") or 1
        )

        if not com_port:
            return {
                "success": False,
                "message": "COM port tanımlanmamış.",
            }

        if parity not in {"N", "E", "O"}:
            return {
                "success": False,
                "message": "Parity değeri N, E veya O olmalıdır.",
            }

        self.disconnect()

        try:
            self.client = ModbusSerialClient(
                port=com_port,
                baudrate=baud_rate,
                parity=parity,
                stopbits=stop_bits,
                bytesize=8,
                timeout=3,
            )

            self.connected = bool(
                self.client.connect()
            )

            if not self.connected:
                self.disconnect()

                return {
                    "success": False,
                    "message": (
                        "Modbus RTU bağlantısı kurulamadı: "
                        f"{com_port} / {baud_rate}"
                    ),
                }

            return {
                "success": True,
                "message": (
                    "Modbus RTU bağlantısı başarılı: "
                    f"{com_port} / {baud_rate}"
                ),
                "connection_type": "rtu",
                "target": f"{com_port} / {baud_rate}",
            }

        except Exception as error:
            self.disconnect()

            return {
                "success": False,
                "message": (
                    "Modbus RTU bağlantı hatası: "
                    f"{error}"
                ),
            }

    def disconnect(self) -> dict[str, Any]:
        if self.client is not None:
            try:
                self.client.close()
            except Exception:
                pass

        self.client = None
        self.connected = False

        return {
            "success": True,
            "message": "PLC bağlantısı kapatıldı.",
        }

    def is_connected(self) -> bool:
        return bool(
            self.client is not None and self.connected
        )