/**
 * KOORDINATOR DASHBOARD ENGINE - FINAL STANDARISASI
 */

window.onload = () => {
    const nama = localStorage.getItem("nama");
    if (document.getElementById("namaUser")) {
        document.getElementById("namaUser").innerText = nama || "Koordinator";
    }
    loadDashboardKoordinator();
};

async function loadDashboardKoordinator() {
    const overlay = document.getElementById("loadingOverlay");
    const token = localStorage.getItem("token");
    const wilayahAkses = localStorage.getItem("wilayah") || "";

    if (overlay) overlay.classList.remove('overlay-slide-up', 'opacity-0', 'invisible');

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getDashboardKoordinator", token: token })
        });
        const result = await res.json();
        const rootData = result.data || result;

        const koorNumbers = wilayahAkses.match(/\d+/g) || [];
        const isAll = wilayahAkses.toLowerCase().trim() === "all";

        const rawKoridors = rootData.koridors || [];
        let filteredKoridors = isAll ? rawKoridors : rawKoridors.filter(kor => {
            let korIdNumbers = String(kor.id).match(/\d+/g) || [];
            return korIdNumbers.some(num => koorNumbers.includes(num));
        });

        let totalH = 0, selesaiH = 0, totalA = 0;
        filteredKoridors.forEach(k => {
            totalH += parseInt(k.total_halte || 0);
            selesaiH += parseInt(k.selesai || 0);
            totalA += parseInt(k.total_perangkat || 0);
        });

        document.getElementById("totalHalte").innerText = totalH;
        document.getElementById("halteSelesai").innerText = selesaiH;
        document.getElementById("progressVisit").innerText = (totalH > 0 ? Math.round((selesaiH / totalH) * 100) : 0) + "%";
        document.getElementById("totalPerangkat").innerText = totalA;

        const rawEngineers = rootData.engineers || [];
        let filteredEngineers = isAll ? rawEngineers : rawEngineers.filter(eng => {
            let wilayahEng = String(eng.koridor_tugas).toLowerCase().trim();
            if (wilayahEng === 'all') return true; 
            let engNumbers = wilayahEng.match(/\d+/g) || [];
            return engNumbers.some(num => koorNumbers.includes(num));
        });
            
        renderEngineers(filteredEngineers);
        renderKoridor(filteredKoridors);

    } catch (err) {
        console.error("Gagal Sinkronisasi:", err);
    } finally {
        setTimeout(() => { if (overlay) overlay.classList.add('overlay-slide-up'); }, 800);
    }
}

function renderEngineers(list) {
    const container = document.getElementById("engineerList");
    let html = "";
    if (!list || list.length === 0) html = `<p class="text-[10px] font-black text-slate-400 text-center py-10">TIDAK ADA ENGINEER AKTIF</p>`;
    else {
        list.forEach(eng => {
            html += `
            <div class="bg-white dark:bg-[#132247]/40 p-5 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-sm">
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-lg">👷</div>
                        <div>
                            <h3 class="font-black text-slate-800 dark:text-white text-sm uppercase">${eng.nama}</h3>
                            <p class="text-[9px] font-bold text-slate-400 uppercase">KOR: ${eng.koridor_tugas || '-'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-lg font-black text-[#0095DA]">${eng.selesai || 0}</span>
                        <p class="text-[8px] font-bold text-slate-400 uppercase">Alat</p>
                    </div>
                </div>
            </div>`;
        });
    }
    container.innerHTML = html;
}

function renderKoridor(list) {
    const container = document.getElementById("koridorList");
    let html = "";
    if (!list || list.length === 0) container.innerHTML = `<p class="text-center py-10 text-slate-400 text-[10px] font-black uppercase">DATA TIDAK DITEMUKAN</p>`;
    else {
        list.forEach(kor => {
            const prog = kor.progress || 0;
            const accId = `c-${kor.id}`;
            html += `
            <div class="bg-white dark:bg-[#132247]/40 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
                <div onclick="toggleAccordionKoridor('${accId}')" class="p-5 flex items-center gap-4 cursor-pointer">
                    <div class="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-lg">${kor.id}</div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-end mb-1.5"><span class="text-[10px] font-black text-slate-400 uppercase">Koridor ${kor.id}</span><span class="text-xs font-black text-[#0095DA]">${prog}%</span></div>
                        <div class="w-full bg-slate-100 h-2 rounded-full"><div class="bg-[#0095DA] h-full" style="width: ${prog}%"></div></div>
                    </div>
                    <div class="text-slate-400 text-sm" id="icon-${accId}">▼</div>
                </div>
                <div id="${accId}" class="max-h-0 overflow-hidden transition-all duration-300">
                    <div class="p-4 space-y-2">${renderHalteChildRows(kor.haltes, kor.id)}</div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }
}

function renderHalteChildRows(haltes, korId) {
    let html = "";
    haltes.forEach(h => {
        html += `<div onclick="window.location.href='halte-detail.html?halte_id=${h.id || h.halte_id}&halte_nama=${encodeURIComponent(h.nama_halte)}&koridor_id=${korId}'" class="flex justify-between items-center bg-slate-50 dark:bg-[#111c3a]/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
            <span class="text-xs font-black uppercase">${h.nama_halte}</span>
            <span class="text-[10px] font-bold text-slate-400">${h.status}</span>
        </div>`;
    });
    return html;
}

function toggleAccordionKoridor(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    if (el.style.maxHeight && el.style.maxHeight !== "0px") { el.style.maxHeight = "0px"; if(icon) icon.style.transform = "rotate(0deg)"; } 
    else { el.style.maxHeight = el.scrollHeight + "px"; if(icon) icon.style.transform = "rotate(180deg)"; }
}

// ================= PREMIUM LOGOUT MODAL =================
function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    const content = document.getElementById('logoutModalContent');
    if(modal && content) {
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); content.classList.add('scale-100'); }, 10);
    } else { executeLogout(); }
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
