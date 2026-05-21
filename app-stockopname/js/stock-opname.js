/**
 * STOCK OPNAME ENGINE - ULTRA FOOLPROOF FINAL FIX
 * Version: Internal Anti-Blank Guard, Premium Loading Sync & PIS Single-Halte Auto Arah Ry
 */

let masterPerangkat = [];
let currentHalteData = null; 

const urlParams = new URLSearchParams(window.location.search);
const halteId = urlParams.get("halte_id");
const halteNama = urlParams.get("halte_nama");
const koridorId = urlParams.get("koridor_id");
const editMode = urlParams.get("edit");
const opnameId = urlParams.get("id");

window.onload = async () => {
    showLoading("Menyiapkan Formulir...");
    await Promise.all([loadMasterPerangkat(), loadHalteDetail()]);

    if (editMode && opnameId) {
        if (document.getElementById("pageTitle")) document.getElementById("pageTitle").innerText = "Edit Status";
        if (document.getElementById("btnSave")) document.getElementById("btnSave").innerText = "Update Status";
        await loadEditData();
    }
    hideLoading();
};

// ================= PREMIUM LOADING OVERLAY CONTROL =================
function showLoading(txt) {
    const ov = document.getElementById("loadingOverlay");
    if (ov) { 
        // Hapus class slide-up agar overlay turun lagi (kalau dipanggil ulang saat nyimpan data)
        ov.classList.remove('overlay-slide-up'); 
    }
    if (document.getElementById("loadingStatus")) {
        document.getElementById("loadingStatus").innerText = txt;
    }
}

function hideLoading() {
    const ov = document.getElementById("loadingOverlay");
    if (ov) { 
        // Pasang class slide-up agar overlay naik dengan mulus
        ov.classList.add('overlay-slide-up'); 
    }
}

// LOGIKA OTOMATISASI PENAMPILAN ARAH PERANGKAT (FIX PIS RY)
function checkArahVisibility() {
    if (!currentHalteData) return;
    
    const kategoriValue = document.getElementById("kategori").value.toUpperCase();
    const isPIS = kategoriValue.includes("PIS"); 
    const isDual = currentHalteData.tipe_halte?.toLowerCase() === "dual";
    
    const arahContainer = document.getElementById("arahContainer");
    const arahPerangkat = document.getElementById("arahPerangkat");
    
    if (isDual || isPIS) {
        if (arahContainer) arahContainer.classList.remove("hidden");
        
        if (arahPerangkat) {
            let options = `<option value="">Pilih Arah</option>`;
            if (currentHalteData.arah_a) options += `<option value="${currentHalteData.arah_a}">${currentHalteData.arah_a}</option>`;
            if (currentHalteData.arah_b) options += `<option value="${currentHalteData.arah_b}">${currentHalteData.arah_b}</option>`;
            
            if (!currentHalteData.arah_a && !currentHalteData.arah_b) {
                options += `<option value="Arah Jalur">Arah Jalur Utama</option>`;
            }
            arahPerangkat.innerHTML = options;
        }
    } else {
        if (arahContainer) arahContainer.classList.add("hidden");
        if (arahPerangkat) arahPerangkat.value = "";
    }
}

function triggerSuccessRedirect() {
    hideLoading();
    const sm = document.getElementById("successModal");
    if (sm) {
        sm.classList.remove("hidden");
        sm.classList.add("flex");
    }
    setTimeout(() => {
        window.location.href = `halte-detail.html?halte_id=${halteId}&halte_nama=${halteNama}&koridor_id=${koridorId}`;
    }, 1500);
}

async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 1000;
                let w = img.width, h = img.height;
                if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
        };
    });
}

async function saveStockOpname() {
    const fields = {
        kategori: document.getElementById("kategori").value,
        nama: document.getElementById("namaPerangkat").value,
        merk: document.getElementById("merkModel").value,
        sn: document.getElementById("serialNumber").value.trim().toUpperCase(),
        status: document.getElementById("statusPerangkat").value,
        arah: document.getElementById("arahPerangkat") ? document.getElementById("arahPerangkat").value : "",
        photoFile: document.getElementById("photo").files[0]
    };

    if (!fields.kategori || !fields.nama || !fields.sn || !fields.status) {
        alert("Wajib mengisi Kategori, Nama Alat, S/N, dan Status!");
        return;
    }

    showLoading("Memproses Data...");
    let photoBase64 = fields.photoFile ? await compressImage(fields.photoFile) : "";

    try {
        const payload = {
            action: editMode ? "updateStockOpname" : "saveStockOpname",
            token: localStorage.getItem("token"),
            opname_id: opnameId,
            updated_by: localStorage.getItem("nama") || "Engineer",
            halte_id: halteId,
            halte_nama: halteNama,
            koridor_id: koridorId,
            kategori: fields.kategori,
            nama_perangkat: fields.nama,
            merk_model: fields.merk,
            serial_number: fields.sn,
            status: fields.status,
            arah: fields.arah,
            force_save: false,
            photo: photoBase64
        };

        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        const data = await res.json();

        if (data.status) {
            triggerSuccessRedirect();
        } else if (data.duplicate) {
            hideLoading();
            if (confirm("S/N terdeteksi duplikat. Tetap simpan?")) saveForce(payload);
        } else {
            hideLoading();
            alert("Gagal: " + data.message);
        }
    } catch (err) { 
        hideLoading(); 
        alert("Kesalahan Jaringan!"); 
    }
}

async function saveForce(p) {
    showLoading("Menyimpan Paksa...");
    p.force_save = true;
    try {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(p) });
        const data = await res.json();
        if (data.status) {
            triggerSuccessRedirect();
        } else {
            hideLoading();
            alert("Gagal Simpan Paksa: " + data.message);
        }
    } catch (err) {
        hideLoading();
        alert("Kesalahan Jaringan!");
    }
}

// ========================================================
// DROPDOWN RENDERING LOGIC
// ========================================================
async function loadMasterPerangkat() {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getMasterPerangkat", token: localStorage.getItem("token") }) });
    masterPerangkat = (await res.json()).data || [];
    
    const unik = [...new Set(masterPerangkat.map(i => i.kategori).filter(Boolean))];
    let h = `<option value="">Pilih Kategori</option>`;
    unik.forEach(i => h += `<option value="${i}">${i}</option>`);
    document.getElementById("kategori").innerHTML = h;
}

function changeKategori() {
    const kat = document.getElementById("kategori").value;
    const filtered = masterPerangkat.filter(i => i.kategori == kat);
    
    const unik = [...new Set(filtered.map(i => i.nama_perangkat).filter(Boolean))];
    let h = `<option value="">Pilih Perangkat</option>`;
    unik.forEach(i => h += `<option value="${i}">${i}</option>`);
    document.getElementById("namaPerangkat").innerHTML = h;
    
    document.getElementById("merkModel").innerHTML = `<option value="">Pilih Merk / Model</option>`;
    
    checkArahVisibility();
}

function changePerangkat() {
    const kat = document.getElementById("kategori").value;
    const n = document.getElementById("namaPerangkat").value;
    const filtered = masterPerangkat.filter(i => i.kategori == kat && i.nama_perangkat == n);
    
    const unik = [...new Set(filtered.map(i => i.merk_model).filter(Boolean))];
    let h = `<option value="">Pilih Merk / Model</option>`;
    unik.forEach(i => h += `<option value="${i}">${i}</option>`);
    document.getElementById("merkModel").innerHTML = h;
}

async function loadHalteDetail() {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getHalteDetail", token: localStorage.getItem("token"), halte_id: halteId }) });
    const r = await res.json();
    if (r.status) {
        currentHalteData = r.data; 
        document.getElementById("infoKoridor").innerHTML = `Koridor ${currentHalteData.koridor_id}`;
        document.getElementById("infoHalte").innerHTML = currentHalteData.nama_halte;
        
        checkArahVisibility();
    }
}

async function loadEditData() {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getDetailOpname", token: localStorage.getItem("token"), opname_id: opnameId }) });
    const r = await res.json();
    if (!r.status) return;
    const i = r.data;
    
    document.getElementById("kategori").value = i.kategori;
    changeKategori();
    setTimeout(() => {
        document.getElementById("namaPerangkat").value = i.nama_perangkat;
        changePerangkat();
        setTimeout(() => {
            document.getElementById("merkModel").value = i.merk_model;
            document.getElementById("serialNumber").value = i.serial_number;
            document.getElementById("statusPerangkat").value = i.status;
            if (i.arah && document.getElementById("arahPerangkat")) {
                document.getElementById("arahPerangkat").value = i.arah;
            }
        }, 300);
    }, 300);
}

function previewImage(event) {
    const f = event.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (document.getElementById("uploadPlaceholder")) {
            document.getElementById("uploadPlaceholder").classList.add("hidden");
        }
        const p = document.getElementById("previewPhoto");
        if (p) {
            p.src = e.target.result; 
            p.classList.remove("hidden");
        }
    };
    reader.readAsDataURL(f);
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
