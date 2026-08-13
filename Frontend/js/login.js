// ============================================
// SMART FOOD FACTORY — LOGIN.JS
// Geçici login sistemi: SQLite henüz yok.
// Backend endpoint: POST /auth/login
// ============================================

const API_URL = "http://127.0.0.1:8000";


// ============================================
// 1. SAYFA YÜKLENDİĞİNDE
// ============================================

window.addEventListener("DOMContentLoaded", function () {
    checkApiStatus();
    redirectIfLoggedIn();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    // Kullanıcı yazmaya başladığında hata görünümünü temizler.
    usernameInput.addEventListener("input", function () {
        clearInputError("username");
        hideAlert();
    });

    passwordInput.addEventListener("input", function () {
        clearInputError("password");
        hideAlert();
    });

    // Kullanıcı adı alanına otomatik odaklanır.
    usernameInput.focus();
});


// ============================================
// 2. DAHA ÖNCE GİRİŞ YAPILMIŞ MI?
// ============================================

function redirectIfLoggedIn() {
    const sessionToken = sessionStorage.getItem("token");
    const localToken = localStorage.getItem("token");

    if (sessionToken || localToken) {
        window.location.href = "index.html";
    }
}


// ============================================
// 3. API DURUMUNU KONTROL ET
// ============================================

async function checkApiStatus() {
    const apiDot = document.getElementById("apiDot");
    const apiText = document.getElementById("apiText");
    const dbDot = document.getElementById("dbDot");
    const dbText = document.getElementById("dbText");

    clearStatusClasses(apiDot);
    clearStatusClasses(dbDot);

    try {
        const response = await fetch(`${API_URL}/`);

        if (!response.ok) {
            throw new Error(`HTTP hata kodu: ${response.status}`);
        }

        const data = await response.json();

        apiDot.classList.add("online");
        apiText.textContent = "API Aktif";

        // SQLite'ı henüz eklemediğimiz için doğru durumu gösteriyoruz.
        dbDot.classList.add("waiting");
        dbText.textContent = "Veritabanı henüz eklenmedi";

        console.log("API yanıtı:", data);

    } catch (error) {
        apiDot.classList.add("offline");
        apiText.textContent = "API bağlantısı kurulamadı";

        dbDot.classList.add("offline");
        dbText.textContent = "Veritabanı durumu bilinmiyor";

        console.error("API bağlantı hatası:", error);
    }
}


function clearStatusClasses(element) {
    element.classList.remove("online", "offline", "waiting");
}


// ============================================
// 4. ŞİFREYİ GÖSTER / GİZLE
// ============================================

function togglePassword() {
    const passwordInput = document.getElementById("password");
    const eyeButton = document.getElementById("eyeBtn");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeButton.textContent = "🙈";
        eyeButton.title = "Şifreyi gizle";
    } else {
        passwordInput.type = "password";
        eyeButton.textContent = "👁";
        eyeButton.title = "Şifreyi göster";
    }
}


// ============================================
// 5. ALERT MESAJLARI
// ============================================

function showAlert(message, type = "error") {
    const alertBox = document.getElementById("alertBox");
    const alertText = document.getElementById("alertText");

    alertText.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = "block";
}


function hideAlert() {
    const alertBox = document.getElementById("alertBox");

    alertBox.style.display = "none";
    alertBox.className = "alert";
}


// ============================================
// 6. INPUT HATA GÖRÜNÜMÜ
// ============================================

function setInputError(inputId) {
    const input = document.getElementById(inputId);
    input.classList.add("error");
}


function clearInputError(inputId) {
    const input = document.getElementById(inputId);
    input.classList.remove("error");
}


function clearAllInputErrors() {
    clearInputError("username");
    clearInputError("password");
}


// ============================================
// 7. GİRİŞ BUTONUNUN YÜKLENME DURUMU
// ============================================

function setLoading(isLoading) {
    const loginButton = document.getElementById("loginBtn");
    const buttonText = document.getElementById("btnText");
    const buttonSpinner = document.getElementById("btnSpinner");

    loginButton.disabled = isLoading;

    if (isLoading) {
        buttonText.style.display = "none";
        buttonSpinner.style.display = "inline";
    } else {
        buttonText.style.display = "inline";
        buttonSpinner.style.display = "none";
    }
}


// ============================================
// 8. FORM DOĞRULAMA
// ============================================

function validateForm(username, password) {
    clearAllInputErrors();
    hideAlert();

    let isValid = true;

    if (!username) {
        setInputError("username");
        isValid = false;
    }

    if (!password) {
        setInputError("password");
        isValid = false;
    }

    if (!username && !password) {
        showAlert("Kullanıcı adı ve şifre boş bırakılamaz.");
        return false;
    }

    if (!username) {
        showAlert("Kullanıcı adı boş bırakılamaz.");
        return false;
    }

    if (!password) {
        showAlert("Şifre boş bırakılamaz.");
        return false;
    }

    if (password.length < 3) {
        setInputError("password");
        showAlert("Şifre en az 3 karakter olmalıdır.");
        return false;
    }

    return isValid;
}


// ============================================
// 9. GİRİŞ İŞLEMİ
// ============================================

async function doLogin() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberMeCheckbox = document.getElementById("rememberMe");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;

    if (!validateForm(username, password)) {
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error(`Sunucu hata kodu: ${response.status}`);
        }

        const data = await response.json();

        if (data.success === true && data.token) {
            saveLoginData(data, rememberMe);

            showAlert(
                "Giriş başarılı. Dashboard'a yönlendiriliyorsunuz...",
                "success"
            );

            setTimeout(function () {
                window.location.href = "index.html";
            }, 1000);

            return;
        }

        showAlert(
            data.message || "Kullanıcı adı veya şifre yanlış."
        );

        setInputError("username");
        setInputError("password");
        setLoading(false);

    } catch (error) {
        console.error("Login hatası:", error);

        showAlert(
            "Sunucuya bağlanılamadı. FastAPI backend'inin çalıştığından emin olun."
        );

        setLoading(false);
    }
}


// ============================================
// 10. GİRİŞ BİLGİLERİNİ TARAYICIYA KAYDET
// ============================================

function saveLoginData(data, rememberMe) {
    // Önceden kalmış oturum bilgilerini temizler.
    clearStoredLoginData();

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("token", data.token);
    storage.setItem("username", data.username || "operator");
    storage.setItem("fullname", data.fullname || "Fabrika Operatörü");
    storage.setItem("role", data.role || "operator");
}


// Hem localStorage hem sessionStorage içindeki eski bilgileri temizler.
function clearStoredLoginData() {
    const keys = ["token", "username", "fullname", "role"];

    keys.forEach(function (key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}


// ============================================
// 11. ENTER TUŞUYLA GİRİŞ
// ============================================

document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        doLogin();
    }
});