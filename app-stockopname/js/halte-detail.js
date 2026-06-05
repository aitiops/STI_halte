/**
 * HALTE DETAIL ENGINE - IT STOCK OPNAME TRANSJAKARTA
 * Final Ultra Premium Executive Version 
 * Features: 
 * 1. Dynamic Route Auto-Parser (Deteksi Arah Otomatis dari Nama Halte Ry) 📍
 * 2. Premium Live Search & Status Filters
 * 3. Dynamic Auto-Direction Grouping Tab Switcher
 */

// 1. AMBIL PARAMETER URL DENGAN MEKANISME FAILSAFE MULTI-KEY Ry
const urlParams = new URLSearchParams(window.location.search);
let halte_id = urlParams.get("halte_id") || urlParams.get("id");
let halte_nama = urlParams.get("halte_nama") || urlParams.get("nama");
let koridor_id = urlParams.get("koridor_id") || urlParams.get("koridor");

// Ambil data Role Akun yang sedang login saat ini Ry untuk pembatasan hak edit/hapus
const USER_ROLE = (localStorage.getItem("role") || "").toLowerCase();

// Global Variable penampung data aset dari server
let perangkatList = [];
let currentDeleteId = null; 
let activeTabArah = ""; // State global untuk mengunci tab arah aktif saat ini

// ================= DYNAMIC BACK BUTTON ROUTING (ANTI-SALAH ROUTE Ry) =================
function goBackDashboard() {
    if (USER_ROLE === "koordinator") {
        window.location.href = 'koordinator.html';
    } else if (USER_ROLE === "kasie" || USER_ROLE === "kasi") {
        window.location.href = 'kasie.html';
    } else {
        window.location.href = 'engineer.html';
    }
}

// Proteksi Awal: Jika ID parameter bener-bener kosong ghaib, paksa balik ke rumah masing-masing
if (!halte_id) goBackDashboard();

// ================= EXECUTE FIRST RENDER =================
window.onload = () => {
    if (halte_id) halte_id = halte_id.trim();
    if (halte_nama) halte_nama = decodeURIComponent(halte_nama).trim();
    if (koridor_id) koridor_id = koridor_id.trim();

    const elTitle = document.getElementById("halteTitle");
    const elKoridor = document.getElementById("koridorTitle");

    if (elTitle && halte_nama) {
        elTitle.innerHTML = halte_nama.toUpperCase();
    }
    if (elKoridor && koridor_id) {
        elKoridor.innerHTML = "KORIDOR " + koridor_id;
    }

    applyRoleVisibilityProtection();
    loadPerangkat();
};

function applyRoleVisibilityProtection() {
    const btnTambah = document.getElementById("btnTambahPerangkat");
    if (USER_ROLE !== "engineer") {
        if (btnTambah) btnTambah.style.setProperty('display', 'none', 'important');
    }
}

function goInput() {
    if (USER_ROLE !== "engineer") {
        alert("Akses Ditolak: Hanya engineer lapangan yang dapat menambah data!");
        return;
    }
    window.location.href = `stock-opname.html?halte_id=${halte_id}&halte_nama=${encodeURIComponent(halte_nama)}&koridor_id=${koridor_id}`;
}

// ================= UNIFIED LOADING OVERLAY CONTROL =================
function showLoading(txt) {
    const ov = document.getElementById("loadingOverlay");
    if (ov) { 
        ov.classList.remove('overlay-slide-up', 'opacity-0', 'invisible');
    }
    if (document.getElementById("loadingStatus")) {
        document.getElementById("loadingStatus").innerText = txt;
    }
}

function hideLoading() {
    const ov = document.getElementById("loadingOverlay");
    if (ov) { 
        ov.classList.add('overlay-slide-up');
    }
}

// ================= HELPER AUTO-PARSE ARAH DARI NAMA HALTE Ry =================
function dapatkanArahDefaultDariNamaHalte() {
    if (!halte_nama) return ["ARAH A", "ARAH B"];
    
    // Konversi ke uppercase untuk mempermudah pencocokan string
    const namaUpper = halte_nama.toUpperCase();
    
    // Pola 1: Jika nama halte mengandung pemisah tanda hubung "-" atau garing "/" (Contoh: "Pinang Ranti - Pluit")
    if (namaUpper.includes(" - ")) {
        return namaUpper.split(" - ").map(str => "ARAH " + str.trim());
    }
    if (namaUpper.includes(" / ")) {
        return namaUpper.split(" / ").map(str => "ARAH " + str.trim());
    }
    
    // Pola 2: Jika nama mengandung tanda kurung (Contoh: "Ciliwung (Pinang Ranti)")
    if (namaUpper.includes("(") && namaUpper.includes(")")) {
        const diDalamKurung = namaUpper.substring(namaUpper.indexOf("(") + 1, namaUpper.indexOf(")"));
        if (diDalamKurung.includes("-")) {
            return diDalamKurung.split("-").map(str => "ARAH " + str.trim());
        }
        return ["ARAH " + diDalamKurung.trim(), "ARAH BALIKAN"];
    }

    // Pola Balikan/Default Terakhir jika nama halte pendek tunggal
    return ["ARAH 1", "ARAH 2"];
}

// ================= LOAD DATA PERANGKAT DARI DATABASE =================
async function loadPerangkat() {
    showLoading("Sinkronisasi Perangkat...");
    const sessionToken = localStorage.getItem("token");

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getPerangkatHalte",
                token: sessionToken,
                halte_id: halte_id
            })
        });

        const data = await res.json();
        perangkatList = data.data || [];

        updateSummary(perangkatList);
        
        // Atur inisialisasi default tab arah pertama kali data masuk Ry
        let semuaArah = [...new Set(perangkatList.map(item => (item.arah || item.dermaga || "TANPA ARAH").toUpperCase().trim()))];
        
        // FIX BARU: Jika data kosong gres, panggil fungsi pintar pemotong nama arah rute asli Ry!
        if (perangkatList.length === 0) {
            semuaArah = dapatkanArahDefaultDariNamaHalte();
        }

        if (semuaArah.length > 0) {
            activeTabArah = semuaArah[0];
        }

        // Jalankan Filter & Render Otomatis
        filterPerangkat();

        if (document.getElementById("loadingStatus")) {
            document.getElementById("loadingStatus").innerText = "Data Siap!";
        }
        setTimeout(() => { hideLoading(); }, 500);

    } catch (err) {
        console.error("Gagal load perangkat:", err);
        hideLoading();
    }
}

function updateSummary(data) {
    let totalOn = 0;
    let totalOff = 0;
    data.forEach(item => {
        if (item.status === "On Service") totalOn++;
        else totalOff++;
    });
    if(document.getElementById("totalPerangkat")) document.getElementById("totalPerangkat").innerHTML = data.length;
    if(document.getElementById("totalOn")) document.getElementById("totalOn").innerHTML = totalOn;
    if(document.getElementById("totalOff")) document.getElementById("totalOff").innerHTML = totalOff;
}

// ================= LIVE SEARCH, TAB GROUPING & FILTER LOGIC =================
function filterPerangkat() {
    const keyword = document.getElementById("searchInput").value.toLowerCase().trim();
    const statusFilter = document.getElementById("filterStatus").value;

    // 1. Ekstrak Semua Variasi Grup Arah dari data server
    let semuaArah = [...new Set(perangkatList.map(item => (item.arah || item.dermaga || "TANPA ARAH").toUpperCase().trim()))];

    // Jika bener-bener kosong gres (0 aset), kita suntik Grup Arah Pintar Ry!
    if (perangkatList.length === 0) {
        semuaArah = dapatkanArahDefaultDariNamaHalte();
    }

    // Jaga agar state tab aktif tidak hilang/kosong ghaib saat pertama kali load
    if (semuaArah.length > 0 && !semuaArah.includes(activeTabArah)) {
        activeTabArah = semuaArah[0];
    }

    // 2. Suntik / Render Komponen Navigasi Tab Langsung di Atas Tabel Perangkat Ry
    renderTabArahComponent(semuaArah);

    // 3. Filter Data Berdasarkan Keyword, Status, dan Grup Arah yang Sedang Aktif
    const filteredData = perangkatList.filter(item => {
        const nama = String(item.nama_perangkat || "").toLowerCase();
        const sn = String(item.serial_number || "").toLowerCase();
        const merk = String(item.merk_model || "").toLowerCase();
        const kategori = String(item.kategori || "").toLowerCase();
        const itemArah = (item.arah || item.dermaga || "TANPA ARAH").toUpperCase().trim();

        const matchesKeyword = nama.includes(keyword) || 
                               sn.includes(keyword) || 
                               merk.includes(keyword) || 
                               kategori.includes(keyword);

        const matchesStatus = statusFilter === "" ? true : item.status === statusFilter;
        
        // Kunci Data Sesuai Tab Arah Aktif
        // Catatan: Jika data kosong, filter ini diabaikan karena renderPerangkat otomatis menangani kondisi empty state
        const matchesArah = itemArah === activeTabArah;

        return matchesKeyword && matchesStatus && matchesArah;
    });

    renderPerangkat(filteredData);
}

// FUNCTION PEMBUAT KOMPONEN NAVIGASI TAB ARAH PREMIUM DYNAMICALLY
function renderTabArahComponent(arrayArah) {
    let tabContainer = document.getElementById("directionTabContainer");
    
    if (!tabContainer) {
        const targetTable = document.getElementById("tablePerangkat");
        if (targetTable) {
            tabContainer = document.createElement("div");
            tabContainer.id = "directionTabContainer";
            tabContainer.className = "w-full flex items-center gap-2 mb-5 overflow-x-auto pb-1 select-none scrollbar-none";
            targetTable.parentNode.insertBefore(tabContainer, targetTable);
        }
    }

    if (!tabContainer) return;

    tabContainer.className = "w-full flex items-center gap-2 mb-5 overflow-x-auto pb-1 select-none scrollbar-none";
    
    let htmlTabs = "";
    arrayArah.forEach(arah => {
        const isActive = arah === activeTabArah;
        const activeStyles = "bg-[#0095DA] text-white shadow-md shadow-blue-500/20 dark:shadow-blue-950/40 border-transparent";
        const inactiveStyles = "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-[#132247]/40 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-[#1e2e5a]/50";
        
        // Hitung total aset riil di server untuk arah ini
        const countAsetArah = perangkatList.filter(item => (item.arah || item.dermaga || "TANPA ARAH").toUpperCase().trim() === arah).length;

        htmlTabs += `
            <button onclick="switchArahTab('${arah}')" class="px-5 py-2.5 rounded-xl border text-xs font-black tracking-wide uppercase transition-all duration-200 active:scale-95 shrink-0 flex items-center gap-2 ${isActive ? activeStyles : inactiveStyles}">
                <span>📍 ${arah}</span>
                <span class="text-[9px] px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}">${countAsetArah}</span>
            </button>
        `;
    });
    tabContainer.innerHTML = htmlTabs;
}

function switchArahTab(namaArah) {
    activeTabArah = namaArah;
    filterPerangkat();
}

// ================= RENDER CARD HYBRID =================
function renderPerangkat(dataList) {
    let html = "";
    const container = document.getElementById("tablePerangkat");

    if (!dataList || dataList.length === 0) {
        html = `
            <div class="col-span-full py-20 text-center">
                <div class="text-5xl mb-4 opacity-20">🔍</div>
                <p class="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Tidak ada perangkat di arah ini</p>
            </div>`;
        container.innerHTML = html;
        return;
    }

    dataList.forEach(item => {
        const isOn = item.status === 'On Service';
        const bgStatus = isOn ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400';
        const dotStatus = isOn ? 'bg-emerald-500' : 'bg-rose-500';
        const stringArah = item.arah || item.dermaga ? `<span class="bg-blue-50 text-[#0095DA] dark:bg-blue-950/40 dark:text-blue-400 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wide border border-blue-100/30 dark:border-blue-900/40">📍 ${(item.arah || item.dermaga).toUpperCase()}</span>` : '';

        html += `
            <div class="bg-white dark:bg-[#132247]/40 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-5">
                        <div class="flex items-center gap-2 ${bgStatus} px-3 py-1 rounded-full">
                            <span class="w-2 h-2 rounded-full ${dotStatus} animate-pulse"></span>
                            <span class="text-[10px] font-black uppercase tracking-wider">${item.status}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            ${stringArah}
                            <button onclick="openPhoto('${item.photo}')" class="bg-slate-50 dark:bg-[#1e293b] text-slate-400 dark:text-slate-500 hover:text-[#0095DA] dark:hover:text-[#0095DA] p-2 rounded-xl transition shadow-inner border border-transparent dark:border-slate-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                            </button>
                        </div>
                    </div>

                    <h3 class="text-lg font-black text-slate-800 dark:text-white leading-tight group-hover:text-[#0095DA] dark:group-hover:text-[#0095DA] transition-colors">${item.nama_perangkat || "-"}</h3>
                    <p class="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-tighter">${item.merk_model || "-"}</p>

                    <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                        <div class="flex justify-between text-[11px]">
                            <span class="text-slate-400 dark:text-slate-500 font-bold uppercase">S/N</span>
                            <span class="font-mono font-black text-slate-700 dark:text-slate-300">${item.serial_number || "-"}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                            <span class="text-slate-400 dark:text-slate-500 font-bold uppercase">Kategori</span>
                            <span class="font-bold text-slate-600 dark:text-slate-400">${item.kategori || "-"}</span>
                        </div>
                    </div>
                </div>

                <div class="${USER_ROLE === 'engineer' ? 'grid' : 'hidden'} grid-cols-2 border-t border-slate-100 dark:border-slate-800/40">
                    <button onclick="window.location.href='stock-opname.html?edit=1&id=${item.opname_id}&halte_id=${halte_id}&halte_nama=${encodeURIComponent(halte_nama)}&koridor_id=${koridor_id}'" 
                        class="p-4 text-xs font-black text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors uppercase border-r border-slate-100 dark:border-slate-800/40">
                        Edit
                    </button>
                    <button onclick="deletePerangkat('${item.opname_id}')" 
                        class="p-4 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors uppercase">
                        Hapus
                    </button>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

// ================= DELETE MODAL CONTROL =================
function deletePerangkat(opnameId) {
    if (USER_ROLE !== "engineer") return;
    currentDeleteId = opnameId;
    
    document.getElementById("deleteModalIcon").innerText = "⚠️";
    document.getElementById("deleteModalTitle").innerText = "Hapus Perangkat?";
    document.getElementById("deleteModalDesc").innerText = "Tindakan ini bersifat permanen. Data perangkat ini akan sepenuhnya dihapus dari sistem monitoring pusat.";
    
    document.getElementById("deleteModalActions").innerHTML = `
        <button onclick="closeDeleteModal()" class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            Batal
        </button>
        <button onclick="startDeleteCountdown()" class="bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95">
            Ya, Hapus
        </button>
    `;

    const dModal = document.getElementById('deleteModal');
    if (dModal) {
        dModal.classList.remove('hidden');
        dModal.classList.add('flex');
    }
}

function closeDeleteModal() {
    if (deleteCountdownInterval) {
        clearInterval(deleteCountdownInterval);
        deleteCountdownInterval = null;
    }
    const dModal = document.getElementById('deleteModal');
    if (dModal) {
        dModal.classList.remove('flex');
        dModal.classList.add('hidden');
    }
    currentDeleteId = null;
}

let deleteCountdownInterval = null;
function startDeleteCountdown() {
    if (!currentDeleteId) return;

    let secondsLeft = 5;
    document.getElementById("deleteModalIcon").innerText = "⏳";
    document.getElementById("deleteModalTitle").innerText = "Memproses Penghapusan...";
    document.getElementById("deleteModalDesc").innerHTML = `Data akan terhapus permanen dalam <span class="font-black text-rose-500 text-sm">${secondsLeft}</span> detik.`;
    
    document.getElementById("deleteModalActions").innerHTML = `
        <button onclick="closeDeleteModal()" class="col-span-full bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95">
            BATALKAN PROSES (${secondsLeft}s)
        </button>
    `;

    deleteCountdownInterval = setInterval(async () => {
        secondsLeft--;
        if (secondsLeft > 0) {
            const btn = document.getElementById("deleteModalActions").querySelector("button");
            if (btn) btn.innerText = `BATALKAN PROSES (${secondsLeft}s)`;
            document.getElementById("deleteModalDesc").innerHTML = `Data akan terhapus permanen dalam <span class="font-black text-rose-500 text-sm">${secondsLeft}</span> detik.`;
        } else {
            clearInterval(deleteCountdownInterval);
            deleteCountdownInterval = null;
            await executeDeleteRequest();
        }
    }, 1000);
}

async function executeDeleteRequest() {
    if (!currentDeleteId) return;
    
    showLoading("Menghapus Perangkat Lapangan...");
    const savedId = currentDeleteId;
    closeDeleteModal();

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ 
                action: "deletePerangkat", 
                token: localStorage.getItem("token"), 
                opname_id: savedId 
            })
        });
        const data = await res.json();
        if (data.status) { 
            loadPerangkat();
        } else {
            alert("Gagal menghapus: " + data.message);
            hideLoading();
        }
    } catch (err) { 
        console.error(err); 
        alert("Kesalahan Jaringan Backend!");
        hideLoading();
    }
}

// ================= DRIVE IMAGE PREVIEW MODAL CONTROL =================
function openPhoto(url) {
    if (!url || url === "undefined" || url === "") { alert("Foto fisik perangkat tidak tersedia."); return; }
    let fileId = "";
    if (url.includes("/d/")) fileId = url.split("/d/")[1].split("/")[0];
    else if (url.includes("id=")) fileId = url.split("id=")[1].split("&")[0];
    if (!fileId) { window.open(url, "_blank"); return; }
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    document.getElementById("modalIframe").src = previewUrl;
    document.getElementById("photoModal").classList.replace("hidden", "flex");
}

function closePhoto() {
    document.getElementById("modalIframe").src = "";
    document.getElementById("photoModal").classList.replace("flex", "hidden");
}

// ================= PREMIUM MODAL LOGOUT CONTROL =================
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
