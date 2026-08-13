// ============================================
//   SMART FOOD FACTORY — DASHBOARD.JS
// ============================================

const API = "http://127.0.0.1:8000";

// ============================================
// 1. OTURUM KONTROLÜ
// ============================================
function checkSession() {
    const token =
        sessionStorage.getItem("token") ||
        localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// ============================================
// 2. OPERATÖR BİLGİSİNİ GÖSTER
// ============================================
function loadOperatorInfo() {
    const fullname =
        sessionStorage.getItem("fullname") ||
        localStorage.getItem("fullname") ||
        "Fabrika Operatörü";

    const opName   = document.getElementById("opName");
    const opAvatar = document.getElementById("opAvatar");

    if (opName) {
        opName.textContent = fullname;
    }

    if (opAvatar) {
        const initials = fullname
            .split(" ")
            .filter(Boolean)
            .map(word => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();

        opAvatar.textContent = initials || "OP";
    }
}

// ============================================
// 3. SAAT
// ============================================
function updateClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;
    clock.textContent = new Date().toLocaleTimeString("tr-TR");
}

setInterval(updateClock, 1000);
updateClock();

// ============================================
// 4. MİNİ MOTOR GRAFİĞİ
// ============================================
function buildMiniChart() {
    const chart = document.getElementById("motorChart");
    if (!chart) return;

    const values = [40, 55, 60, 70, 75, 72, 80, 78];
    const colors = [
        "#1d4ed8", "#1d4ed8",
        "#2563eb", "#2563eb",
        "#3b82f6", "#3b82f6",
        "#60a5fa", "#60a5fa"
    ];

    chart.innerHTML = values
        .map((value, index) => `
            <div class="mini-bar" style="height:${value}%;background:${colors[index]};"></div>
        `)
        .join("");
}

// ============================================
// 5. BACKEND DURUM KONTROLÜ
// ============================================
async function checkBackendStatus() {
    const plcStatus = document.getElementById("plcStatus");

    try {
        const response = await fetch(`${API}/`);

        if (!response.ok) {
            throw new Error("Backend yanıt vermedi.");
        }

        const data = await response.json();

        if (plcStatus) {
            plcStatus.textContent = "● Simülasyon Sistemi Aktif";
            plcStatus.className   = "status-badge ok";
        }

        console.log("Backend aktif:", data);
        return true;

    } catch (error) {
        if (plcStatus) {
            plcStatus.textContent = "● Backend Bağlantısı Yok";
            plcStatus.className   = "status-badge alarm";
        }

        console.error("Backend bağlantı hatası:", error);
        return false;
    }
}

// ============================================
// 6. MOTOR DURUMUNU BACKEND'DEN AL
// ============================================
async function fetchMotorStatus() {
    try {
        const response = await fetch(`${API}/status`);

        if (!response.ok) {
            throw new Error("Motor durumu alınamadı.");
        }

        const data = await response.json();
        updateMotorStatus(data);

    } catch (error) {
        console.error("Motor status hatası:", error);
    }
}

// ============================================
// 7. MOTOR DURUMUNU DASHBOARD'A YAZ
// ============================================
function updateMotorStatus(data) {
    if (data.motor1 === undefined) return;

    const motorSub = document.getElementById("motorSub");

    if (data.motor1 === true) {
        if (motorSub) {
            motorSub.textContent = "Motor 1 çalışıyor";
        }
    } else {
        if (motorSub) {
            motorSub.textContent = "Motor 1 durdu";
        }
    }
}

// ============================================
// 8. DASHBOARD VERİSİNİ BACKEND'DEN AL
// ============================================
async function fetchDashboardData() {
    try {
        const response = await fetch(`${API}/dashboard/status`);

        if (!response.ok) {
            throw new Error("Dashboard verileri alınamadı.");
        }

        const data = await response.json();
        updateDashboardData(data);

    } catch (error) {
        console.error("Dashboard veri hatası:", error);
    }
}

// ============================================
// 9. GELEN VERİYİ HTML'E YAZ
// ============================================
function updateDashboardData(data) {

    // Sıcaklık
    const maxTemp    = document.getElementById("maxTemp");
    const sensorTemp = document.getElementById("sTemp");

    if (maxTemp)    maxTemp.textContent    = data.temperature.toFixed(1) + "°C";
    if (sensorTemp) {
        sensorTemp.textContent = data.temperature.toFixed(1) + "°C";
        sensorTemp.className   =
            data.temperature >= 85 ? "sensor-value alarm" :
            data.temperature >= 70 ? "sensor-value warn"  :
                                     "sensor-value ok";
    }

    // Basınç
    const pressure       = document.getElementById("pressure");
    const sensorPressure = document.getElementById("sPress");

    if (pressure)       pressure.textContent       = data.pressure.toFixed(1) + " bar";
    if (sensorPressure) sensorPressure.textContent = data.pressure.toFixed(1) + " bar";

    // Nem
    const avgHumidity   = document.getElementById("avgHumidity");
    const sensorHumidity = document.getElementById("sHum");

    if (avgHumidity)    avgHumidity.textContent    = data.humidity.toFixed(1) + "%";
    if (sensorHumidity) sensorHumidity.textContent = data.humidity.toFixed(1) + "%";

    // Soğuk hava deposu
    const coldStorage = document.getElementById("coldStorage");
    const sensorCold  = document.getElementById("sCold");

    if (coldStorage) coldStorage.textContent = data.cold_storage.toFixed(1) + "°C";
    if (sensorCold)  sensorCold.textContent  = data.cold_storage.toFixed(1) + "°C";

    // Üretim
    const production = document.getElementById("production");
    if (production) production.textContent = data.production.toLocaleString("tr-TR");

    // Enerji
    const totalEnergy = document.getElementById("totalEnergy");
    if (totalEnergy) totalEnergy.textContent = data.energy.toFixed(1) + " kW";

    // Aktif motor
    const activeMotors = document.getElementById("activeMotors");
    if (activeMotors) activeMotors.textContent = `${data.active_motors} / ${data.total_motors}`;

    // Alarm
    const alarmCount = document.getElementById("alarmCount");
    const alarmBadge = document.getElementById("alarmBadge");

    if (alarmCount) alarmCount.textContent = data.alarm_count;
    if (alarmBadge) alarmBadge.textContent = `🚨 ${data.alarm_count} Alarm`;

    // Son güncelleme
    updateLastUpdate();
}

// ============================================
// 10. SON GÜNCELLEME BİLGİSİ
// ============================================
function updateLastUpdate() {
    const lastUpdate = document.getElementById("lastUpdate");
    if (!lastUpdate) return;
    lastUpdate.textContent = new Date().toLocaleTimeString("tr-TR");
}

// ============================================
// 11. SAYFA BAŞLATMA
// ============================================
async function initializeDashboard() {
    if (!checkSession()) return;

    loadOperatorInfo();
    buildMiniChart();

    await checkBackendStatus();
    await fetchMotorStatus();
    await fetchDashboardData();

    updateLastUpdate();
}

// ============================================
// 12. PERİYODİK GÜNCELLEME
// ============================================

// Motor bilgisini her 5 saniyede al
setInterval(function () {
    fetchMotorStatus();
}, 5000);

// Dashboard verisini her 3 saniyede al
setInterval(function () {
    fetchDashboardData();
}, 3000);

// İlk açılış
initializeDashboard();