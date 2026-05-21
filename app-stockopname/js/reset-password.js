/**
 * RESET PASSWORD ENGINE - IT STOCK OPNAME
 * Version: Premium Loading Sync & Success Modal Standard
 */

const urlParams = new URLSearchParams(window.location.search);
let userId = urlParams.get("user_id") || localStorage.getItem("reset_user_id");

async function handleReset(event) {
    if (event) event.preventDefault(); 

    const pass = document.getElementById("newPassword").value;
    const conf = document.getElementById("confirmPassword").value;
    const btn = document.getElementById("btnReset");
    const msg = document.getElementById("msg");

    // 1. Validasi Kecocokan
    if (pass !== conf) {
        showResetValidationModal("Sandi Tidak Cocok", "Konfirmasi kata sandi tidak cocok! Silakan periksa kembali.");
        return;
    }

    if (pass.length < 6) {
        showResetValidationModal("Sandi Terlalu Pendek", "Demi keamanan, batas minimal sandi baru adalah 6 karakter.");
        return;
    }

    // 2. AKTIFKAN PREMIUM LOADING
    showLoading("Memperbarui Sandi...");
    if (btn) btn.disabled = true;
    if (msg) msg.innerText = ""; 

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "resetPassword",
                user_id: userId,
                new_password: pass
            })
        });

        const data = await res.json();

        if (data.status) {
            // TAMPILKAN MODAL SUKSES (DARK MODE READY)
            showResetSuccessModal();
        } else {
            hideLoading();
            if (msg) msg.innerText = data.message;
            showResetValidationModal("Gagal Memperbarui", data.message || "Terjadi kesalahan pada sistem.");
        }
    } catch (err) {
        console.error(err);
        hideLoading();
        if (msg) msg.innerText = "Koneksi gagal. Periksa internet Anda.";
        showResetValidationModal("Server Error", "Koneksi gagal. Pastikan komputer Anda terhubung ke internet.");
    }
}

// ================= PREMIUM LOADING OVERLAY CONTROL =================
function showLoading(txt) {
    const ov = document.getElementById("loadingOverlay");
    if (ov) { 
        ov.classList.remove('invisible', 'opacity-0'); 
    }
    if (document.getElementById("loadingStatus")) {
        document.getElementById("loadingStatus").innerText = txt;
    }
}

function hideLoading() {
    const ov = document.getElementById("loadingOverlay");
    if (ov) { 
        ov.classList.add('opacity-0');
        setTimeout(() => ov.classList.add('invisible'), 500);
    }
    const btn = document.getElementById("btnReset");
    if (btn) {
        btn.disabled = false;
    }
}

// ================= MODAL SUKSES & ERROR =================
function showResetSuccessModal() {
    const sm = document.getElementById("successModal");
    if (sm) {
        sm.classList.remove("hidden");
        sm.classList.add("flex");
        // Animasi muncul mulus
        setTimeout(() => {
            sm.querySelector("div").classList.remove("scale-95");
            sm.querySelector("div").classList.add("scale-100");
        }, 10);
    }
}

function showResetValidationModal(title, message) {
    if (document.getElementById("resetValModal")) document.getElementById("resetValModal").remove();
    const modalHtml = `
        <div id="resetValModal" class="fixed inset-0 bg-slate-900/60 dark:bg-[#050b14]/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 opacity-0 transition-opacity duration-300">
            <div class="bg-white dark:bg-[#0a1224] rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 transform scale-95 transition-all duration-300">
                <div class="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-rose-100 dark:border-rose-800/50">
                    ❌
                </div>
                <h3 class="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">${title}</h3>
                <p class="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6 leading-relaxed">${message}</p>
                <button onclick="document.getElementById('resetValModal').remove()" class="w-full bg-slate-800 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-900 text-white py-3.5 rounded-xl text-xs font-black transition active:scale-95 uppercase tracking-wider">
                    Mengerti
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    setTimeout(() => {
        document.getElementById("resetValModal").classList.remove("opacity-0");
    }, 10);
}

function redirectToLoginAfterReset() {
    localStorage.clear();
    window.location.href = "index.html";
}
