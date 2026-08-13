// ============================================
// SMART FOOD FACTORY — SETTINGS.JS
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

    const opName =
        document.getElementById("opName");

    const opAvatar =
        document.getElementById("opAvatar");

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
// 5. ÇALIŞMA MODUNU GÜNCELLE
// ============================================

function updateOperationMode() {
    const selectedMode =
        document.querySelector(
            'input[name="operationMode"]:checked'
        )?.value;

    const plcSettingsSection =
        document.getElementById(
            "plcSettingsSection"
        );

    const addressMappingSection =
        document.getElementById(
            "addressMappingSection"
        );

    const testConnectionBtn =
        document.getElementById(
            "testConnectionBtn"
        );

    const connectionStatus =
        document.getElementById(
            "connectionStatus"
        );

    const isPlcMode =
        selectedMode === "plc";


    if (plcSettingsSection) {
        plcSettingsSection.classList.toggle(
            "plc-disabled",
            !isPlcMode
        );
    }

    if (addressMappingSection) {
        addressMappingSection.classList.toggle(
            "plc-disabled",
            !isPlcMode
        );
    }

    if (testConnectionBtn) {
        testConnectionBtn.disabled =
            !isPlcMode;
    }

    if (connectionStatus) {
        if (isPlcMode) {
            connectionStatus.textContent =
                "● PLC bağlantısı henüz test edilmedi.";
        } else {
            connectionStatus.textContent =
                "● Simulation Mode aktif. PLC bağlantısı kullanılmıyor.";
        }

        connectionStatus.className =
            "connection-status";
    }
}


// ============================================
// 6. TCP / RTU AYARLARINI GÖSTER
// ============================================

function updateConnectionType() {
    const connectionType =
        document.getElementById(
            "connectionType"
        )?.value;

    const tcpSettings =
        document.getElementById(
            "tcpSettings"
        );

    const rtuSettings =
        document.getElementById(
            "rtuSettings"
        );

    if (!tcpSettings || !rtuSettings) {
        return;
    }

    if (connectionType === "tcp") {
        tcpSettings.style.display =
            "block";

        rtuSettings.style.display =
            "none";
    } else {
        tcpSettings.style.display =
            "none";

        rtuSettings.style.display =
            "block";
    }
}


// ============================================
// 7. EVENT LISTENERS
// ============================================

function setupEvents() {
    const modeInputs =
        document.querySelectorAll(
            'input[name="operationMode"]'
        );

        
        
    const connectionType =
        document.getElementById(
            "connectionType"
        );

    modeInputs.forEach(input => {
        input.addEventListener(
            "change",
            updateOperationMode
        );
    });

if (testConnectionBtn) {
    testConnectionBtn.addEventListener(
        "click",
        testPlcConnection
    );
}


    if (connectionType) {
        connectionType.addEventListener(
            "change",
            updateConnectionType
        );
    }

    const saveSettingsBtn =
    document.getElementById("saveSettingsBtn");

if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener(
        "click",
        saveSettings
    );
}
}


// ============================================
// 8. SAYFAYI BAŞLAT
// ============================================

async function initializeSettingsPage() {

    if (!checkSession()) {
        return;
    }

    loadOperatorInfo();

    setupEvents();

    await checkBackendStatus();

    await loadSettings();
}

// ============================================
// FORM VERİLERİNİ TOPLA
// ============================================

function collectSettingsData() {

    const operationMode =
        document.querySelector(
            'input[name="operationMode"]:checked'
        )?.value || "simulation";

    const connectionType =
        document.getElementById("connectionType").value;

    return {
        operation_mode: operationMode,
        plc_model:
            document.getElementById("plcModel").value,

        connection_type: connectionType,

        ip_address:
            document.getElementById("plcIp").value.trim(),

        port:
            Number(
                document.getElementById("plcPort").value
            ) || null,

        com_port:
            document.getElementById("comPort").value.trim(),

        baud_rate:
            Number(
                document.getElementById("baudRate").value
            ) || null,

        parity:
            document.getElementById("parity").value,

        stop_bits:
            Number(
                document.getElementById("stopBits").value
            ) || null,

        slave_id:
            connectionType === "tcp"
                ? Number(
                    document.getElementById("tcpSlaveId").value
                ) || null
                : Number(
                    document.getElementById("rtuSlaveId").value
                ) || null,

        motor1_run:
            document.getElementById("motor1Run").value.trim() || null,

        motor1_start:
            document.getElementById("motor1Start").value.trim() || null,

        motor1_stop:
            document.getElementById("motor1Stop").value.trim() || null,

        motor1_fault:
            document.getElementById("motor1Fault").value.trim() || null,

        motor2_run:
            document.getElementById("motor2Run").value.trim() || null,

        motor2_start:
            document.getElementById("motor2Start").value.trim() || null,

        motor2_stop:
            document.getElementById("motor2Stop").value.trim() || null,

        motor2_fault:
            document.getElementById("motor2Fault").value.trim() || null,

        motor3_run:
            document.getElementById("motor3Run").value.trim() || null,

        motor3_start:
            document.getElementById("motor3Start").value.trim() || null,

        motor3_stop:
            document.getElementById("motor3Stop").value.trim() || null,

        motor3_fault:
            document.getElementById("motor3Fault").value.trim() || null,

        motor4_run:
            document.getElementById("motor4Run").value.trim() || null,

        motor4_start:
            document.getElementById("motor4Start").value.trim() || null,

        motor4_stop:
            document.getElementById("motor4Stop").value.trim() || null,

        motor4_fault:
            document.getElementById("motor4Fault").value.trim() || null
    };
}


// ============================================
// AYARLARI SQLITE'A KAYDET
// ============================================

async function saveSettings() {

    const saveBtn =
        document.getElementById("saveSettingsBtn");

    const connectionStatus =
        document.getElementById("connectionStatus");

    const settingsData =
        collectSettingsData();

    try {

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = "⏳ Kaydediliyor...";
        }

        const response = await fetch(
            `${API}/settings`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(settingsData)
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Ayarlar kaydedilemedi."
            );
        }

        if (connectionStatus) {
            connectionStatus.textContent =
                "● Ayarlar başarıyla kaydedildi.";

            connectionStatus.className =
                "connection-status success";
        }

    } catch (error) {

        console.error(
            "Ayar kaydetme hatası:",
            error
        );

        if (connectionStatus) {
            connectionStatus.textContent =
                "● Ayarlar kaydedilemedi.";

            connectionStatus.className =
                "connection-status error";
        }

    } finally {

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "💾 Ayarları Kaydet";
        }
    }
}

// ============================================
// PLC BAĞLANTISINI TEST ET
// ============================================

async function testPlcConnection() {

    const testButton =
        document.getElementById("testConnectionBtn");

    const connectionStatus =
        document.getElementById("connectionStatus");

    const selectedMode =
        document.querySelector(
            'input[name="operationMode"]:checked'
        )?.value;


    // Simulation Mode seçiliyse PLC testi yapılmaz
    if (selectedMode !== "plc") {

        if (connectionStatus) {
            connectionStatus.textContent =
                "● Simulation Mode aktif. PLC bağlantı testi yapılmaz.";

            connectionStatus.className =
                "connection-status";
        }

        return;
    }


    try {

        if (testButton) {
            testButton.disabled = true;
            testButton.textContent =
                "⏳ Bağlantı test ediliyor...";
        }


        if (connectionStatus) {
            connectionStatus.textContent =
                "● PLC bağlantısı test ediliyor...";

            connectionStatus.className =
                "connection-status testing";
        }


        const response = await fetch(
            `${API}/plc/test-connection`,
            {
                method: "POST"
            }
        );


        const data = await response.json();


        if (data.success) {

            if (connectionStatus) {
                connectionStatus.textContent =
                    "● " + data.message;

                connectionStatus.className =
                    "connection-status success";
            }

        } else {

            if (connectionStatus) {
                connectionStatus.textContent =
                    "● " + (
                        data.message ||
                        "PLC bağlantısı kurulamadı."
                    );

                connectionStatus.className =
                    "connection-status error";
            }
        }

    } catch (error) {

        console.error(
            "PLC bağlantı testi hatası:",
            error
        );


        if (connectionStatus) {
            connectionStatus.textContent =
                "● Backend sunucusuna bağlanılamadı.";

            connectionStatus.className =
                "connection-status error";
        }

    } finally {

        if (testButton) {
            testButton.disabled = false;
            testButton.textContent =
                "🔌 Bağlantıyı Test Et";
        }
    }
}


// ============================================
// KAYITLI AYARLARI BACKEND'DEN YÜKLE
// ============================================

async function loadSettings() {

    try {

        const response = await fetch(
            `${API}/settings`
        );

        if (!response.ok) {
            throw new Error(
                "Ayarlar alınamadı."
            );
        }

        const data = await response.json();

        if (!data.success || !data.settings) {
            throw new Error(
                data.message ||
                "Kayıtlı ayarlar bulunamadı."
            );
        }

        const settings = data.settings;


        // ========================================
        // ÇALIŞMA MODU
        // ========================================

        const modeInput = document.querySelector(
            `input[name="operationMode"][value="${settings.operation_mode}"]`
        );

        if (modeInput) {
            modeInput.checked = true;
        }


        // ========================================
        // PLC VE BAĞLANTI BİLGİLERİ
        // ========================================

        setValue("plcModel", settings.plc_model);
        setValue(
            "connectionType",
            settings.connection_type
        );

        setValue("plcIp", settings.ip_address);
        setValue("plcPort", settings.port);
        setValue("comPort", settings.com_port);
        setValue("baudRate", settings.baud_rate);
        setValue("parity", settings.parity);
        setValue("stopBits", settings.stop_bits);

        setValue(
            "tcpSlaveId",
            settings.slave_id
        );

        setValue(
            "rtuSlaveId",
            settings.slave_id
        );


        // ========================================
        // MOTOR 1 ADRESLERİ
        // ========================================

        setValue("motor1Run", settings.motor1_run);
        setValue(
            "motor1Start",
            settings.motor1_start
        );
        setValue(
            "motor1Stop",
            settings.motor1_stop
        );
        setValue(
            "motor1Fault",
            settings.motor1_fault
        );


        // ========================================
        // MOTOR 2 ADRESLERİ
        // ========================================

        setValue("motor2Run", settings.motor2_run);
        setValue(
            "motor2Start",
            settings.motor2_start
        );
        setValue(
            "motor2Stop",
            settings.motor2_stop
        );
        setValue(
            "motor2Fault",
            settings.motor2_fault
        );


        // ========================================
        // MOTOR 3 ADRESLERİ
        // ========================================

        setValue("motor3Run", settings.motor3_run);
        setValue(
            "motor3Start",
            settings.motor3_start
        );
        setValue(
            "motor3Stop",
            settings.motor3_stop
        );
        setValue(
            "motor3Fault",
            settings.motor3_fault
        );


        // ========================================
        // MOTOR 4 ADRESLERİ
        // ========================================

        setValue("motor4Run", settings.motor4_run);
        setValue(
            "motor4Start",
            settings.motor4_start
        );
        setValue(
            "motor4Stop",
            settings.motor4_stop
        );
        setValue(
            "motor4Fault",
            settings.motor4_fault
        );


        // Yüklenen moda göre görünümü güncelle
        updateOperationMode();
        updateConnectionType();

    } catch (error) {

        console.error(
            "Ayar yükleme hatası:",
            error
        );
    }
}

// ============================================
// FORM ALANINA GÜVENLİ DEĞER YAZ
// ============================================

function setValue(elementId, value) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.value =
        value ?? "";
}



// İlk açılış
initializeSettingsPage();