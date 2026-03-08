// 1. VIUNGO VYA MUHIMU
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbS_zEacJahcItVA_3v9BtJmVnZ1pG0ErUoDPdt8x_qfR3pr_PgEVT71El1c7KTtpJ/exec';
const IMGBB_API_KEY = '9d19a0f1d80f89446815cfbd8d40ee8c';

// 2. KAGUA NAMBA YA SIRI
function checkPass() {
    const passInput = document.getElementById('admin-pass').value;
    const loginSection = document.getElementById('login-section');
    const adminForm = document.getElementById('admin-form');

    if (passInput === "2026") {
        loginSection.style.display = 'none';
        adminForm.style.display = 'block';
    } else {
        alert("Namba ya siri si sahihi! Jaribu tena.");
    }
}

// 3. KAZI YA KUHIFADHI BIDHAA NA PICHA
document.getElementById('productForm').onsubmit = async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btn-save');
    const status = document.getElementById('status');
    const imageFile = document.getElementById('p-image-file').files[0];

    // Zuia kitufe kisibonyezwe mara mbili
    btn.disabled = true;
    btn.innerText = "Inapakia... Subiri";
    status.innerText = "Inatuma picha ImgBB...";
    status.style.color = "#81c784";

    try {
        // HATUA YA 1: PAKIA PICHA KWENYE IMGBB
        const formData = new FormData();
        formData.append('image', imageFile);

        const imgResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const imgResult = await imgResponse.json();

        if (!imgResult.success) {
            throw new Error("Picha imekataa kupakiwa!");
        }

        const imageUrl = imgResult.data.url;

        // HATUA YA 2: TUMA DATA KWENYE GOOGLE SHEETS
        status.innerText = "Picha tayari! Inahifadhi kwenye Excel...";

        const productData = {
            name: document.getElementById('p-name').value,
            price: document.getElementById('p-price').value,
            category: document.getElementById('p-category').value,
            imageUrl: imageUrl,
            description: document.getElementById('p-description').value
        };

        // Tunatuma data kama JSON string
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        // Kila kitu kimekamilika
        status.innerText = "✅ Safi sana Zephaniah! Bidhaa imewekwa Live!";
        status.style.color = "#81c784";

        // Safisha fomu
        document.getElementById('productForm').reset();

    } catch (err) {
        console.error(err);
        status.innerText = "❌ Tatizo: " + err.message;
        status.style.color = "#ff5252";
    } finally {
        btn.disabled = false;
        btn.innerText = "HIFADHI MTANDAONI";
    }
};
// 1. WEKA SECURITY KEY YAKO HAPA (Hii ndio utaitumia ukitaka kubadili password)
const MASTER_SECURITY_KEY = "Zepox2026";

// 2. ANGALIA KAMA KUNA PASSWORD KWENYE MEMORY, KAMA HAMNA WEKA 2026 KAMA DEFAULT
if (!localStorage.getItem('adminPassword')) {
    localStorage.setItem('adminPassword', '2026');
}

function checkPass() {
    const passInput = document.getElementById('admin-pass').value;
    const currentPass = localStorage.getItem('adminPassword');

    if (passInput === currentPass) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-form').classList.remove('hidden');
    } else {
        alert("Namba ya siri si sahihi!");
    }
}

// 3. ONYESHA SEHEMU YA RESET
function showReset() {
    document.getElementById('reset-section').classList.toggle('hidden');
}

// 4. BADILISHA PASSWORD
function resetPassword() {
    const inputKey = document.getElementById('security-key').value;
    const newPass = document.getElementById('new-pass').value;

    if (inputKey === MASTER_SECURITY_KEY) {
        if (newPass.length < 4) {
            alert("Password mpya iwe na angalau herufi 4!");
            return;
        }
        localStorage.setItem('adminPassword', newPass);
        alert("✅ Hongera! Password imebadilishwa. Tumia password mpya kuingia.");
        location.reload(); // Refresh ukurasa
    } else {
        alert("❌ Security Key si sahihi! Huwezi kubadili password.");
    }
}
// 1. KAZI YA KUPAKIA BIDHAA KWENYE ADMIN PANEL
async function loadAdminProducts() {
    const listDiv = document.getElementById('admin-product-list');
    listDiv.innerHTML = '<p>Inapakia bidhaa kutoka Excel...</p>';

    try {
        const response = await fetch(API);
        const data = await response.json();

        // MUHIMU: Tunatumia .sheet1 kwa sababu ndivyo link yako inavyosoma
        const items = data.sheet1;

        if (!items || items.length === 0) {
            listDiv.innerHTML = '<p>Duka lako halina bidhaa bado.</p>';
            return;
        }

        listDiv.innerHTML = items.map(p => `
            <div class="glass-input" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 15px;">
                <div>
                    <strong style="color: var(--accent);">${p.name}</strong>
                    <br><small>Bei: TZS ${p.price}</small>
                </div>
                <button onclick="deleteProduct(${p.id})" 
                    style="background: #ff5252; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    FUTA
                </button>
            </div>
        `).join('');
    } catch (e) {
        console.error("Error loading products:", e);
        listDiv.innerHTML = '<p style="color:red;">Imeshindwa kupakia. Hakikisha internet iko vizuri.</p>';
    }
}

// 2. KAZI YA KUFUTA BIDHAA MOJA KWA MOJA
async function deleteProduct(id) {
    if (!confirm("Je, una uhakika unataka kuondoa bidhaa hii kabisa?")) return;

    // Link ya kufuta inaongezwa namba ya ID mwishoni
    const deleteUrl = `${API}/${id}`;

    try {
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert("✅ Safi! Bidhaa imefutwa.");
            loadAdminProducts(); // Inapakia upya orodha papo hapo
        } else {
            alert("❌ Imeshindwa kufuta. Hakikisha kitufe cha DELETE kimewashwa Sheety.");
        }
    } catch (error) {
        alert("Tatizo la mtandao.");
    }
}