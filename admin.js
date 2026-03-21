// ==========================================
// 1. CONFIGURATION & CONFIG
// ==========================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwx-pbd2JNyT8-st-4AakEKFps0Ql6Y3o5_Zb4ZkEJbrJdpAJpffu88tEkvIFmKeQpigA/exec';
const IMGBB_API_KEY = '9d19a0f1d80f89446815cfbd8d40ee8c';
const MASTER_KEY = "2026"; // Namba ya dharura milele

// Hakikisha Password ipo kwenye mfumo mara ya kwanza
if (!localStorage.getItem('adminPassword')) {
    localStorage.setItem('adminPassword', '2026');
}

// ==========================================
// 2. LOGIN & PASSWORD SYSTEM (KAWAIDA)
// ==========================================

// Kuingia Admin (Lazima abonyeze Button)
function checkPass() {
    const input = document.getElementById('admin-pass').value.trim();
    const currentPass = localStorage.getItem('adminPassword');

    if (input === currentPass) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-pass').value = "";
    } else {
        alert("❌ PIN uliyoweka si sahihi!");
    }
}

// Onyesha/Ficha sehemu ya kusahau PIN
function showForgot() {
    const section = document.getElementById('forgot-section');
    section.style.display = (section.style.display === 'none') ? 'block' : 'none';
}

// Kubadilisha PIN kwa kutumia Master Key (2026)
function resetWithMasterKey() {
    const masterIn = document.getElementById('master-key-input').value.trim();
    const newPin = document.getElementById('new-pin-input').value.trim();

    if (masterIn === MASTER_KEY) {
        if (newPin.length < 4) {
            alert("PIN mpya lazima iwe na herufi kuanzia 4!");
            return;
        }
        localStorage.setItem('adminPassword', newPin);
        alert("✅ PIN imebadilishwa! Sasa ingia na PIN mpya.");

        // Safisha na ufiche
        document.getElementById('master-key-input').value = "";
        document.getElementById('new-pin-input').value = "";
        document.getElementById('forgot-section').style.display = 'none';
    } else {
        alert("❌ Master Key si sahihi!");
    }
}

// ==========================================
// 3. NAVIGATION (TOGGLE VIEWS)
// ==========================================
function toggleView(view) {
    const sections = ['section-add', 'section-remove'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });

    if (view === 'add') {
        document.getElementById('section-add').style.display = 'block';
    } else if (view === 'remove') {
        document.getElementById('section-remove').style.display = 'block';
        loadProducts(); // Pakia bidhaa pindi unapoingia hapa
    }
}

// ==========================================
// 4. ONGEZA BIDHAA (IMGBB + GOOGLE SHEETS)
// ==========================================
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save');
        const status = document.getElementById('status');
        const file = document.getElementById('p-image-file').files[0];

        if (!file) {
            alert("Tafadhali chagua picha ya bidhaa!");
            return;
        }

        btn.disabled = true;
        btn.innerText = "Inatuma Picha... ⏳";

        try {
            // Hatua ya 1: Upload to ImgBB
            const formData = new FormData();
            formData.append('image', file);
            const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const imgData = await imgRes.json();
            const imageUrl = imgData.data.url;

            // Hatua ya 2: Tuma Data kwenye Google Sheets
            status.innerText = "Inahifadhi Kwenye Excel... 📊";
            const product = {
                action: 'add', // Muhimu kwa Google Script kujua cha kufanya
                name: document.getElementById('p-name').value,
                price: document.getElementById('p-price').value,
                category: document.getElementById('p-category').value,
                description: document.getElementById('p-description').value,
                imageUrl: imageUrl
            };

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(product)
            });

            status.innerHTML = "<b style='color:#2ecc71;'>✅ Bidhaa imewekwa Live!</b>";
            e.target.reset();
        } catch (err) {
            status.innerHTML = "<b style='color:#ff5252;'>❌ Imeshindwa kuhifadhi!</b>";
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.innerText = "HIFADHI MTANDAONI 🌍";
        }
    };
}

// ==========================================
// 5. LOAD & DELETE PRODUCTS
// ==========================================
async function loadProducts() {
    const list = document.getElementById('admin-product-list');
    if (!list) return;

    list.innerHTML = '<p style="color:white; text-align:center;">Inapakia bidhaa... 🔄</p>';

    try {
        const res = await fetch(GOOGLE_SCRIPT_URL + '?action=read');
        const data = await res.json();
        const items = data.sheet1 || [];

        if (items.length === 0) {
            list.innerHTML = '<p style="color:white; text-align:center;">Duka lipo tupu kwa sasa.</p>';
            return;
        }

        list.innerHTML = items.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:12px; margin-bottom:10px; border: 1px solid rgba(255,255,255,0.1);">
                <img src="${p.imageUrl}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                <span style="flex-grow:1; margin-left:15px; color:white;">
                    <b style="font-size:0.9rem;">${p.name}</b><br>
                    <small style="color:#25D366;">TZS ${p.price}</small>
                </span>
                <button onclick="deleteProduct('${p.name}')" style="background:#ff5252; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:bold;">Futa</button>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<p style="color:#ff5252; text-align:center;">Hitilafu! Hakikisha URL yako ipo sahihi.</p>';
    }
}

async function deleteProduct(productName) {
    if (!confirm(`Je, una uhakika unataka kufuta "${productName}"?`)) return;

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'delete', name: productName })
        });

        alert("Ombi la kufuta limetumwa. Inapakia orodha mpya...");
        setTimeout(loadProducts, 2500); // Subiri sekunde 2.5 ili Excel isasishwe
    } catch (e) {
        alert("Hitilafu imetokea wakati wa kufuta.");
    }
}