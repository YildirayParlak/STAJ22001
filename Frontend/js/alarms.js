// ============================================
// SMART FOOD FACTORY — ALARMS.JS
// ============================================

const API = "http://127.0.0.1:8000";

let allAlarms = [];


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
// 5. ALARMLARI BACKEND'DEN AL
// ============================================

async function fetchAlarms() {

    try {

        const response =
            await fetch(`${API}/alarms`);

        if (!response.ok) {

            throw new Error(
                "Alarm verileri alınamadı."
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                "Alarm API başarısız cevap verdi."
            );
        }

        allAlarms =
            data.alarms || [];

        updateAlarmSummary();

        applyFilters();

    } catch (error) {

        console.error(
            "Alarm veri hatası:",
            error
        );
    }
}


// ============================================
// 6. KPI SAYILARINI GÜNCELLE
// ============================================

function updateAlarmSummary() {

    const activeCount =
        allAlarms.filter(
            alarm => alarm.active
        ).length;


    const criticalCount =
        allAlarms.filter(
            alarm =>
                alarm.level === "critical" &&
                alarm.active
        ).length;


    const closedCount =
        allAlarms.filter(
            alarm => !alarm.active
        ).length;


    const totalCount =
        allAlarms.length;


    const activeEl =
        document.getElementById(
            "activeAlarmCount"
        );

    const criticalEl =
        document.getElementById(
            "criticalAlarmCount"
        );

    const closedEl =
        document.getElementById(
            "closedAlarmCount"
        );

    const totalEl =
        document.getElementById(
            "totalAlarmCount"
        );


    if (activeEl) {

        activeEl.textContent =
            activeCount;
    }


    if (criticalEl) {

        criticalEl.textContent =
            criticalCount;
    }


    if (closedEl) {

        closedEl.textContent =
            closedCount;
    }


    if (totalEl) {

        totalEl.textContent =
            totalCount;
    }
}


// ============================================
// 7. FİLTRELERİ UYGULA
// ============================================

function applyFilters() {

    const statusFilter =
        document.getElementById(
            "statusFilter"
        ).value;

    const levelFilter =
        document.getElementById(
            "levelFilter"
        ).value;


    let filtered =
        [...allAlarms];


    // Durum filtresi

    if (statusFilter === "active") {

        filtered =
            filtered.filter(
                alarm => alarm.active
            );
    }


    if (statusFilter === "closed") {

        filtered =
            filtered.filter(
                alarm => !alarm.active
            );
    }


    // Seviye filtresi

    if (levelFilter !== "all") {

        filtered =
            filtered.filter(
                alarm =>
                    alarm.level === levelFilter
            );
    }


    renderAlarmTable(filtered);
}


// ============================================
// 8. ALARM TABLOSUNU OLUŞTUR
// ============================================

function renderAlarmTable(alarms) {

    const tbody =
        document.getElementById(
            "alarmTableBody"
        );

    const emptyMessage =
        document.getElementById(
            "emptyAlarmMessage"
        );


    if (!tbody) return;


    tbody.innerHTML = "";


    if (alarms.length === 0) {

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


    alarms.forEach(alarm => {

        const row =
            document.createElement("tr");


row.innerHTML = `

    <td>
        ${alarm.id}
    </td>

    <td>
        ${formatSource(alarm)}
    </td>

    <td>
        ${escapeHtml(alarm.message)}
    </td>

    <td>
        ${formatLevel(alarm.level)}
    </td>

    <td>
        ${formatStatus(alarm.active)}
    </td>

    <td>
        ${formatAcknowledged(alarm.acknowledged)}
    </td>

    <td>
        ${formatDateTime(alarm.created_at)}
    </td>

    <td>
        ${
            alarm.cleared_at
                ? formatDateTime(alarm.cleared_at)
                : "-"
        }
    </td>

    <td>
        ${formatActionButton(alarm)}
    </td>

`;

        tbody.appendChild(row);
    });
}


// ============================================
// 9. KAYNAK FORMATLA
// ============================================

function formatSource(alarm) {

    if (alarm.source_type === "motor") {

        return `Motor ${alarm.source_id}`;
    }


    if (alarm.source_type === "sensor") {

        return `Sensör ${alarm.source_id}`;
    }


    if (alarm.source_type === "energy") {

        return `Enerji ${alarm.source_id}`;
    }


    return alarm.source_type || "-";
}


// ============================================
// 10. ALARM SEVİYESİ FORMATLA
// ============================================

function formatLevel(level) {

    if (level === "critical") {

        return `
            <span class="alarm-level critical">
                Kritik
            </span>
        `;
    }


    if (level === "warning") {

        return `
            <span class="alarm-level warning">
                Uyarı
            </span>
        `;
    }


    return `
        <span class="alarm-level info">
            Bilgi
        </span>
    `;
}


// ============================================
// 11. DURUM FORMATLA
// ============================================

function formatStatus(active) {

    if (active) {

        return `
            <span class="alarm-status active">
                ● Aktif
            </span>
        `;
    }


    return `
        <span class="alarm-status closed">
            ✓ Kapandı
        </span>
    `;
}


// ============================================
// 12. ONAY DURUMU FORMATLA
// ============================================

function formatAcknowledged(acknowledged) {

    if (acknowledged) {

        return `
            <span class="alarm-ack yes">
                ✓ Onaylandı
            </span>
        `;
    }


    return `
        <span class="alarm-ack no">
            Bekliyor
        </span>
    `;
}

// ============================================
// İŞLEM BUTONU
// ============================================

function formatActionButton(alarm) {

    // Alarm daha önce onaylandıysa buton gösterme
    if (alarm.acknowledged) {

        return `
            <span class="alarm-ack yes">
                ✓ Onaylandı
            </span>
        `;
    }

    // Alarm henüz onaylanmadıysa Onayla butonu göster
    return `
        <button
            class="btn btn-primary"
            onclick="acknowledgeAlarm(${alarm.id})"
        >
            Onayla
        </button>
    `;
}

// ============================================
// ALARMI ONAYLA
// ============================================

async function acknowledgeAlarm(alarmId) {

    try {

        const response = await fetch(
            `${API}/alarms/${alarmId}/acknowledge`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Alarm onaylanamadı."
            );

            return;
        }

        // Onay işleminden sonra alarm listesini yeniden getir
        await fetchAlarms();

    } catch (error) {

        console.error(
            "Alarm onaylama hatası:",
            error
        );

        alert(
            "Alarm onaylanırken bağlantı hatası oluştu."
        );
    }
}


// ============================================
// 13. TARİH / SAAT FORMATLA
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
// 14. HTML GÜVENLİĞİ
// ============================================

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

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
// 15. EVENT LISTENERS
// ============================================

function setupEvents() {

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const levelFilter =
        document.getElementById(
            "levelFilter"
        );

    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (levelFilter) {

        levelFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            fetchAlarms
        );
    }
}


// ============================================
// 16. SAYFAYI BAŞLAT
// ============================================

async function initializeAlarmsPage() {

    if (!checkSession()) {

        return;
    }

    loadOperatorInfo();

    setupEvents();

    await checkBackendStatus();

    await fetchAlarms();
}


// ============================================
// 17. PERİYODİK GÜNCELLEME
// ============================================

// Her 5 saniyede alarm listesini yenile

setInterval(function () {

    fetchAlarms();

}, 5000);


// İlk açılış

initializeAlarmsPage();