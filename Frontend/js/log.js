// ============================================
// SMART FOOD FACTORY — LOGS.JS
// ============================================

const API = "http://127.0.0.1:8000";

let allLogs = [];


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
// 2. OPERATÖR BİLGİLERİ
// ============================================

function loadOperatorInfo() {

    const fullname =
        sessionStorage.getItem("fullname") ||
        localStorage.getItem("fullname") ||
        "Fabrika Operatörü";

    const opName =
        document.getElementById("opName");

    const opAvatar =
        document.getElementById("opAvatar");


    if (opName) {

        opName.textContent =
            fullname;
    }


    if (opAvatar) {

        const initials = fullname
            .split(" ")
            .filter(Boolean)
            .map(word => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();

        opAvatar.textContent =
            initials || "OP";
    }
}


// ============================================
// 3. SAAT
// ============================================

function updateClock() {

    const clock =
        document.getElementById("clock");

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

    const status =
        document.getElementById("backendStatus");

    try {

        const response =
            await fetch(`${API}/`);

        if (!response.ok) {

            throw new Error(
                "Backend yanıt vermedi."
            );
        }

        if (status) {

            status.textContent =
                "● Sistem Aktif";

            status.className =
                "status-badge ok";
        }

    } catch (error) {

        if (status) {

            status.textContent =
                "● Backend Bağlantısı Yok";

            status.className =
                "status-badge alarm";
        }

        console.error(
            "Backend bağlantı hatası:",
            error
        );
    }
}


// ============================================
// 5. LOGLARI BACKEND'DEN AL
// ============================================

async function fetchLogs() {

    try {

        const response =
            await fetch(`${API}/logs`);

        if (!response.ok) {

            throw new Error(
                "Log verileri alınamadı."
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                "Log API başarısız cevap verdi."
            );
        }

        allLogs =
            data.logs || [];

        updateLogSummary();

        applyFilters();

    } catch (error) {

        console.error(
            "Log veri hatası:",
            error
        );
    }
}


// ============================================
// 6. KPI SAYILARINI GÜNCELLE
// ============================================

function updateLogSummary() {

    const totalCount =
        allLogs.length;


    const motorCount =
        allLogs.filter(log =>
            log.event_type === "motor_start" ||
            log.event_type === "motor_stop"
        ).length;


    const faultCount =
        allLogs.filter(log =>
            log.event_type === "motor_fault"
        ).length;


    const alarmCount =
        allLogs.filter(log =>
            log.event_type === "fault_reset" ||
            log.event_type === "alarm_acknowledged"
        ).length;


    const totalEl =
        document.getElementById(
            "totalLogCount"
        );

    const motorEl =
        document.getElementById(
            "motorLogCount"
        );

    const faultEl =
        document.getElementById(
            "faultLogCount"
        );

    const alarmEl =
        document.getElementById(
            "alarmLogCount"
        );


    if (totalEl) {

        totalEl.textContent =
            totalCount;
    }


    if (motorEl) {

        motorEl.textContent =
            motorCount;
    }


    if (faultEl) {

        faultEl.textContent =
            faultCount;
    }


    if (alarmEl) {

        alarmEl.textContent =
            alarmCount;
    }
}


// ============================================
// 7. FİLTRELER
// ============================================

function applyFilters() {

    const eventFilter =
        document.getElementById(
            "eventFilter"
        ).value;

    const sourceFilter =
        document.getElementById(
            "sourceFilter"
        ).value;


    let filtered =
        [...allLogs];


    if (eventFilter !== "all") {

        filtered =
            filtered.filter(
                log =>
                    log.event_type === eventFilter
            );
    }


    if (sourceFilter !== "all") {

        filtered =
            filtered.filter(
                log =>
                    log.source_type === sourceFilter
            );
    }


    renderLogTable(filtered);
}


// ============================================
// 8. LOG TABLOSUNU OLUŞTUR
// ============================================

function renderLogTable(logs) {

    const tbody =
        document.getElementById(
            "logTableBody"
        );

    const emptyMessage =
        document.getElementById(
            "emptyLogMessage"
        );


    if (!tbody) return;


    tbody.innerHTML = "";


    if (logs.length === 0) {

        if (emptyMessage) {

            emptyMessage.style.display =
                "block";
        }

        return;
    }


    if (emptyMessage) {

        emptyMessage.style.display =
            "none";
    }


    logs.forEach(log => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${log.id}
            </td>

            <td>
                ${formatDateTime(
                    log.created_at
                )}
            </td>

            <td>
                ${formatEventType(
                    log.event_type
                )}
            </td>

            <td>
                ${formatSource(log)}
            </td>

            <td>
                ${escapeHtml(
                    log.message
                )}
            </td>

        `;

        tbody.appendChild(row);
    });
}


// ============================================
// 9. OLAY TÜRÜ FORMATLA
// ============================================

function formatEventType(eventType) {

    const eventMap = {

        motor_start:
            "▶ Motor Başlatıldı",

        motor_stop:
            "■ Motor Durduruldu",

        motor_fault:
            "🚨 Motor Arızası",

        fault_reset:
            "↻ Arıza Reset",

        alarm_acknowledged:
            "✅ Alarm Onaylandı"
    };

    return (
        eventMap[eventType] ||
        eventType ||
        "-"
    );
}


// ============================================
// 10. KAYNAK FORMATLA
// ============================================

function formatSource(log) {

    if (log.source_type === "motor") {

        return `Motor ${log.source_id}`;
    }


    if (log.source_type === "alarm") {

        return `Alarm ${log.source_id}`;
    }


    return log.source_type || "-";
}


// ============================================
// 11. TARİH / SAAT FORMATLA
// ============================================

function formatDateTime(value) {

    if (!value) return "-";

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
    }

    return date.toLocaleString(
        "tr-TR"
    );
}


// ============================================
// 12. HTML GÜVENLİĞİ
// ============================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================
// 13. EVENT LISTENERS
// ============================================

function setupEvents() {

    const eventFilter =
        document.getElementById(
            "eventFilter"
        );

    const sourceFilter =
        document.getElementById(
            "sourceFilter"
        );

    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );


    if (eventFilter) {

        eventFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (sourceFilter) {

        sourceFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            fetchLogs
        );
    }
}


// ============================================
// 14. SAYFAYI BAŞLAT
// ============================================

async function initializeLogsPage() {

    if (!checkSession()) {

        return;
    }

    loadOperatorInfo();

    setupEvents();

    await checkBackendStatus();

    await fetchLogs();
}


// ============================================
// 15. PERİYODİK GÜNCELLEME
// ============================================

// Her 5 saniyede logları yenile

setInterval(function () {

    fetchLogs();

}, 5000);


// İlk açılış

initializeLogsPage();