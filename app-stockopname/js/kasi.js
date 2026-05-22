/**
 * KASI DASHBOARD ENGINE - COMPREHENSIVE FINAL EDITION
 * Features: 
 * 1. Anti-Duplicate Ryan Garry (Exclusive Rocket Commander 🚀) [With Null-Safety Fix]
 * 2. 3-Second Welcome Delay Animation
 * 3. SheetJS (XLSX) Multi-Sheet Master Report Generator 📊
 */

// State Global untuk menampung master data hasil fetch API
let currentDashboardData = null;

window.onload = () => {
    const nama = localStorage.getItem("nama");
    if (document.getElementById("namaUser")) {
        document.getElementById("namaUser").innerText = nama || "Kasi";
    }
    loadDashboardKasi();
};

async function loadDashboardKasi() {
    const overlay = document.getElementById("loadingOverlay");
    const spinnerStage = document.getElementById("spinnerStage");
    const welcomeStage = document.getElementById("welcomeStage");
    const welcomeNama = document.getElementById("welcomeNama");
    
    const token = localStorage.getItem("token");
    const namaKasi = localStorage.getItem("nama") || "Kepala Seksi";

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getDashboardKasi", token: token })
        });
        const result = await res.json();
        const rootData = result.data || result;

        if (!result.status) {
            if (overlay) overlay.classList.add('overlay-slide-up');
            return;
        }

        // Simpan data ke state global agar bisa diexport kapan saja
        currentDashboardData = rootData;

        const koridors = rootData.koridors || [];
        const timRaw = rootData.engineers || [];

        // Kalkulasi Statistik Global
        let totalH = 0, selesaiH = 0, totalA = 0;
        koridors.forEach(k => {
            totalH += parseInt(k.total_halte || 0);
            selesaiH += parseInt(k.selesai || 0);
            totalA += parseInt(k.total_perangkat || 0);
        });

        document.getElementById("totalHalte").innerText = totalH;
        document.getElementById("halteSelesai").innerText = selesaiH;
        document.getElementById("totalPerangkat").innerText = totalA;
        document.getElementById("totalTim").innerText = timRaw.length;
        document.getElementById("globalProgress").innerText = (totalH > 0 ? Math.round((selesaiH / totalH) * 100) : 0) + "%";
        document.getElementById("globalProgressBar").style.width = (totalH > 0 ? Math.round((selesaiH / totalH) * 100) : 0) + "%";

        renderHierarkiTim(timRaw);
        renderKoridor(koridors);

        // Animasi Loading Masuk dengan Sesi Sambutan Terkunci 3 Detik (3000ms)
        setTimeout(() => {
            if (spinnerStage) spinnerStage.classList.add('hidden');
            if (welcomeNama) welcomeNama.innerText = namaKasi;
            if (welcomeStage) {
                welcomeStage.classList.remove('hidden');
                setTimeout(() => welcomeStage.classList.remove('opacity-0'), 50);
            }
            
            setTimeout(() => { 
                if (overlay) overlay.classList.add('overlay-slide-up'); 
            }, 3000);
        }, 400);

    } catch (err) {
        if (overlay) overlay.classList.add('overlay-slide-up');
    }
}

function renderHierarkiTim(list) {
    const container = document.getElementById("engineerList");
    if (!container) return; 

    let koords = list.filter(t => t.role && t.role.toLowerCase() === 'koordinator');
    const engs = list.filter(t => t.role && t.role.toLowerCase() === 'engineer');
    
    let html = "";
    let matchedEngNames = new Set();

    // 1. FILTER EKSKLUSIF RYAN GARRY (Ditambahkan pelindung null-safety anti-stuck)
    const ryanGarryData = koords.find(k => k.nama && (k.nama.toLowerCase() === 'ryan garry' || k.nama.toLowerCase().includes('ryan')));
    koords = koords.filter(k => k.nama && k.nama.toLowerCase() !== 'ryan garry' && !k.nama.toLowerCase().includes('ryan'));

    // 2. Render Koordinator Reguler
    koords.forEach((koor, index) => {
        const koorNums = String(koor.koridor_tugas || "").match(/\d+/g) || [];
        let anakBuah = engs.filter(e => {
            const eNums = String(e.koridor_tugas || "").match(/\d+/g) || [];
            return eNums.some(num => koorNums.includes(num));
        });
        anakBuah.forEach(a => matchedEngNames.add(a.nama));
        
        const totalAsetTim = anakBuah.reduce((sum, el) => sum + (parseInt(el.selesai) || 0), 0) + (parseInt(koor.selesai) || 0);
        const accId = `acc-koor-${index}`;

        html += `
        <div class="bg-slate-50 dark:bg-[#050b14] rounded-[1.25rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div onclick="toggleAccordion('${accId}')" class="p-3.5 flex items-center gap-3 cursor-pointer bg-white dark:bg-[#111c3a] hover:bg-slate-50 dark:hover:bg-[#15234b] transition-colors">
                <div class="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center text-lg shrink-0">👑</div>
                <div class="flex-grow">
                    <h3 class="font-black text-slate-800 dark:text-white text-xs uppercase">${koor.nama}</h3>
                    <p class="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">KOR: ${koor.koridor_tugas || '-'}</p>
                </div>
                <div class="text-right pr-3 border-r border-slate-200 dark:border-slate-700">
                    <span class="text-sm font-black text-purple-600 dark:text-purple-400">${totalAsetTim}</span>
                </div>
                <div class="text-slate-300 dark:text-slate-600 pl-1 text-xs font-black" id="icon-${accId}">▼</div>
            </div>
            <div id="${accId}" class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                <div class="p-3 space-y-2.5 bg-slate-50/50 dark:bg-[#050b14] border-t border-slate-200 dark:border-slate-800">${renderListAnakBuah(anakBuah)}</div>
            </div>
        </div>`;
    });

    // 3. RENDER TIM INDEPENDEN / BUSLAM (EKSKLUSIF ROKET COMMANDER)
    const independentEngs = engs.filter(e => !matchedEngNames.has(e.nama));
    const isBusLam = independentEngs.length > 0 ? independentEngs.every(e => String(e.koridor_tugas || "").toLowerCase().includes('buslam')) : false;
    
    if (independentEngs.length > 0 || ryanGarryData) {
        const extraAsetRyan = ryanGarryData ? (parseInt(ryanGarryData.selesai) || 0) : 0;
        const totalAsetInd = independentEngs.reduce((sum, el) => sum + (parseInt(el.selesai) || 0), 0) + extraAsetRyan;
        const accId = `acc-buslam`;
        
        html += `
        <div class="bg-slate-50 dark:bg-[#050b14] rounded-[1.25rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-4">
            <div onclick="toggleAccordion('${accId}')" class="p-3.5 flex items-center gap-3 cursor-pointer bg-slate-100 dark:bg-[#1a294d] hover:bg-slate-200 dark:hover:bg-[#203461] transition-colors">
                <div class="w-10 h-10 rounded-xl bg-slate-600 text-white flex items-center justify-center text-lg shrink-0">🚀</div>
                <div class="flex-grow">
                    <h3 class="font-black text-slate-700 dark:text-slate-200 text-xs uppercase">${isBusLam || ryanGarryData ? "RYAN GARRY" : "Tim Independen"}</h3>
                    <p class="text-[8px] font-bold text-slate-500 uppercase tracking-wider">${isBusLam || ryanGarryData ? "KOR: BUSLAM" : "Lintas Koridor"}</p>
                </div>
                <div class="text-right pr-3 border-r border-slate-300 dark:border-slate-600">
                    <span class="text-sm font-black text-slate-700 dark:text-slate-300">${totalAsetInd}</span>
                </div>
                <div class="text-slate-400 pl-1 text-xs font-black" id="icon-${accId}">▼</div>
            </div>
            <div id="${accId}" class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                <div class="p-3 space-y-2.5 border-t border-slate-200 dark:border-slate-800">
                    ${ryanGarryData ? `
                    <div class="flex justify-between items-center bg-white dark:bg-[#111c3a] p-2.5 rounded-xl border border-[#0095DA]/30 dark:border-[#0095DA]/50 shadow-sm mb-2">
                        <span class="text-[10px] font-black text-[#0095DA] uppercase">⭐ COMMANDER</span>
                        <span class="text-[10px] font-black text-slate-500">${extraAsetRyan} ASET</span>
                    </div>` : ''}
                    ${renderListAnakBuah(independentEngs)}
                </div>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

function renderListAnakBuah(list) {
    if (!list || list.length === 0) return `<p class="text-[9px] font-bold text-slate-400 uppercase text-center py-2">Tidak ada engineer</p>`;
    return list.map(e => `
        <div class="flex justify-between items-center bg-white dark:bg-[#111c3a] p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
            <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">${e.nama}</span>
            <span class="text-[10px] font-black text-slate-400">${e.selesai || 0} ASET</span>
        </div>
    `).join("");
}

function renderKoridor(list) {
    const container = document.getElementById("gridKoridor") || document.getElementById("koridorList");
    let html = "";
    if (!list || list.length === 0) {
        if (container) container.innerHTML = `<p class="text-center py-10 text-slate-400 text-[10px] font-black uppercase">Data Tidak Ditemukan</p>`;
        return;
    }

    list.forEach(kor => {
        const prog = kor.progress || 0;
        const accId = `c-${kor.id}`;
        html += `
        <div class="bg-white dark:bg-[#132247]/40 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden mb-4">
            <div onclick="toggleAccordionKoridor('${accId}')" class="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                <div class="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-lg">${kor.id}</div>
                <div class="flex-grow">
                    <div class="flex justify-between items-end mb-1.5"><span class="text-[10px] font-black text-slate-400 uppercase">Jalur Koridor ${kor.id}</span><span class="text-xs font-black text-[#0095DA] font-mono">${prog}%</span></div>
                    <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full"><div class="bg-slate-800 dark:bg-[#0095DA] h-full transition-all duration-1000" style="width: ${prog}%"></div></div>
                </div>
                <div class="text-slate-400 text-sm font-black transition-transform duration-300" id="icon-${accId}">▼</div>
            </div>
            <div id="${accId}" class="max-h-0 overflow-hidden transition-all duration-300 bg-slate-50/40 dark:bg-[#0f1a36]/30">
                <div class="p-4 space-y-2">${renderHalteChildRows(kor.haltes, kor.id)}</div>
            </div>
        </div>`;
    });
    if (container) container.innerHTML = html;
}

function renderHalteChildRows(haltes, korId) {
    if (!haltes || haltes.length === 0) return `<p class="text-[10px] font-bold text-slate-400 text-center py-2 uppercase">Belum ada halte terdaftar</p>`;
    return haltes.map(h => {
        const isDone = h.status === "SELESAI";
        const totalOff = parseInt(h.total_off || 0);
        const offBadge = totalOff > 0 ? `<span class="bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 text-[8px] font-black px-2 py-1 rounded-md animate-pulse">⚠️ ${totalOff} DOWN</span>` : "";
        const finalId = h.id || h.halte_id;
        const finalNama = h.nama_halte || h.nama;
        const jumlahAlat = h.total_perangkat !== undefined ? h.total_perangkat : (h.total_alat || 0);
        return `
        <div onclick="window.location.href='halte-detail.html?halte_id=${finalId}&halte_nama=${encodeURIComponent(finalNama)}&koridor_id=${korId}'" class="flex justify-between items-center bg-white dark:bg-[#111c3a]/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/40 hover:border-[#0095DA] cursor-pointer group transition-all">
            <div class="flex items-center gap-3">
                <span class="text-xs transition-transform group-hover:scale-125">${isDone ? "🟢" : "🔴"}</span>
                <div>
                    <p class="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-[#0095DA] uppercase">${finalNama}</p>
                    <p class="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">${jumlahAlat} Perangkat</p>
                </div>
            </div>
            <div class="flex items-center gap-2">${offBadge}<span class="text-slate-300 dark:text-slate-600 group-hover:text-[#0095DA] text-xs font-black group-hover:translate-x-1 transition-all">➔</span></div>
        </div>`;
    }).join("");
}

// PREMIUM EXCEL MULTI-SHEET GENERATOR ENGINE
function exportDataKasi() {
    if (!currentDashboardData) {
        alert("Data operasional belum siap atau gagal disinkronkan!");
        return;
    }

    const koridors = currentDashboardData.koridors || [];
    const engineers = currentDashboardData.engineers || [];

    // 1. SHEET DATA 1: RINGKASAN EKSEKUTIF (SUMMARY GLOBAL)
    let totalHalte = 0, selesaiHalte = 0, totalPerangkat = 0;
    koridors.forEach(k => {
        totalHalte += parseInt(k.total_halte || 0);
        selesaiHalte += parseInt(k.selesai || 0);
        totalPerangkat += parseInt(k.total_perangkat || 0);
    });
    
    const summaryData = [
        ["LAPORAN MASTER DATA IT STOCK OPNAME TRANSJAKARTA"],
        ["Tanggal Ekstraksi Data", new Date().toLocaleDateString('id-ID')],
        [],
        ["Kategori Indikator", "Jumlah Aktual", "Satuan"],
        ["Total Target Inspeksi Halte", totalHalte, "Halte"],
        ["Halte Selesai Di-inspeksi", selesaiHalte, "Halte"],
        ["Total Komponen Aset IT Terdata", totalPerangkat, "Unit Perangkat"],
        ["Persentase Progress Penyelesaian", (totalHalte > 0 ? Math.round((selesaiHalte / totalHalte) * 100) : 0) + "%", "Persentase Global"]
    ];

    // 2. SHEET DATA 2: STATUS DETIL KORIDOR
    const koridorData = [
        ["ID Koridor", "Nama Wilayah Operasional", "Total Target Halte", "Halte Rampung", "Progress Capaian"]
    ];
    koridors.forEach(k => {
        koridorData.push([
            k.id,
            `Koridor ${k.id}`,
            parseInt(k.total_halte || 0),
            parseInt(k.selesai || 0),
            (k.progress || 0) + "%"
        ]);
    });

    // 3. SHEET DATA 3: REKAPAN PERFORMA TIM LAPANGAN
    const timData = [
        ["Nama Personel", "Peran Tugas", "Wilayah Koridor Penugasan", "Total Aset Berhasil Discan"]
    ];
    engineers.forEach(e => {
        timData.push([
            e.nama.toUpperCase(),
            e.role.toUpperCase(),
            e.koridor_tugas,
            e.selesai || 0
        ]);
    });

    // Proses Pembuatan File Excel XLSX menggunakan SheetJS Library
    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    const wsKoridor = XLSX.utils.aoa_to_sheet(koridorData);
    const wsTim = XLSX.utils.aoa_to_sheet(timData);

    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Eksekutif");
    XLSX.utils.book_append_sheet(wb, wsKoridor, "Status Koridor");
    XLSX.utils.book_append_sheet(wb, wsTim, "Performa Tim Lapangan");

    const stampName = `Master_Report_IT_StockOpname_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, stampName);
}

// UI ACCORDION HANDLERS
function toggleAccordion(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    if (el && el.style.maxHeight && el.style.maxHeight !== "0px") {
        el.style.maxHeight = "0px";
        if (icon) icon.style.transform = "rotate(0deg)";
    } else if (el) {
        el.style.maxHeight = el.scrollHeight + "px";
        if (icon) icon.style.transform = "rotate(180deg)";
    }
}

function toggleAccordionKoridor(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    if (el && el.style.maxHeight && el.style.maxHeight !== "0px") { 
        el.style.maxHeight = "0px"; 
        if(icon) icon.style.transform = "rotate(0deg)"; 
    } else if (el) { 
        el.style.maxHeight = el.scrollHeight + "px"; 
        if(icon) icon.style.transform = "rotate(180deg)"; 
    }
}

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    const content = document.getElementById('logoutModalContent');
    if(modal && content) {
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); content.classList.add('scale-100'); }, 10);
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
