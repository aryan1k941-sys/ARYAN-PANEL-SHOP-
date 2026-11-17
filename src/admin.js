import { initializeApp } from "firebase/app";
    import { getDatabase, ref, set, onValue, update, push, remove, runTransaction } from "firebase/database";
    import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

    const firebaseConfig = {
  apiKey: "AIzaSyDh8_kBDSXrbHbqYwXgjYRFP0loNmbQQqM",
  authDomain: "aryan-mods-4c084.firebaseapp.com",
  databaseURL: "https://aryan-mods-4c084-default-rtdb.firebaseio.com",
  projectId: "aryan-mods-4c084",
  storageBucket: "aryan-mods-4c084.firebasestorage.app",
  messagingSenderId: "5937353287",
  appId: "1:5937353287:web:969a033d1b73af37f5d762",
  measurementId: "G-DPNSBNG8YQ"
};

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const auth = getAuth(app);

    const loader = document.getElementById('loader');
    const statusText = document.getElementById('loader-status-text');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // DYNAMIC FAST LOADER CONTROLLER
    function showSpeedLoader(text = "LOADING...") {
        statusText.innerText = text;
        loader.classList.remove('hidden');
    }
    function hideSpeedLoader() {
        loader.classList.add('hidden');
    }

    window.showToast = (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
    };

    window.togglePasswordVisibility = () => {
        const pField = document.getElementById('txt-login-pass');
        const eyeIcon = document.getElementById('trigger-eye-btn');
        if(pField.type === "password") {
            pField.type = "text";
            eyeIcon.className = "fas fa-eye-slash toggle-eye";
        } else {
            pField.type = "password";
            eyeIcon.className = "fas fa-eye toggle-eye";
        }
    };

    // SPEED LOADING INITIALIZATION SCRIPT
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('user-display-email').innerText = user.email;
            document.getElementById('block-auth-screen').classList.add('hidden');
            document.getElementById('block-workspace').classList.remove('hidden');
            initializeDashboardSync();
        } else {
            document.getElementById('block-workspace').classList.add('hidden');
            document.getElementById('block-auth-screen').classList.remove('hidden');
        }
        hideSpeedLoader();
    });

    document.getElementById('btn-submit-auth').onclick = async () => {
        const email = document.getElementById('txt-login-email').value.trim();
        const pass = document.getElementById('txt-login-pass').value.trim();
        if(!email || !pass) return showToast("Please enter Gmail and Password!", "error");
        
        showSpeedLoader("VERIFYING CREDENTIALS...");
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            showToast("Firebase Authentication Successful!");
        } catch(err) {
            showToast("Incorrect Gmail or Password!", "error");
            hideSpeedLoader();
        }
    };

    const apiBaseEl = document.getElementById('aryan-api-base');
    if (apiBaseEl) {
      onValue(ref(db, 'site_settings/public_api'), snap => { const d=snap.val()||{}; document.getElementById('aryan-api-base').value=d.baseUrl||''; document.getElementById('aryan-api-docs').value=d.docsUrl||''; document.getElementById('aryan-channel-url').value=d.channelUrl||''; });
      document.getElementById('aryan-api-save').onclick = async () => { const baseUrl=document.getElementById('aryan-api-base').value.trim().replace(/\/$/,''); const docsUrl=document.getElementById('aryan-api-docs').value.trim(); const channelUrl=document.getElementById('aryan-channel-url').value.trim(); if(baseUrl && !/^https:\/\//i.test(baseUrl)) return showToast('API URL must use HTTPS','error'); try { await set(ref(db,'site_settings/public_api'),{baseUrl,docsUrl,channelUrl,updatedAt:Date.now()}); showToast('Public API settings saved'); } catch(e) { showToast('Save failed','error'); } };
    }

    window.triggerAdminLogout = async () => {
        if(confirm("Exit securely and terminate session?")) {
            showSpeedLoader("TERMINATING SESSION...");
            try { await signOut(auth); showToast("Session disconnected."); } catch (e) { } finally { hideSpeedLoader(); }
        }
    };

    function toggleSidebar() { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); }
    document.getElementById('menu-toggle').onclick = toggleSidebar;
    document.getElementById('sidebar-close').onclick = toggleSidebar;
    overlay.onclick = toggleSidebar;

    window.switchTab = (tabName) => {
        // Public API settings ka form Links section ke andar hai; purana menu ID alag tha.
        const resolvedTab = tabName === 'PublicAPISettings' ? 'Links' : tabName;
        const targetView = document.getElementById(`view-${resolvedTab}`);
        if (!targetView) {
            showToast('Ye section abhi available nahi hai: ' + tabName, 'error');
            return;
        }
        document.querySelectorAll('.tab-view-section').forEach(view => view.classList.add('hidden'));
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active-menu'));
        targetView.classList.remove('hidden');
        const targetMenu = document.getElementById(`menu-${resolvedTab}`) || document.getElementById(`menu-${tabName}`);
        if (targetMenu) targetMenu.classList.add('active-menu');
        if (sidebar.classList.contains('active')) toggleSidebar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function initializeDashboardSync() {
        onValue(ref(db, 'users'), (snapshot) => {
            adminUsersCache = snapshot.exists() ? snapshot.val() : {};
            renderOrders();
            renderDeposits();
            const credsTable = document.getElementById('admin-credentials-table');
            if(!snapshot.exists()) {
                credsTable.innerHTML = `<tr><td colspan="5" style="text-align:center;">No Accounts Found</td></tr>`;
                document.getElementById('lbl-total-users').innerText = 0;
                return;
            }
            let totalUsers = 0; let totalKeys = 0;
            credsTable.innerHTML = '';

            snapshot.forEach((child) => {
                totalUsers++;
                const uid = child.key; const uData = child.val();
                if(uData.generatedKeys) totalKeys += Object.keys(uData.generatedKeys).length;
                const isBanned = uData.banned === true;
                const isReseller = uData.role === "Reseller";
                const isOff = uData.status === "OFF";
                const currentBalance = parseFloat(uData.balance || 0).toFixed(2);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="ro-text" style="color:#fff; font-weight:700;">@${uData.username || 'N/A'}</span><div><span class="badge-bal">${uData.role === "Reseller" ? "RESELLER" : "USER"}</span></div></td>
                    <td><span class="ro-text">${uData.password || 'N/A'}</span></td>
                    <td><span class="ro-text" style="font-size:11px;">${uData.email || 'N/A'}</span></td>
                    <td>
                        <div class="bal-wrap">
                            <div class="bal-top"><span class="badge-bal">₹${currentBalance}</span></div>
                            <div class="bal-input-row">
                                <input type="number" id="amt-${uid}" placeholder="Amount" min="0">
                                <button class="action-btn add" title="Add balance" onclick="injectBalance('${uid}')"><i class="fas fa-plus"></i> Add</button>
                                <button class="action-btn remove" title="Remove balance" onclick="removeBalance('${uid}')"><i class="fas fa-minus"></i> Remove</button>
                            </div>
                        </div>
                    </td>
                    <td>
                        <button class="action-btn ${isOff ? 'toggle-off' : 'toggle-on'}" onclick="toggleUserStatus('${uid}', '${uData.status || 'ON'}')">
                            <i class="fas ${isOff ? 'fa-toggle-off' : 'fa-toggle-on'}"></i> ${isOff ? 'OFF' : 'ON'}
                        </button>
                        <button class="action-btn ${isBanned ? 'unban' : 'ban'}" onclick="toggleBanUser('${uid}', ${isBanned})">${isBanned ? 'Unban' : 'Ban'}</button>
                        <button class="action-btn ${isReseller ? 'ban' : 'add'}" title="${isReseller ? 'Reseller remove karo' : 'Reseller banao'}" onclick="toggleResellerRole('${uid}', ${isReseller})"><i class="fas fa-user-tag"></i> ${isReseller ? 'Remove Reseller' : 'Make Reseller'}</button>
                        <button class="action-btn delete" onclick="deleteResellerUser('${uid}', '${uData.username}')"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                credsTable.appendChild(tr);
            });
            document.getElementById('lbl-total-users').innerText = totalUsers;
            document.getElementById('lbl-total-keys').innerText = totalKeys;
        });

        onValue(ref(db, 'store_management'), (snapshot) => {
            adminMgmt = snapshot.exists() ? snapshot.val() : {};
            rebuildAdminProducts();
        });
        onValue(ref(db, 'store_products'), (snapshot) => {
            adminMeta = snapshot.exists() ? snapshot.val() : {};
            rebuildAdminProducts();
        });
        onValue(ref(db, 'key_stock'), (snapshot) => {
            adminStock = snapshot.exists() ? snapshot.val() : {};
            renderStockList();
        });
        onValue(ref(db, 'site_settings/maintenance'), (snapshot) => {
            adminSiteMaint = snapshot.exists() ? snapshot.val() : {};
            renderMaintenance(true);
        });
        onValue(ref(db, 'product_maintenance'), (snapshot) => {
            adminProductMaint = snapshot.exists() ? snapshot.val() : {};
            renderMaintenance(false);
        });
        initAutoPaymentAdmin();
    }

    function initAutoPaymentAdmin() {
        const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        onValue(ref(db, 'auto_payment_settings'), (snap) => {
            if (!snap.exists()) return;
            const d = snap.val();
            document.getElementById('ap-enabled').checked = !!d.enabled;
            document.getElementById('ap-api-key').value = d.apiKey || '';
            document.getElementById('ap-site-url').value = d.siteUrl || '';
            document.getElementById('ap-min').value = d.minAmount || 1;
            document.getElementById('ap-max').value = d.maxAmount || 50000;
        });
        onValue(ref(db, 'auto_payments'), (snap) => {
            const box = document.getElementById('ap-log-list');
            if (!snap.exists()) { box.innerHTML = '<div style="color:var(--text-muted);font-size:12px;">No auto payments yet.</div>'; return; }
            const rows = Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 25);
            box.innerHTML = rows.map(r => `
                <div class="ap-log">
                    <div><b>${esc(r.username || r.uid)}</b> • ₹${Number(r.amount || 0).toFixed(2)}<small>${esc(r.id)} • ${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}${r.reference ? ' • UTR ' + esc(r.reference) : ''}</small></div>
                    <span class="ap-pill ${esc(r.status || 'pending')}">${esc(r.status || 'pending')}</span>
                </div>`).join('');
        });
        const LK_KEYS = ['announcement', 'howToBuyUrl', 'howToDepositUrl', 'donateUrl', 'joinUrl', 'telegramUrl', 'safetyBalance', 'refTarget', 'binanceText', 'bkashText'];
        onValue(ref(db, 'site_settings/links'), (snap) => {
            const d = snap.exists() ? snap.val() : {};
            LK_KEYS.forEach(k => { const e = document.getElementById('lk-' + k); if (e) e.value = d[k] != null ? d[k] : ''; });
        });
        ['howToBuyUrl', 'howToDepositUrl', 'donateUrl', 'joinUrl', 'telegramUrl'].forEach(k => {
            const inp = document.getElementById('lk-' + k); if (!inp) return;
            const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-cyan'; b.style.cssText = 'margin-top:6px;padding:6px 12px;font-size:12px;';
            b.innerHTML = '<i class="fas fa-up-right-from-square"></i> Test link'; b.onclick = () => inp.value.trim() ? window.open(inp.value.trim(), '_blank') : showToast('Pehle link daalo', 'error');
            inp.parentNode.appendChild(b);
        });
        document.getElementById('btn-save-links').onclick = async () => {
            const o = { updatedAt: Date.now() };
            LK_KEYS.forEach(k => { o[k] = document.getElementById('lk-' + k).value.trim(); });
            for (const k of ['howToBuyUrl', 'howToDepositUrl', 'donateUrl', 'joinUrl', 'telegramUrl']) if (o[k] && !/^https?:\/\//i.test(o[k])) return showToast(k + ' https:// se start hona chahiye', 'error');
            try { await set(ref(db, 'site_settings/links'), o); showToast('Links saved!'); } catch (e) { showToast('Save failed!', 'error'); }
        };
        onValue(ref(db, 'site_settings/reseller_upgrade'), (snap) => {
            const d = snap.exists() ? snap.val() : {};
            document.getElementById('rs-enabled').checked = !!d.enabled;
            document.getElementById('rs-min').value = d.minBalance != null ? d.minBalance : 10;
            document.getElementById('rs-pct').value = d.commissionPct != null ? d.commissionPct : 1;
        });
        document.getElementById('btn-save-rs').onclick = async () => {
            const minBalance = Number(document.getElementById('rs-min').value);
            if (!(minBalance >= 0)) return showToast('Sahi amount daalo', 'error');
            try { await set(ref(db, 'site_settings/reseller_upgrade'), { enabled: document.getElementById('rs-enabled').checked, minBalance, commissionPct: Number(document.getElementById('rs-pct').value) || 0, updatedAt: Date.now() }); showToast('Reseller setting saved!'); }
            catch (e) { showToast('Save failed!', 'error'); }
        };
        onValue(ref(db, 'tickets'), (snap) => {
            const box = document.getElementById('tk-admin-list'); if (!box) return;
            const list = Object.entries(snap.val() || {}).sort((a, b) => b[1].createdAt - a[1].createdAt);
            box.innerHTML = list.length ? list.map(([id, t]) => `<div style="border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;margin-bottom:10px;"><div style="display:flex;justify-content:space-between;gap:8px;"><b>@${escA(t.username)} · ${escA(t.subject)}</b><span style="font-size:12px;color:${t.status === 'answered' ? '#22c55e' : '#f59e0b'};">${t.status === 'answered' ? 'ANSWERED' : 'OPEN'}</span></div><p style="margin:6px 0;opacity:.8;font-size:13px;">${escA(t.message)}</p><div class="input-group"><input type="text" id="rp-${escA(id)}" value="${escA(t.reply || '')}" placeholder="Reply likho"></div><button class="btn btn-cyan" onclick="replyTicket('${escA(id)}')"><i class="fas fa-reply"></i> Reply</button></div>`).join('') : '<p style="opacity:.6;">Koi ticket nahi.</p>';
        });
        window.replyTicket = async (id) => {
            const reply = document.getElementById('rp-' + id).value.trim();
            if (!reply) return showToast('Reply likho', 'error');
            try { await update(ref(db, `tickets/${id}`), { reply, status: 'answered', repliedAt: Date.now() }); showToast('Reply bhej diya!'); }
            catch (e) { showToast('Failed!', 'error'); }
        };
        // Supplier (bantibhaya.t) ki API pehle se saved: pehli baar apne aap set + enable ho jayegi
        const SUP_DEFAULT = { apiKey: '', masterKey: '' };
        // Supplier credentials must be stored in a server-side secret vault, never in public RTDB.
        document.getElementById('btn-save-sup').onclick = async () => {
            showToast('Supplier secret save is disabled in HTML. Configure credentials in the secure backend environment.', 'error');
        };
        // FamGateway secrets are sent only to the authenticated admin backend.
        const fgBase = document.getElementById('fg-base-url');
        document.getElementById('fg-key-eye').onclick = () => { const i=document.getElementById('fg-api-key'); i.type=i.type==='password'?'text':'password'; };
        document.getElementById('btn-save-famgateway').onclick = async () => {
            const user = auth.currentUser; if (!user) return showToast('Admin login required', 'error');
            const baseUrl = fgBase.value.trim().replace(/\/$/, '');
            const apiKey = document.getElementById('fg-api-key').value.trim();
            const webhookUrl = document.getElementById('fg-webhook-url').value.trim();
            const minAmount = Number(document.getElementById('fg-min').value), maxAmount = Number(document.getElementById('fg-max').value);
            if (!/^https:\/\/famgateway\.in$/i.test(baseUrl)) return showToast('FamGateway URL https://famgateway.in hi hona chahiye', 'error');
            if (apiKey.length < 12) return showToast('Valid FamGateway API Key daalo', 'error');
            if (webhookUrl && !/^https:\/\//i.test(webhookUrl)) return showToast('Webhook URL HTTPS hona chahiye', 'error');
            if (!(minAmount >= 1 && maxAmount > minAmount)) return showToast('Min/Max amount sahi daalo', 'error');
            try {
                const token = await user.getIdToken();
                const apiRoot = document.getElementById('fg-backend-url').value.trim().replace(/\/$/, '');
                if (!apiRoot) throw new Error('window.ARYAN_API_URL backend URL configure nahi hai');
                const resp = await fetch(apiRoot + '/api/admin/gateways/famgateway', { method:'PUT', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify({enabled:document.getElementById('fg-enabled').checked,baseUrl,apiKey,webhookUrl,minAmount,maxAmount}) });
                const data = await resp.json().catch(()=>({})); if (!resp.ok) throw new Error(data.error || 'Backend save failed');
                document.getElementById('fg-api-key').value=''; document.getElementById('fg-config-status').textContent='FamGateway config saved on secure backend · '+new Date().toLocaleString();
                showToast('FamGateway API settings securely saved!');
            } catch(e) { showToast(e.message || 'Save failed', 'error'); }
        };

        document.getElementById('ap-key-eye').onclick = () => {
            const i = document.getElementById('ap-api-key');
            i.type = i.type === 'password' ? 'text' : 'password';
        };
        document.getElementById('btn-save-autopay').onclick = async () => {
            const enabled = document.getElementById('ap-enabled').checked;
            const apiUrl = 'https://famgatewy.i';
            const apiKey = document.getElementById('ap-api-key').value.trim();
            const siteUrl = document.getElementById('ap-site-url').value.trim();
            const minAmount = parseFloat(document.getElementById('ap-min').value) || 1;
            const maxAmount = parseFloat(document.getElementById('ap-max').value) || 50000;
            if (siteUrl && !/^https?:\/\//i.test(siteUrl)) return showToast("Site URL https:// se start hona chahiye", "error");
            if (!apiKey) return showToast("API Key required hai!", "error");
            if (minAmount < 1 || maxAmount <= minAmount) return showToast("Min / Max amount sahi daalo (Min 1)", "error");
            try {
                await set(ref(db, 'auto_payment_settings'), { enabled, apiUrl, apiKey, siteUrl, minAmount, maxAmount, updatedAt: Date.now() });
                showToast("Payment Setting saved!");
            } catch (e) { showToast("Save failed!", "error"); }
        };
    }

    /* ===================== PRODUCT MANAGER (Add + Edit) ===================== */
    let adminMgmt = {};
    let adminMeta = {};
    let adminProductsCache = {};
    let adminStock = {};
    let adminSiteMaint = {};
    let adminProductMaint = {};
    let npImageData = '';
    const pendingImg = {};
    const ADMIN_TAGS = ['ANDROID', 'ANDROID NON ROOT', 'PC', 'IOS'];

    function escA(t) { return String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function pSlug(t) { return String(t || '').trim().replace(/[^a-zA-Z0-9]/g, '_'); }
    function tagBoxHTML(selected = []) {
        return ADMIN_TAGS.map(t => `<label class="tag-chk"><input type="checkbox" value="${escA(t)}" ${selected.includes(t) ? 'checked' : ''}> ${escA(t)}</label>`).join('');
    }
    function readTagBox(box) { return [...box.querySelectorAll('input:checked')].map(i => i.value); }
    function planRowsHTML(plans) {
        return plans.map(p => `<div class="plan-row" data-pk="${escA(p.pk || '')}">
            <input type="text" class="pl-days" placeholder="Duration e.g. 7 Days" value="${escA(p.days)}">
            <input type="number" class="pl-price" placeholder="User ₹" step="0.01" min="0" value="${p.price === '' || p.price === undefined || isNaN(p.price) ? '' : p.price}">
            <input type="number" class="pl-rprice" placeholder="Reseller ₹" step="0.01" min="0" value="${p.rprice === '' || p.rprice === undefined || p.rprice === null || isNaN(p.rprice) ? '' : p.rprice}">
            <button type="button" class="pl-del" onclick="this.closest('.plan-row').remove()"><i class="fas fa-trash"></i></button>
        </div>`).join('');
    }
    function readPlans(box) {
        return [...box.querySelectorAll('.plan-row')].map(r => ({
            pk: r.dataset.pk || '',
            days: r.querySelector('.pl-days').value.trim(),
            price: parseFloat(r.querySelector('.pl-price').value),
            rprice: parseFloat(r.querySelector('.pl-rprice').value)
        })).filter(p => p.days || !isNaN(p.price));
    }
    function hasDupDays(plans) {
        const seen = new Set();
        for (const p of plans) {
            const k = p.days.toLowerCase();
            if (seen.has(k)) return true;
            seen.add(k);
        }
        return false;
    }
    function compressImage(file) {
        return new Promise((res, rej) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                const s = Math.min(1, 700 / Math.max(img.width, img.height));
                const c = document.createElement('canvas');
                c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                URL.revokeObjectURL(url);
                res(c.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
            img.src = url;
        });
    }

    // Create-form setup (premium)
    document.getElementById('np-tags').innerHTML = tagBoxHTML();
    document.getElementById('np-plans').innerHTML = planRowsHTML([{ days: '', price: '' }]);

    function updatePreview() {
        const name = document.getElementById('prod-name').value.trim();
        const tags = readTagBox(document.getElementById('np-tags'));
        const plans = readPlans(document.getElementById('np-plans')).filter(p => p.days && !isNaN(p.price));
        const img = npImageData || document.getElementById('prod-image-url').value.trim();
        document.getElementById('pv-name').innerText = name || 'PRODUCT NAME';
        document.getElementById('pv-tags').innerHTML = tags.length
            ? tags.map(t => `<span class="pv-tag"><i class="fas fa-tag"></i>${escA(t)}</span>`).join('')
            : '<span class="pv-hint">Categories select karo</span>';
        document.getElementById('pv-img').innerHTML = img
            ? `<img src="${escA(img)}" alt="" onerror="this.parentNode.innerHTML='<div class=&quot;pv-ph&quot;><i class=&quot;fas fa-image&quot;></i></div>'">`
            : `<div class="pv-ph"><i class="fas fa-image"></i></div>`;
        document.getElementById('pv-count').innerText = `${plans.length} durations available`;
        document.getElementById('pv-from').innerText = plans.length ? `₹${Math.min(...plans.map(p => p.price)).toFixed(2)}` : '₹0.00';
    }

    function showPhoto(dataUrl) {
        npImageData = dataUrl;
        const pv = document.getElementById('prod-img-preview');
        pv.src = dataUrl; pv.classList.remove('hidden');
        document.getElementById('drop-empty').classList.add('hidden');
        document.getElementById('prod-img-remove').classList.remove('hidden');
        updatePreview();
    }
    function clearPhoto() {
        npImageData = '';
        document.getElementById('prod-img-preview').classList.add('hidden');
        document.getElementById('prod-img-preview').removeAttribute('src');
        document.getElementById('drop-empty').classList.remove('hidden');
        document.getElementById('prod-img-remove').classList.add('hidden');
        document.getElementById('prod-image-file').value = '';
        updatePreview();
    }
    async function handlePhotoFile(file) {
        if (!file || !file.type.startsWith('image/')) return showToast("Sirf image file select karo", "error");
        try { showPhoto(await compressImage(file)); showToast("Photo ready!"); }
        catch (err) { showToast("Photo load nahi hui", "error"); }
    }

    document.getElementById('prod-image-file').onchange = (e) => handlePhotoFile(e.target.files[0]);
    document.getElementById('prod-img-remove').onclick = (e) => { e.preventDefault(); clearPhoto(); };
    const dz = document.getElementById('drop-zone');
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
    dz.addEventListener('drop', (e) => handlePhotoFile(e.dataTransfer.files[0]));

    document.getElementById('prod-name').addEventListener('input', updatePreview);
    document.getElementById('prod-image-url').addEventListener('input', updatePreview);
    document.getElementById('np-tags').addEventListener('change', updatePreview);
    document.getElementById('np-plans').addEventListener('input', updatePreview);
    document.getElementById('np-plans').addEventListener('click', () => setTimeout(updatePreview, 0));
    document.getElementById('np-add-plan').onclick = () => {
        document.getElementById('np-plans').insertAdjacentHTML('beforeend', planRowsHTML([{ days: '', price: '' }]));
        updatePreview();
    };
    updatePreview();

    function resetCreateForm() {
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-pid').value = '';
        document.getElementById('prod-image-url').value = '';
        document.getElementById('prod-download').value = '';
        clearPhoto();
        document.getElementById('np-tags').innerHTML = tagBoxHTML();
        document.getElementById('np-plans').innerHTML = planRowsHTML([{ days: '', price: '' }]);
        updatePreview();
    }

    async function saveProductTo(oldKey, data) {
        const key = pSlug(data.name);
        const plansObj = {};
        const used = new Set();
        data.plans.forEach((p, i) => {
            let pk = p.pk;
            if (!pk || used.has(pk)) pk = `p${Date.now().toString(36)}${i}_${pSlug(p.days)}`;
            used.add(pk);
            plansObj[pk] = { productName: data.name, daysPlan: p.days, priceRate: p.price, resellerPrice: p.rprice };
        });
        await set(ref(db, `store_management/${key}`), plansObj);
        await set(ref(db, `store_products/${key}`), {
            name: data.name,
            pid: String(data.pid || ''),
            tags: data.tags,
            imageUrl: data.imageUrl || '',
            downloadUrl: data.downloadUrl || '',
            supplierPid: data.supplierPid || '',
            game: data.game || '',
            features: data.features || '',
            videoUrl: data.videoUrl || '',
            badge: data.badge || ''
        });
        if (oldKey && oldKey !== key) {
            if (adminStock && adminStock[oldKey]) {
                await set(ref(db, `key_stock/${key}`), adminStock[oldKey]);
                await remove(ref(db, `key_stock/${oldKey}`));
            }
            await remove(ref(db, `store_management/${oldKey}`));
            await remove(ref(db, `store_products/${oldKey}`));
        }
    }

    document.getElementById('btn-add-product').onclick = async () => {
        const name = document.getElementById('prod-name').value.trim();
        const pid = document.getElementById('prod-pid').value.trim();
        const image = npImageData || document.getElementById('prod-image-url').value.trim();
        const downloadUrl = document.getElementById('prod-download').value.trim();
        const supplierPid = document.getElementById('prod-supplier-pid').value.trim();
        const game = document.getElementById('prod-game').value.trim();
        const features = document.getElementById('prod-features').value.trim();
        const videoUrl = document.getElementById('prod-video').value.trim();
        const badge = document.getElementById('prod-badge').value;
        const tags = readTagBox(document.getElementById('np-tags'));
        const plans = readPlans(document.getElementById('np-plans'));

        if (!name) return showToast("Product title daalo!", "error");
        if (!pid) return showToast("ARYAN PID ID daalo!", "error");
        if (Object.entries(adminProductsCache || {}).some(([k,v]) => String(v.pid || '') === pid && k !== pSlug(name))) return showToast("Ye ARYAN PID pehle se use ho raha hai", "error");
        if (!plans.length || plans.some(p => !p.days || isNaN(p.price) || isNaN(p.rprice))) return showToast("Har plan me duration aur price bharo", "error");
        if (hasDupDays(plans)) return showToast("Do duration ka naam same nahi ho sakta", "error");
        if (adminProductsCache[pSlug(name)]) return showToast("Ye product already hai, Edit section me edit karo", "error");

        showSpeedLoader("DEPLOYING ASSETS...");
        try {
            await saveProductTo(null, { name, pid, tags, imageUrl: image, downloadUrl, supplierPid, game, features, videoUrl, badge, plans });
            showToast("Live product deployed!");
            resetCreateForm();
            document.getElementById('edit-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            showToast("Database deployment error", "error");
        } finally {
            hideSpeedLoader();
        }
    };

    function rebuildAdminProducts() {
        const out = {};
        let totalPlans = 0;
        Object.keys(adminMgmt || {}).forEach(k => {
            const plansObj = adminMgmt[k] || {};
            const meta = (adminMeta && adminMeta[k]) || {};
            const first = Object.values(plansObj)[0] || {};
            const plans = Object.keys(plansObj).map(pk => ({
                pk: pk,
                days: plansObj[pk].daysPlan || pk,
                pk: pk,
                price: parseFloat(plansObj[pk].priceRate || 0),
                rprice: parseFloat(plansObj[pk].resellerPrice || 0)
            }));
            totalPlans += plans.length;
            out[k] = {
                name: meta.name || first.productName || k,
                pid: String(meta.pid || ''),
                tags: Array.isArray(meta.tags) ? meta.tags : Object.keys(meta.tags || {}),
                imageUrl: meta.imageUrl || '',
                downloadUrl: meta.downloadUrl || '',
                supplierPid: meta.supplierPid || '',
                game: meta.game || '',
                features: meta.features || '',
                videoUrl: meta.videoUrl || '',
                badge: meta.badge || '',
                plans
            };
        });
        adminProductsCache = out;
        document.getElementById('lbl-total-prods').innerText = totalPlans;
        renderAdminProducts();
        refreshStockSelects();
        renderStockList();
        renderMaintenance(false);
    }

    /* ===== TOTAL ORDERS ===== */
    let adminUsersCache = {};
    let ordSearch = '', ordProduct = 'ALL', depFilter = 'ALL';
    const txTime = (t) => t.ts || Date.parse(t.date) || 0;
    const fmtTime = (ms) => ms ? new Date(ms).toLocaleString() : '—';
    const isToday = (ms) => !!ms && new Date(ms).toDateString() === new Date().toDateString();
    const money = (n) => '₹' + (Number(n) || 0).toFixed(2);

    function collectOrders() {
        const out = [];
        Object.entries(adminUsersCache).forEach(([uid, u]) => {
            Object.entries(u.generatedKeys || {}).forEach(([id, k]) => {
                if (k && k.source === 'stock') out.push({ uid, username: u.username || 'N/A', id, ...k });
            });
        });
        return out.sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0));
    }

    function renderOrders() {
        const box = document.getElementById('ord-list');
        if (!box) return;
        const all = collectOrders();
        const prods = [...new Set(all.map(o => o.product).filter(Boolean))].sort();
        const sel = document.getElementById('ord-product');
        if (sel.dataset.built !== prods.join('|')) {
            const prev = sel.value;
            sel.innerHTML = '<option value="ALL">All products</option>' + prods.map(p => `<option value="${escA(p)}">${escA(p)}</option>`).join('');
            sel.value = (prev === 'ALL' || prods.includes(prev)) ? prev : 'ALL';
            sel.dataset.built = prods.join('|');
        }
        ordProduct = sel.value;
        const rev = all.reduce((t, o) => t + (Number(o.price) || 0), 0);
        document.getElementById('ord-total').innerText = all.length;
        document.getElementById('ord-rev').innerText = money(rev);
        document.getElementById('ord-buyers').innerText = new Set(all.map(o => o.uid)).size;
        document.getElementById('ord-today').innerText = all.filter(o => isToday(Date.parse(o.timestamp))).length;

        const q = ordSearch.trim().toLowerCase();
        const list = all.filter(o => (ordProduct === 'ALL' || o.product === ordProduct) &&
            (!q || [o.username, o.product, o.keyCode].some(v => String(v || '').toLowerCase().includes(q))));
        if (!list.length) {
            box.innerHTML = `<div class="tx-empty">${all.length ? 'Koi order match nahi hua' : 'Abhi tak koi order nahi hai'}</div>`;
            return;
        }
        box.innerHTML = list.slice(0, 300).map(o => `
            <div class="tx-item">
                <div class="tx-accent in"></div>
                <div>
                    <div class="tx-main-t">${escA(o.product)}</div>
                    <div class="tx-main-s">
                        <span><i class="fas fa-user"></i>@${escA(o.username)}</span>
                        <span><i class="fas fa-clock"></i>${escA(o.duration || '')}</span>
                        <span><i class="fas fa-calendar"></i>${fmtTime(Date.parse(o.timestamp))}</span>
                    </div>
                    <div class="tx-key">${escA(o.keyCode)} <button class="tx-copy" data-k="${escA(o.keyCode)}" onclick="copyTxKey(this)"><i class="far fa-copy"></i></button></div>
                </div>
                <div class="tx-amt in">${o.price !== undefined ? money(o.price) : '—'}</div>
            </div>`).join('');
    }

    /* ===== DEPOSIT HISTORY ===== */
    function collectDeposits() {
        const out = [];
        Object.entries(adminUsersCache).forEach(([uid, u]) => {
            Object.entries(u.transactions || {}).forEach(([id, t]) => {
                if (t && (t.type === 'Deposit' || t.type === 'AdminDebit')) out.push({ uid, username: u.username || 'N/A', id, ...t });
            });
        });
        return out.sort((a, b) => txTime(b) - txTime(a));
    }
    const depKind = (t) => t.type === 'AdminDebit' ? 'removed' : (t.source === 'admin' ? 'admin' : 'gateway');
    const depLabel = { gateway: 'Gateway', admin: 'Admin Add', removed: 'Removed' };

    function renderDeposits() {
        const box = document.getElementById('dep-list');
        if (!box) return;
        const all = collectDeposits();
        const ins = all.filter(t => t.type === 'Deposit');
        const outs = all.filter(t => t.type === 'AdminDebit');
        document.getElementById('dep-total').innerText = all.length;
        document.getElementById('dep-in').innerText = money(ins.reduce((t, x) => t + (Number(x.amount) || 0), 0));
        document.getElementById('dep-out').innerText = money(outs.reduce((t, x) => t + (Number(x.amount) || 0), 0));
        document.getElementById('dep-today').innerText = all.filter(t => isToday(txTime(t))).length;
        document.querySelectorAll('#dep-chips .tx-chip').forEach(c => c.classList.toggle('active', c.dataset.f === depFilter));

        const list = all.filter(t => depFilter === 'ALL' || depKind(t) === depFilter);
        if (!list.length) {
            box.innerHTML = `<div class="tx-empty">${all.length ? 'Is filter me koi entry nahi' : 'Abhi tak koi deposit history nahi hai'}</div>`;
            return;
        }
        box.innerHTML = list.slice(0, 300).map(t => {
            const kind = depKind(t);
            const isOut = t.type === 'AdminDebit';
            return `
            <div class="tx-item">
                <div class="tx-accent ${isOut ? 'out' : 'in'}"></div>
                <div>
                    <div class="tx-main-t">@${escA(t.username)}</div>
                    <div class="tx-main-s">
                        <span class="tx-kind ${kind}">${depLabel[kind]}</span>
                        <span><i class="fas fa-comment-alt"></i>${escA(t.description || '')}</span>
                        <span><i class="fas fa-calendar"></i>${escA(t.date || fmtTime(txTime(t)))}</span>
                    </div>
                </div>
                <div class="tx-amt ${isOut ? 'out' : 'in'}">${isOut ? '−' : '+'}${money(t.amount)}</div>
            </div>`;
        }).join('');
    }

    window.setDepFilter = (f) => { depFilter = f; renderDeposits(); };
    window.copyTxKey = (btn) => {
        navigator.clipboard.writeText(btn.dataset.k)
            .then(() => showToast('Key copied'))
            .catch(() => showToast('Copy failed', 'error'));
    };
    document.getElementById('btn-export-orders')?.addEventListener('click', () => {
        const rows = collectOrders();
        const cols = ['username','uid','product','duration','price','keyCode','timestamp'];
        const quote = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        const csv = [cols.join(','), ...rows.map(r => cols.map(c => quote(r[c])).join(','))].join('\r\n');
        const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = `aryan-orders-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        showToast(`Exported ${rows.length} orders`);
    });
    document.getElementById('ord-search').addEventListener('input', (e) => { ordSearch = e.target.value; renderOrders(); });
    document.getElementById('ord-product').addEventListener('change', renderOrders);

    /* ===== MAINTENANCE MODE ===== */
    function renderMaintenance(syncGlobalInputs) {
        const on = !!adminSiteMaint.enabled;
        const pill = document.getElementById('mt-status-pill');
        if (pill) {
            pill.className = 'mt-pill ' + (on ? 'down' : 'live');
            pill.innerHTML = on ? '<span></span><b>SITE DOWN</b>' : '<span></span><b>LIVE</b>';
        }
        if (syncGlobalInputs) {
            document.getElementById('mt-site-on').checked = on;
            document.getElementById('mt-site-msg').value = adminSiteMaint.message || '';
        }
        const box = document.getElementById('mt-product-list');
        if (!box) return;
        const keys = Object.keys(adminProductsCache);
        if (!keys.length) { box.innerHTML = '<div class="ks-none">Pehle Add Product se product banao</div>'; return; }
        box.innerHTML = keys.map(k => {
            const m = !!adminProductMaint[k];
            return `<div class="ks-row">
                <div>
                    <div class="ks-row-name">${escA(adminProductsCache[k].name)}</div>
                    <div class="ks-row-plan">${m ? 'Buy: Maintenance · Download: hidden' : 'Live on Buy Keys'}</div>
                </div>
                <div class="ks-row-right">
                    <span class="ks-badge ${m ? 'empty' : 'ok'}">${m ? 'Maintenance' : 'Live'}</span>
                    <label class="ap-switch"><input type="checkbox" ${m ? 'checked' : ''} onchange="toggleProductMaint('${escA(k)}', this.checked)"><span class="ap-slider"></span></label>
                </div>
            </div>`;
        }).join('');
    }

    window.toggleProductMaint = async (key, on) => {
        try {
            if (on) await set(ref(db, `product_maintenance/${key}`), true);
            else await remove(ref(db, `product_maintenance/${key}`));
            showToast(on ? 'Product maintenance me daal diya' : 'Product live kar diya');
        } catch (e) { showToast('Update failed!', 'error'); renderMaintenance(false); }
    };

    document.getElementById('btn-save-maint').onclick = async () => {
        const enabled = document.getElementById('mt-site-on').checked;
        const message = document.getElementById('mt-site-msg').value.trim();
        try {
            await set(ref(db, 'site_settings/maintenance'), { enabled, message, updatedAt: Date.now() });
            showToast(enabled ? 'Site maintenance ON ho gaya' : 'Site live ho gayi');
        } catch (e) { showToast('Save failed!', 'error'); }
    };

    /* ===== KEYS STOCK (real keys that resellers buy) ===== */
    function refreshStockSelects() {
        const ps = document.getElementById('ks-product');
        const pl = document.getElementById('ks-plan');
        if (!ps || !pl) return;
        const prevP = ps.value, prevPl = pl.value;
        const keys = Object.keys(adminProductsCache);
        ps.innerHTML = keys.length
            ? keys.map(k => `<option value="${escA(k)}">${escA(adminProductsCache[k].name)}</option>`).join('')
            : '<option value="">No products</option>';
        if (keys.includes(prevP)) ps.value = prevP;
        const plans = (adminProductsCache[ps.value] || { plans: [] }).plans;
        pl.innerHTML = plans.map(p => `<option value="${escA(p.pk)}">${escA(p.days)} - ₹${p.price}</option>`).join('');
        if (plans.some(p => p.pk === prevPl)) pl.value = prevPl;
    }
    document.getElementById('ks-product').addEventListener('change', refreshStockSelects);

    function renderStockList() {
        const box = document.getElementById('ks-stock-list');
        if (!box) return;
        const rows = [];
        let total = 0;
        Object.keys(adminProductsCache).forEach(k => {
            adminProductsCache[k].plans.forEach(p => {
                const cnt = Object.keys((adminStock[k] || {})[p.pk] || {}).length;
                total += cnt;
                rows.push(`<div class="ks-row">
                    <div>
                        <div class="ks-row-name">${escA(adminProductsCache[k].name)}</div>
                        <div class="ks-row-plan">${escA(p.days)}</div>
                    </div>
                    <div class="ks-row-right">
                        <span class="ks-badge ${cnt > 0 ? 'ok' : 'empty'}">${cnt > 0 ? cnt + ' in stock' : 'Empty'}</span>
                        <button class="ks-clear" onclick="clearStock('${escA(k)}','${escA(p.pk)}')"><i class="fas fa-trash"></i> Clear</button>
                    </div>
                </div>`);
            });
        });
        document.getElementById('ks-total').innerText = total;
        box.innerHTML = rows.length ? rows.join('') : '<div class="ks-none">Pehle Add Product se product banao</div>';
    }

    function updateKeysLiveCount() {
        const n = [...new Set(document.getElementById('ks-keys').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean))].length;
        document.getElementById('ks-count-live').innerText = n + (n === 1 ? ' key' : ' keys');
    }
    document.getElementById('ks-keys').addEventListener('input', updateKeysLiveCount);

    document.getElementById('btn-add-stock').onclick = async () => {
        const pk = document.getElementById('ks-product').value;
        const plan = document.getElementById('ks-plan').value;
        const box = document.getElementById('ks-keys');
        const lines = [...new Set(box.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean))];
        if (!pk || !plan) return showToast('Pehle product aur plan select karo', 'error');
        if (!lines.length) return showToast('Keys paste karo', 'error');
        const existing = Object.values((adminStock[pk] || {})[plan] || {});
        const fresh = lines.filter(k => !existing.includes(k));
        if (!fresh.length) return showToast('Ye keys already stock me hain', 'error');
        try {
            for (const k of fresh) await push(ref(db, `key_stock/${pk}/${plan}`), k);
            box.value = '';
            showToast(`${fresh.length} keys stock me add ho gayi${fresh.length < lines.length ? ` (${lines.length - fresh.length} duplicate skip)` : ''}`);
        } catch (e) { showToast('Stock add failed!', 'error'); }
    };

    window.clearStock = async (pk, plan) => {
        if (!confirm('Is plan ka saara stock delete ho jayega. Pakka?')) return;
        try { await remove(ref(db, `key_stock/${pk}/${plan}`)); showToast('Stock cleared!'); }
        catch (e) { showToast('Clear failed!', 'error'); }
    };

    function productEditCardHTML(k, p) {
        return `<div class="edit-card" data-key="${escA(k)}">
            <div class="ec-head">
                <img class="ec-thumb" src="${escA(p.imageUrl)}" onerror="this.style.visibility='hidden'" alt="">
                <div class="ec-title">${escA(p.name)}</div>
            </div>
            <label class="fl">Product Name</label>
            <input class="ec-input ec-name" value="${escA(p.name)}">
            <label class="fl">ARYAN PID ID (public product ID)</label>
            <input class="ec-input ec-aryan-pid" value="${escA(p.pid || '')}" placeholder="e.g. 151">
            <label class="fl">Photo Link (ya file upload)</label>
            <input class="ec-input ec-img" value="${escA(p.imageUrl.startsWith('data:') ? '' : p.imageUrl)}" placeholder="${p.imageUrl.startsWith('data:') ? 'Photo already uploaded' : 'https://...'}">
            <input type="file" accept="image/*" class="ec-file file-input">
            <label class="fl">Categories</label>
            <div class="tag-box">${tagBoxHTML(p.tags)}</div>
            <label class="fl">Download Link (optional)</label>
            <input class="ec-input ec-dl" value="${escA(p.downloadUrl)}" placeholder="https://...">
            <label class="fl">Supplier PID (auto key ke liye, optional)</label>
            <input class="ec-input ec-pid" value="${escA(p.supplierPid || '')}" placeholder="Supplier table wala PID">
            <label class="fl">Game</label>
            <input class="ec-input ec-game" value="${escA(p.game || '')}" placeholder="FREEFIRE / CARROM POOL / 8 BALL POOL">
            <label class="fl">Features (har line me ek)</label>
            <textarea class="ec-input ec-feat" rows="4">${escA(p.features || '')}</textarea>
            <label class="fl">Video / Feedback link</label>
            <input class="ec-input ec-video" value="${escA(p.videoUrl || '')}" placeholder="https://...">
            <label class="fl">Badge</label>
            <select class="ec-input ec-badge">${['', 'NEW', 'HOT', 'BEST SELLER'].map(v => `<option value="${v}" ${p.badge === v ? 'selected' : ''}>${v || 'Koi nahi'}</option>`).join('')}</select>
            <label class="fl">Plans</label>
            <div class="plan-head"><span>Duration</span><span>User ₹</span><span>Reseller ₹</span><span></span></div>
            <div class="plan-box">${planRowsHTML(p.plans)}</div>
            <button type="button" class="pl-add" onclick="addPlanRow(this)"><i class="fas fa-plus"></i> Add Plan</button>
            <div class="ec-actions">
                <button class="btn-save-sm" onclick="saveEditCard(this)"><i class="fas fa-save"></i> Save Product</button>
                <button class="btn-del-sm" onclick="deleteProductAll(this)"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>`;
    }

    function renderAdminProducts() {
        const box = document.getElementById('edit-product-list');
        const keys = Object.keys(adminProductsCache);
        document.getElementById('edit-count').innerText = keys.length;
        if (!keys.length) { box.innerHTML = '<div class="empty-note">No products yet</div>'; return; }
        box.innerHTML = keys.map(k => productEditCardHTML(k, adminProductsCache[k])).join('');
    }

    document.getElementById('edit-search').addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        document.querySelectorAll('#edit-product-list .edit-card').forEach(card => {
            const name = (card.querySelector('.ec-name')?.value || card.querySelector('.ec-title')?.innerText || '').toLowerCase();
            card.style.display = !q || name.includes(q) ? '' : 'none';
        });
    });

    document.getElementById('edit-product-list').addEventListener('change', async (e) => {
        if (!e.target.classList.contains('ec-file')) return;
        const card = e.target.closest('.edit-card');
        const file = e.target.files[0]; if (!file) return;
        try {
            pendingImg[card.dataset.key] = await compressImage(file);
            card.querySelector('.ec-thumb').src = pendingImg[card.dataset.key];
            card.querySelector('.ec-thumb').style.visibility = 'visible';
            showToast("Photo ready, Save karo");
        } catch (err) { showToast("Photo load nahi hui", "error"); }
    });

    window.addPlanRow = (btn) => {
        btn.closest('.edit-card').querySelector('.plan-box').insertAdjacentHTML('beforeend', planRowsHTML([{ days: '', price: '' }]));
    };

    window.saveEditCard = async (btn) => {
        const card = btn.closest('.edit-card');
        const oldKey = card.dataset.key;
        const cache = adminProductsCache[oldKey] || {};
        const name = card.querySelector('.ec-name').value.trim();
        const pid = card.querySelector('.ec-aryan-pid').value.trim();
        const urlVal = card.querySelector('.ec-img').value.trim();
        const downloadUrl = card.querySelector('.ec-dl').value.trim();
        const supplierPid = card.querySelector('.ec-pid').value.trim();
        const game = card.querySelector('.ec-game').value.trim();
        const features = card.querySelector('.ec-feat').value.trim();
        const videoUrl = card.querySelector('.ec-video').value.trim();
        const badge = card.querySelector('.ec-badge').value;
        const tags = readTagBox(card.querySelector('.tag-box'));
        const plans = readPlans(card.querySelector('.plan-box'));

        if (!name) return showToast("Product name blank nahi ho sakta!", "error");
        if (!pid) return showToast("ARYAN PID ID daalo!", "error");
        if (Object.entries(adminProductsCache || {}).some(([k,v]) => String(v.pid || '') === pid && k !== oldKey)) return showToast("Ye ARYAN PID pehle se use ho raha hai", "error");
        if (!plans.length || plans.some(p => !p.days || isNaN(p.price) || isNaN(p.rprice))) return showToast("Har plan me duration aur price bharo", "error");
        if (hasDupDays(plans)) return showToast("Do duration ka naam same nahi ho sakta", "error");
        const newKey = pSlug(name);
        if (newKey !== oldKey && adminProductsCache[newKey]) return showToast("Is naam ka product already hai", "error");

        const imageUrl = pendingImg[oldKey] || urlVal || cache.imageUrl || '';
        showSpeedLoader("SAVING...");
        try {
            await saveProductTo(oldKey, { name, pid, tags, imageUrl, downloadUrl, supplierPid, game, features, videoUrl, badge, plans });
            delete pendingImg[oldKey];
            showToast("Product updated!");
        } catch (e) {
            showToast("Save failed!", "error");
        } finally {
            hideSpeedLoader();
        }
    };

    window.deleteProductAll = async (btn) => {
        const key = btn.closest('.edit-card').dataset.key;
        if (!confirm("Ye product aur uske saare plans delete ho jayenge. Pakka?")) return;
        try {
            await remove(ref(db, `store_management/${key}`));
            await remove(ref(db, `store_products/${key}`));
            await remove(ref(db, `key_stock/${key}`));
            await remove(ref(db, `product_maintenance/${key}`));
            showToast("Product deleted!");
        } catch (e) { showToast("Delete failed!", "error"); }
    };

    window.injectBalance = async (uid) => {
        const input = document.getElementById(`amt-${uid}`);
        const amt = parseFloat(input.value);
        if (isNaN(amt) || amt <= 0) return showToast("Enter a valid balance amount!", "error");
        try {
            const r = await runTransaction(ref(db, `users/${uid}/balance`), (cur) => Math.round(((Number(cur) || 0) + amt) * 100) / 100);
            if (!r.committed) throw new Error("not committed");
            await push(ref(db, `users/${uid}/transactions`), {
                type: "Deposit", source: "admin", amount: amt,
                description: "Admin ne balance add kiya", date: new Date().toLocaleString(), ts: Date.now()
            });
            input.value = "";
            showToast(`₹${amt} add ho gaya`);
        } catch (e) { showToast("Balance insertion failed", "error"); }
    };

    window.removeBalance = async (uid) => {
        const input = document.getElementById(`amt-${uid}`);
        const amt = parseFloat(input.value);
        if (isNaN(amt) || amt <= 0) return showToast("Enter a valid balance amount!", "error");
        try {
            const r = await runTransaction(ref(db, `users/${uid}/balance`), (cur) => {
                const c = Number(cur) || 0;
                if (c < amt) return; // abort: not enough balance
                return Math.round((c - amt) * 100) / 100;
            });
            if (!r.committed) return showToast("Itna balance nahi hai remove karne ke liye", "error");
            await push(ref(db, `users/${uid}/transactions`), {
                type: "AdminDebit", source: "admin", amount: amt,
                description: "Admin ne balance remove kiya", date: new Date().toLocaleString(), ts: Date.now()
            });
            input.value = "";
            showToast(`₹${amt} remove ho gaya`);
        } catch (e) { showToast("Balance removal failed", "error"); }
    };

    window.toggleUserStatus = async (uid, currentStatus) => {
        const nextStatus = currentStatus === "ON" ? "OFF" : "ON";
        try {
            await update(ref(db, `users/${uid}`), { status: nextStatus });
            showToast(`Reseller Panel turned ${nextStatus}!`);
        } catch(e) {
            showToast("Failed to update status", "error");
        }
    };

    window.toggleBanUser = async (uid, statusNow) => {
        try { await update(ref(db, `users/${uid}`), { banned: !statusNow }); showToast(`Status updated!`); } catch(e) { }
    };

    window.toggleResellerRole = async (uid, currentlyReseller) => {
        const nextRole = currentlyReseller ? "User" : "Reseller";
        try {
            await update(ref(db, `users/${uid}`), { role: nextRole });
            showToast(nextRole === "Reseller" ? "Reseller bana diya" : "Reseller remove ho gaya, ab User hai");
        } catch(e) { showToast("Role update failed", "error"); }
    };

    window.deleteResellerUser = async (uid, name) => {
        if(!confirm(`Delete @${name.toUpperCase()} permanently?`)) return;
        try { await remove(ref(db, `users/${uid}`)); showToast("Reseller account wiped out."); } catch(e) { }
    };
