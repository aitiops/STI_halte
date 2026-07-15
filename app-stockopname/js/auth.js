/**
 * AUTHENTICATION ENGINE - IT STOCK OPNAME
 * Features: Multi-Role Routing, Secure Token Handling, Failsafe
 */

// Pastikan file js/config.js yang berisi const API_URL = "URL_GAS_LO" sudah diload sebelum ini Ry!

document.addEventListener("DOMContentLoaded", () => {
    // Cek apakah user sudah login. Jika sudah, arahkan sesuai rolenya tanpa perlu login lagi.
    const savedToken = localStorage.getItem("token");
    const savedRole = (localStorage.getItem("role") || "").toLowerCase();
    
    if (savedToken && window.location.pathname.includes("index.html")) {
        routeUser(savedRole);
    }

    // Pasang listener pada form login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", processLogin);
    }
});

async function processLogin(e) {
    e.preventDefault();

    const usernameInput = document.getElementById("username").value.trim();
    const passwordInput = document.getElementById("password").value.trim();
    
    if (!usernameInput || !passwordInput) {
        alert("Username dan Password wajib diisi!");
        return;
    }

    showLoadingAuth("Memverifikasi Kredensial...");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "login",
                username: usernameInput,
                password: passwordInput
            })
        });

        const result = await res.json();

        if (result.status) {
            // Sukses Login! Simpan data ke memori browser
            const userData = result.data;
            localStorage.setItem("token", userData.token);
            localStorage.setItem("role", userData.role);
            localStorage.setItem("nama", userData.nama);
            localStorage.setItem("koridor", userData.koridor_tugas || "");

            // Arahkan ke dashboard yang tepat
            routeUser(userData.role.toLowerCase());
        } else {
            // Gagal login (password salah / user tidak ditemukan)
            alert("Login Gagal: " + result.message);
            hideLoadingAuth();
        }
    } catch (error) {
        console.error("Error Auth:", error);
        alert("Kesalahan Jaringan. Pastikan koneksi internet stabil dan URL GAS valid.");
        hideLoadingAuth();
    }
}

// ================= MULTI-ROLE ROUTER Ry =================
function routeUser(role) {
    if (role === "admin" || role === "superadmin") {
        window.location.href = "admin.html";
    } else if (role === "kasi" || role === "kasie") {
        window.location.href = "kasie.html"; // Bisa disesuaikan kalau nama file lo kasi.html
    } else if (role === "koordinator") {
        window.location.href = "koordinator.html";
    } else if (role === "engineer") {
        window.location.href = "engineer.html";
    } else {
        alert("Role tidak dikenali. Silakan hubungi Administrator.");
        localStorage.clear();
        hideLoadingAuth();
    }
}

// ================= UI HELPERS =================
function showLoadingAuth(txt) {
    const btn = document.getElementById("btnLogin");
    const btnText = document.getElementById("btnText");
    if (btn) {
        btn.disabled = true;
        btn.classList.add("opacity-70", "cursor-not-allowed");
    }
    if (btnText) btnText.innerText = txt || "Memproses...";
}

function hideLoadingAuth() {
    const btn = document.getElementById("btnLogin");
    const btnText = document.getElementById("btnText");
    if (btn) {
        btn.disabled = false;
        btn.classList.remove("opacity-70", "cursor-not-allowed");
    }
    if (btnText) btnText.innerText = "MASUK KE SISTEM";
}
