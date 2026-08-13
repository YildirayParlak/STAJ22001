// ============================================
// SMART FOOD FACTORY — MOTORS.JS
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
// 2. OPERATÖR BİLGİSİ
// ============================================

function loadOperatorInfo() {
    const fullname =
        sessionStorage.getItem("fullname") ||
        localStorage.getItem("fullname") ||
        "Fabrika Operatörü";

    const opName = document.getElementById("opName");
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

    clock.textContent =
        new Date().toLocaleTimeString("tr-TR");
}

setInterval(updateClock, 1000);
updateClock();


// ============================================
// 4. BACKEND DURUM KONTROLÜ
// ============================================

async function checkBackendStatus() {
    const plcStatus =
        document.getElementById("plcStatus");

    try {
        const response =
            await fetch(`${API}/`);

        if (!response.ok) {
            throw new Error("Backend yanıt vermedi.");
        }

        if (plcStatus) {
            plcStatus.textContent =
                "● PLC Simülasyonu Aktif";

            plcStatus.className =
                "status-badge ok";
        }

        return true;

    } catch (error) {
        if (plcStatus) {
            plcStatus.textContent =
                "● Backend Bağlantısı Yok";

            plcStatus.className =
                "status-badge alarm";
        }

        console.error(
            "Backend bağlantı hatası:",
            error
        );

        return false;
    }
}


// ============================================
// 5. TÜM MOTOR DURUMLARINI AL
// ============================================

async function fetchMotorStatus() {
    try {
        const response =
            await fetch(`${API}/motors/status`);

        if (!response.ok) {
            throw new Error(
                "Motor durumları alınamadı."
            );
        }

        const data =
            await response.json();

        updateAllMotors(data.motors);

    } catch (error) {
        console.error(
            "Motor durum hatası:",
            error
        );
    }
}


// ============================================
// 6. TÜM MOTORLARI GÜNCELLE
// ============================================

function updateAllMotors(motors) {

    let runningCount = 0;
    let faultCount = 0;

    for (let motorId = 1; motorId <= 4; motorId++) {

        const motor = motors[`motor${motorId}`];

        if (!motor) continue;

        updateMotorCard(motorId, motor);

        if (motor.running) {
            runningCount++;
        }

        if (motor.fault) {
            faultCount++;
        }
    }

    updateSummary(runningCount, faultCount);
}


// ============================================
// 7. TEK MOTOR KARTINI GÜNCELLE
// ============================================

function updateMotorCard(motorId, motor) {

    const card = document.getElementById(`motorCard${motorId}`);
    const status = document.getElementById(`status${motorId}`);
    const rpm = document.getElementById(`rpm${motorId}`);
    const temp = document.getElementById(`temp${motorId}`);
    const power = document.getElementById(`power${motorId}`);
    const uptime = document.getElementById(`uptime${motorId}`);
    const fault = document.getElementById(`fault${motorId}`);
    const load = document.getElementById(`load${motorId}`);
    const loadPct = document.getElementById(`loadPct${motorId}`);
    const resetBtn = document.getElementById(`resetBtn${motorId}`);

    if (!card || !status) return;


    // ============================
    // MOTOR KART DURUMU
    // ============================

    card.classList.remove(
        "running",
        "stopped",
        "fault"
    );


    // Arızalı
    if (motor.fault) {

        card.classList.add("fault");

        status.className =
            "motor-card-status fault";

        status.textContent =
            "⚠ Arızalı";
    }

    // Çalışıyor
    else if (motor.running) {

        card.classList.add("running");

        status.className =
            "motor-card-status running";

        status.textContent =
            "● Çalışıyor";
    }

    // Durdu
    else {

        card.classList.add("stopped");

        status.className =
            "motor-card-status stopped";

        status.textContent =
            "● Durdu";
    }


    // ============================
    // RPM
    // ============================

    if (rpm) {
        rpm.textContent =
            motor.rpm.toLocaleString("tr-TR");
    }


    // ============================
    // SICAKLIK
    // ============================

    if (temp) {

        temp.textContent =
            motor.temperature.toFixed(1) + " °C";

        if (motor.temperature >= 85) {

            temp.className =
                "motor-info-value alarm";

        } else if (motor.temperature >= 65) {

            temp.className =
                "motor-info-value warn";

        } else {

            temp.className =
                "motor-info-value ok";
        }
    }


    // ============================
    // GÜÇ
    // ============================

    if (power) {

        power.textContent =
            motor.power.toFixed(1) + " kW";
    }


    // ============================
    // ÇALIŞMA SÜRESİ
    // ============================

    if (uptime) {

        uptime.textContent =
            formatUptime(
                motor.uptime_minutes
            );
    }


    // ============================
    // ARIZA
    // ============================

    if (fault) {

        if (motor.fault) {

            fault.textContent =
                "⚠ Arıza";

            fault.className =
                "motor-info-value alarm";

        } else {

            fault.textContent =
                "Normal";

            fault.className =
                "motor-info-value ok";
        }
    }


    // ============================
    // MOTOR YÜKÜ
    // ============================

    if (load) {

        load.style.width =
            motor.load + "%";

        load.className =
            "motor-load-fill " +
            getLoadClass(motor.load);
    }


    if (loadPct) {

        loadPct.textContent =
            "%" + motor.load;
    }
    // ============================
// ARIZA RESET BUTONU
// ============================

if (resetBtn) {

    if (motor.fault) {
        // Motor arızalıysa göster
        resetBtn.style.display = "flex";
    } else {
        // Arıza yoksa gizle
        resetBtn.style.display = "none";
    }
}
}

function formatUptime(totalMinutes) {

    const total = Math.floor(totalMinutes);

    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    return `${hours} sa ${minutes} dk`;
}


// ============================================
// 8. MOTOR BAŞLAT
// ============================================

async function motorStart(motorId) {

    try {
        const response =
            await fetch(
                `${API}/motors/${motorId}/start`,
                {
                    method: "POST"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Motor başlatılamadı."
            );
        }

        const data =
            await response.json();

        if (!data.success) {
            console.error(
                data.message
            );

            return;
        }

        console.log(
            data.message
        );

        // Güncel durumları tekrar al
        await fetchMotorStatus();

    } catch (error) {
        console.error(
            "Motor başlatma hatası:",
            error
        );

        alert(
            "Motor başlatılamadı. Backend bağlantısını kontrol et."
        );
    }
}


// ============================================
// 9. MOTOR DURDUR
// ============================================

async function motorStop(motorId) {

    try {
        const response =
            await fetch(
                `${API}/motors/${motorId}/stop`,
                {
                    method: "POST"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Motor durdurulamadı."
            );
        }

        const data =
            await response.json();

        if (!data.success) {
            console.error(
                data.message
            );

            return;
        }

        console.log(
            data.message
        );

        // Güncel durumları tekrar al
        await fetchMotorStatus();

    } catch (error) {
        console.error(
            "Motor durdurma hatası:",
            error
        );

        alert(
            "Motor durdurulamadı. Backend bağlantısını kontrol et."
        );
    }
}

// ============================================
// MOTOR ARIZA RESET
// ============================================

async function motorReset(motorId) {

    try {

        const response = await fetch(
            `${API}/motors/${motorId}/reset`,
            {
                method: "POST"
            }
        );

        if (!response.ok) {
            throw new Error("Arıza reset işlemi başarısız.");
        }

        const data = await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        console.log(data.message);

        // Backend'den motorların güncel durumunu tekrar al
        await fetchMotorStatus();

        alert(
            `Motor ${motorId} arızası başarıyla resetlendi. ` +
            `Motoru çalıştırmak için Başlat butonuna basabilirsiniz.`
        );

    } catch (error) {

        console.error(
            "Arıza reset hatası:",
            error
        );

        alert(
            "Arıza reset işlemi yapılamadı. Backend bağlantısını kontrol edin."
        );
    }
}


// ============================================
// 10. ÖZET KPI'LARI GÜNCELLE
// ============================================

function updateSummary(runningCount, faultCount) {

    const runningCountEl =
        document.getElementById("runningCount");

    const totalRpmEl =
        document.getElementById("totalRpm");

    const totalPowerEl =
        document.getElementById("totalPower");

    const faultCountEl =
        document.getElementById("faultCount");


    if (runningCountEl) {

        runningCountEl.textContent =
            `${runningCount} / 4`;
    }


    let totalRpm = 0;
    let totalPower = 0;


    for (let motorId = 1; motorId <= 4; motorId++) {

        const rpmElement =
            document.getElementById(`rpm${motorId}`);

        const powerElement =
            document.getElementById(`power${motorId}`);


        if (rpmElement) {

            const rpmValue =
                Number(
                    rpmElement.textContent
                        .replace(/\./g, "")
                        .replace(",", ".")
                ) || 0;

            totalRpm += rpmValue;
        }


        if (powerElement) {

            const powerValue =
                parseFloat(
                    powerElement.textContent
                        .replace(",", ".")
                ) || 0;

            totalPower += powerValue;
        }
    }


    if (totalRpmEl) {

        totalRpmEl.textContent =
            totalRpm.toLocaleString("tr-TR");
    }


    if (totalPowerEl) {

        totalPowerEl.textContent =
            totalPower.toFixed(1) + " kW";
    }


    if (faultCountEl) {

        faultCountEl.textContent =
            faultCount;
    }
}



// ============================================
// 12. MOTOR YÜKÜ RENK SINIFI
// ============================================

function getLoadClass(loadValue) {

    if (loadValue >= 90) {
        return "high";
    }

    if (loadValue >= 75) {
        return "medium";
    }

    return "normal";
}


// ============================================
// 13. SAYFAYI BAŞLAT
// ============================================

async function initializeMotorsPage() {

    if (!checkSession()) {
        return;
    }

    loadOperatorInfo();

    await checkBackendStatus();

    await fetchMotorStatus();
}


// ============================================
// 14. PERİYODİK GÜNCELLEME
// ============================================

// Her 3 saniyede motor durumlarını kontrol et
setInterval(function () {

    fetchMotorStatus();

}, 3000);


// İlk açılış
initializeMotorsPage();