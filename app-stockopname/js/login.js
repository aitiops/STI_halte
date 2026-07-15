/**
 * LOGIN ENGINE - IT STOCK OPNAME
 * Final Fix: Premium UI Sync, Smooth Modal Transitions, & Admin Routing
 */

async function login() {
    const userField = document.getElementById("username");
    const passField = document.getElementById("password");
    const msg = document.getElementById("message");

    const username = userField.value.trim();
    const password = passField.value.trim();

    if (!username || !password) {
        showLoginValidationModal("Input Kosong", "NIK dan Kata Sandi wajib diisi!");
        return;
    }

    showLoadingPremium();
    if (msg) msg.innerText = "";

    try {
        console.log("Menghubungi server...");

        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "login",
                username: username,
                password: password
            })
        });

        if (!res.ok) throw new Error("Koneksi ke Google Script Gagal");

        const data = await res.json();
        console.log("Respon Login:", data);

        if (data.status) {
            // A. CEK RESET PASSWORD
            if (data.reset) {
                forceHideLoading();
                localStorage.setItem("reset_user_id", data.user_id);
                // ... (Modal peringatan lo tetap di sini)
                return;
            }

            // B. NORMALISASI ROLE (Case Insensitive)
            const userRole = String(data.user.role).toLowerCase();

            // C. SIMPAN KE LOCALSTORAGE
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", userRole);
            localStorage.setItem("nama", data.user.nama);
            localStorage.setItem("wilayah", data.user.wilayah || ""); 

            // D. ROUTING BERDASARKAN ROLE (TAMBAHAN ADMIN RY!)
            const rolesMap = {
                "engineer": "engineer.html",
                "koordinator": "koordinator.html",
                "kasie": "kasie.html",
                "admin": "admin.html",      // <--- ROLE BARU
                "superadmin": "admin.html"  // <--- ROLE BARU
            };

            const targetPage = rolesMap[userRole];

            if (targetPage) {
                setTimeout(() => { window.location.href = targetPage; }, 600);
            } else {
                forceHideLoading();
                showLoginValidationModal("Akses Ditolak", `Role "${data.user.role}" tidak diizinkan masuk ke Command Center.`);
            }

        } else {
            forceHideLoading();
            showLoginValidationModal("Autentikasi Gagal", data.message || "NIK atau Kata Sandi yang Anda masukkan tidak valid.");
        }

    } catch (err) {
        console.error("Critical Login Error:", err);
        forceHideLoading();
        showLoginValidationModal("Koneksi Terputus", "Gagal menghubungi server pusat. Periksa konektivitas jaringan Anda.");
    }
}

/**
 * FUNGSI MODAL LOGIN VALIDATION PREMIUM
 */
function showLoginValidationModal(title, message) {
    if (document.getElementById("loginValModal")) document.getElementById("loginValModal").remove();
    
    const modalHtml = `
        <div id="loginValModal" class="fixed inset-0 bg-slate-900/60 dark:bg-[#050b14]/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 opacity-0 transition-opacity duration-300">
            <div class="bg-white dark:bg-[#0a1224] rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 transform scale-95 transition-all duration-300" id="lvmContent">
                <div class="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-rose-100 dark:border-rose-800/50">
                    ❌
                </div>
                <h3 class="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">${title}</h3>
                <p class="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6 leading-relaxed">${message}</p>
                <button onclick="closeValidationModal()" class="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest shadow-lg">
                    Mengerti
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    
    setTimeout(() => {
        const modal = document.getElementById("loginValModal");
        const content = document.getElementById("lvmContent");
        if(modal && content) {
            modal.classList.remove("opacity-0");
            content.classList.remove("scale-95");
            content.classList.add("scale-100");
        }
    }, 10);
}

function closeValidationModal() {
    const modal = document.getElementById("loginValModal");
    const content = document.getElementById("lvmContent");
    if(modal && content) {
        modal.classList.add("opacity-0");
        content.classList.remove("scale-100");
        content.classList.add("scale-95");
        setTimeout(() => modal.remove(), 300);
    }
}

function showLoadingPremium() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('invisible', 'opacity-0');
}

function forceHideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('invisible'), 500);
    }
}

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});
