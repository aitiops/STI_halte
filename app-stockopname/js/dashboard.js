/**
 * ENGINEER DASHBOARD ENGINE - IT STOCK OPNAME
 * Version: Ultra Strict Search, Premium Overlay, & Modal Logout Standard
 */

window.onload = () => {
    const nama = localStorage.getItem("nama");
    if (document.getElementById("namaUser")) {
        document.getElementById("namaUser").innerText = nama || "Engineer";
    }
    loadDashboardEngineer();
};

// ========================================================
// 1. LOAD DATA UTAMA (SUMMARY & LIST ACCORDION)
// ========================================================
async function loadDashboardEngineer() {
    const statusEl = document.getElementById("loadingStatus");
    const overlay = document.getElementById("loadingOverlay");
    const token = localStorage.getItem("token");

    // Kembalikan visibilitas kalau direfresh
    if (overlay) {
        overlay.classList.remove('overlay-slide-up', 'opacity-0', 'invisible');
    }
    if (statusEl) statusEl.innerText = "Sinkronisasi Data Lapangan...";

    try {
        // A. Ambil Summary Stats
        const resStats = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getDashboardEngineer", token: token })
        });
        const stats = await resStats.json();
        
        if (stats.status) {
            document.getElementById("totalHalte").innerText = stats.data.total_halte || 0;
            document.getElementById("halteSelesai").innerText = stats.data.halte_selesai || 0;
            document.getElementById("progressVisit").innerText = (stats.data.progress || 0) + "%";
        }

        // B. Ambil List Semua Halte untuk Accordion
        if (statusEl) statusEl.innerText = "Menyusun Data Koridor...";
        const resHalte = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getHalte", token: token })
        });
        const halteData = await resHalte.json();
        
        if (halteData.status) {
            renderAccordion(halteData.data);
        }

    } catch (err) {
        console.error("Gagal Sinkronisasi Dashboard:", err);
        if (statusEl) statusEl.innerText = "Gagal Memuat Data. Periksa Koneksi.";
    } finally {
        setTimeout(() => {
            if (overlay) {
                // Gunakan animasi slide-up bawaan CSS yang elegan
                overlay.classList.add('overlay-slide-up');
            }
        }, 800);
    }
}

// ========================================================
// 2. RENDER GENERATE HTML ACCORDION
// ========================================================
function renderAccordion(listHalte) {
    const container = document.getElementById("dashboardKoridor");
    if (!container) return;

    if (!listHalte || listHalte.length === 0) {
        container.innerHTML = `<p class="text-center py-20 text-slate-400 font-bold uppercase text-xs">Data Halte Tidak Ditemukan</p>`;
        return;
    }

    let koridorMap = {};
    listHalte.forEach(item => {
        if (!koridorMap[item.koridor_id]) koridorMap[item.koridor_id] = [];
        koridorMap[item.koridor_id].push(item);
    });

    let html = "";
    Object.keys(koridorMap).sort((a, b) => a - b).forEach(kId => {
        let items = koridorMap[kId];
        let doneInKoridor = items.filter(h => h.status === "Selesai").length;
        
        let halteRows = "";
        items.forEach(h => {
            const isDone = h.status === "Selesai";
            halteRows += `
                <div class="halte-row flex justify-between items-center p-4 border-b border-slate-50 last:border-none">
                    <div class="flex-grow">
                        <div class="font-bold text-slate-700 text-sm h-nama">${h.nama_halte}</div>
                        <div class="text-[10px] text-slate-400 font-mono uppercase">ID: ${h.halte_id}</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="${isDone ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} text-[9px] font-black px-2 py-1 rounded-md uppercase">
                            ${isDone ? 'DONE' : 'PENDING'}
                        </span>
                        <button onclick="window.location.href='halte-detail.html?halte_id=${h.halte_id}&halte_nama=${h.nama_halte}&koridor_id=${h.koridor_id}'" 
                            class="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-[#0095DA] hover:text-white transition-all shadow-sm active:scale-90">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                </div>`;
        });

        html += `
            <div class="accordion-item tj-card overflow-hidden bg-white shadow-sm mb-4 border border-slate-100" id="koridor-${kId}">
                <div class="accordion-header flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors" onclick="toggleAccordion('koridor-${kId}')">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-[#0095DA] text-white rounded-xl flex items-center justify-center font-black shadow-inner">${kId}</div>
                        <div>
                            <h2 class="text-sm font-black text-slate-800 uppercase">Koridor ${kId}</h2>
                            <p class="text-[10px] text-slate-500 font-bold">${doneInKoridor} / ${items.length} Selesai</p>
                        </div>
                    </div>
                    <div class="chevron-icon transition-transform duration-300 opacity-20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
                <div class="accordion-content bg-white border-t border-slate-50">
                    <div class="p-1">${halteRows}</div>
                </div>
            </div>`;
    });

    container.innerHTML = html;
}

// ========================================================
// 3. ULTRA FOOLPROOF SEARCH ENGINE
// ========================================================
function filterHalteManual() {
    const input = document.getElementById('searchHalte').value.toLowerCase().trim();
    const allRows = document.querySelectorAll('.halte-row');
    const accordions = document.querySelectorAll('.accordion-item');

    allRows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (input === "" || text.includes(input)) {
            row.style.setProperty('display', 'flex', 'important');
            row.classList.remove('hidden');
        } else {
            row.style.setProperty('display', 'none', 'important');
            row.classList.add('hidden');
        }
    });

    accordions.forEach(acc => {
        const contentContainer = acc.querySelector('.accordion-content');
        
        if (input === "") {
            acc.style.setProperty('display', 'block', 'important');
            acc.classList.remove('hidden', 'accordion-active');
            if (contentContainer) contentContainer.style.removeProperty('display');
        } else {
            let countVisibleHalte = 0;
            const innerRows = acc.querySelectorAll('.halte-row');
            
            innerRows.forEach(row => {
                if (row.style.display !== 'none' && !row.classList.contains('hidden')) {
                    countVisibleHalte++;
                }
            });

            if (countVisibleHalte > 0) {
                acc.style.setProperty('display', 'block', 'important');
                acc.classList.remove('hidden');
                acc.classList.add('accordion-active');
                if (contentContainer) contentContainer.style.setProperty('display', 'block', 'important');
            } else {
                acc.style.setProperty('display', 'none', 'important');
                acc.classList.add('hidden');
                acc.classList.remove('accordion-active');
                if (contentContainer) contentContainer.style.setProperty('display', 'none', 'important');
            }
        }
    });
}

function toggleAccordion(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('accordion-active');
}

// ========================================================
// 4. PREMIUM MODAL LOGOUT CONTROL
// ========================================================
function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    const content = document.getElementById('logoutModalContent');
    if(modal && content) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
    } else {
        executeLogout(); 
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    const content = document.getElementById('logoutModalContent');
    if(modal && content) {
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

function executeLogout() {
    localStorage.clear();
    window.location.href = "index.html";
}
