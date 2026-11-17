import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase, ref, set, onValue, update, push, get, remove, runTransaction } from "firebase/database";

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

        let userData = { balance: 0.00, username: "", role: "User" };
        let currentUserId = null;
        const _rp = (new URLSearchParams(location.search).get('ref') || '').replace(/[^A-Za-z0-9_\-]/g, '');
        if (_rp) localStorage.setItem('panel_ref', _rp);
        let liveDatabaseStore = {};
        let liveStock = {};
        let siteMaint = {};
        let productMaint = {};

        function applySiteMaint() {
            const o = document.getElementById('maint-overlay');
            if (!o) return;
            const on = !!siteMaint.enabled;
            o.style.display = on ? 'flex' : 'none';
            document.body.style.overflow = on ? 'hidden' : '';
            const m = document.getElementById('maint-msg');
            if (m) m.innerText = siteMaint.message || 'Hum kuch improvements kar rahe hain. Thodi der baad wapas aayein.';
        }

        // Telegram bot secrets belong only in server environment variables. Configure the public channel URL in Admin settings.

        const loader = document.getElementById('loader');
        const authScreen = document.getElementById('auth-screen');
        const mainApp = document.getElementById('main-app');

        window.addEventListener('load', async () => {
            const savedUid = localStorage.getItem('panel_uid');
            if (!savedUid) {
                authScreen.classList.remove('hidden');
                loader.classList.add('hidden');
                return;
            }
            // Purane/stale login session ko verify karo; Firebase hang ho to loader ko forever mat chalao.
            try {
                const snap = await Promise.race([
                    get(ref(db, `users/${savedUid}`)),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Session check timeout')), 9000))
                ]);
                if (snap.exists()) {
                    initUserSession(savedUid);
                } else {
                    localStorage.removeItem('panel_uid');
                    authScreen.classList.remove('hidden');
                    showToast('Purana login session expire ho gaya. Dobara login karein.', 'error');
                }
            } catch (err) {
                localStorage.removeItem('panel_uid');
                authScreen.classList.remove('hidden');
                showToast('Firebase connect nahi hua. Internet/Firebase settings check karein.', 'error');
            } finally {
                loader.classList.add('hidden');
            }
        });

        window.handleCardClick = (element) => {
            document.querySelectorAll('.clickable-card').forEach(card => {
                if (card !== element) card.classList.remove('clicked-active');
            });
            element.classList.toggle('clicked-active');
        };

        window.showToast = (msg, type = 'success') => {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${msg}`;
            container.appendChild(toast);
            setTimeout(() => { toast.remove(); }, 3000);
        };

        window.switchTab = (tabName) => {
            document.querySelectorAll('.tab-view-section').forEach(view => view.classList.add('hidden'));
            document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active-menu'));
            
            const targetView = document.getElementById(`view-${tabName}`);
            if(targetView) targetView.classList.remove('hidden');

            const targetMenu = document.getElementById(`menu-${tabName}`);
            if(targetMenu) targetMenu.classList.add('active-menu');

            if(sidebar.classList.contains('active')) toggleSidebar();
        };

        const menuToggle = document.getElementById('menu-toggle');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        function toggleSidebar() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }
        menuToggle.onclick = toggleSidebar;
        sidebarClose.onclick = toggleSidebar;
        overlay.onclick = toggleSidebar;

        function executeClipboardCopy(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    showToast("Copied successfully!");
                }).catch(() => {
                    fallbackCopy(text);
                });
            } else {
                fallbackCopy(text);
            }
        }

        function fallbackCopy(text) {
            const el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'fixed';
            el.style.opacity = '0';
            document.body.appendChild(el);
            el.select();
            try {
                document.execCommand('copy');
                showToast("Copied successfully!");
            } catch (err) {
                showToast("Failed to copy", "error");
            }
            document.body.removeChild(el);
        }


        /* ===== CYAN AUTH BACKGROUND + REFERRAL BANNER ===== */
        (function(){
            const cv=document.getElementById('auth-canvas'); if(!cv) return;
            const c=cv.getContext('2d'), scr=document.getElementById('auth-screen'); let W,H,P=[];
            function size(){W=cv.width=scr.clientWidth;H=cv.height=scr.clientHeight;}
            size(); addEventListener('resize',size);
            for(let i=0;i<9;i++)P.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:14+Math.random()*16,vx:(Math.random()-.5)*.7,vy:(Math.random()-.5)*.7});
            (function loop(){
                if(scr.offsetParent!==null){
                    c.clearRect(0,0,W,H);
                    P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<-20||p.x>W+20)p.vx*=-1;if(p.y<-20||p.y>H+20)p.vy*=-1;});
                    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){
                        const d=Math.hypot(P[i].x-P[j].x,P[i].y-P[j].y);
                        if(d<240){c.strokeStyle='rgba(0,229,255,'+(.25*(1-d/240))+')';c.beginPath();c.moveTo(P[i].x,P[i].y);c.lineTo(P[j].x,P[j].y);c.stroke();}
                    }
                    P.forEach(p=>{c.fillStyle='#00e5ff';c.shadowColor='#00e5ff';c.shadowBlur=14;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();});
                    c.shadowBlur=0;
                }
                requestAnimationFrame(loop);
            })();
        })();

        (async function showReferrer(){
            const rid = localStorage.getItem('panel_ref'); if(!rid) return;
            try{
                const snap = await get(ref(db, `users/${rid}`));
                if(!snap.exists()) return;
                const u = snap.val();
                const nm = (u.username||'').replace(/[<>&"']/g,'');
                document.querySelectorAll('[data-ref-banner]').forEach(el=>{
                    el.innerHTML = '🎁 You were invited by <b>@'+nm+'</b>';
                    el.classList.remove('hidden');
                });
                if(new URLSearchParams(location.search).get('ref')){
                    document.getElementById('login-box').classList.add('hidden');
                    document.getElementById('signup-box').classList.remove('hidden');
                }
            }catch(e){}
        })();
        document.getElementById('go-to-signup').onclick = () => {
            document.getElementById('login-box').classList.add('hidden');
            document.getElementById('signup-box').classList.remove('hidden');
        };
        document.getElementById('go-to-login').onclick = () => {
            document.getElementById('signup-box').classList.add('hidden');
            document.getElementById('login-box').classList.remove('hidden');
        };

        ['login-username', 'login-pass'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-login').click(); }));
        ['signup-name', 'signup-gmail', 'signup-username', 'signup-pass'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-signup').click(); }));

        function initUserSession(uid) {
            get(ref(db, `users/${uid}/apiKey`)).then(s => { const el=document.getElementById('user-api-key'); if(el && s.exists()) el.value=s.val(); }).catch(()=>{});
            currentUserId = uid;
            authScreen.classList.add('hidden');
            mainApp.style.display = 'block';
            syncUserDataLogs(uid);
            setupLiveStoreListener();
            initLeaderboardSync();
            syncSalesAndCounters();
            syncAutoPaymentSettings();
            loader.classList.add('hidden');
        }

        /* =====================================================
           AUTO PAYMENT (UPI QR) - fam gateway
           ===================================================== */
        const AP_LS = 'ap_pending_order';
        const FG_BASE = 'https://famgateway.in';
        let apCfg = { enabled:false, apiUrl:FG_BASE, apiKey:'', min:1, max:50000 };
        let apResumed = false, apTimerInt = null, apBusy = false, apWatchId = 0;
        const apInIframe = (window.top !== window.self);

        const apMoney = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const apGetPending = () => { try { return JSON.parse(localStorage.getItem(AP_LS) || 'null'); } catch(e) { return null; } };
        const apSavePending = (p) => localStorage.setItem(AP_LS, JSON.stringify(p));
        const apClearPending = () => localStorage.removeItem(AP_LS);
        const apSleep = (ms) => new Promise(r => setTimeout(r, ms));
        const apEsc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

        function syncAutoPaymentSettings() {
            onValue(ref(db, 'auto_payment_settings'), (snap) => {
                const d = snap.exists() ? snap.val() : {};
                apCfg = {
                    enabled: !!d.enabled && !!d.apiKey,
                    apiUrl: FG_BASE,
                    apiKey: d.apiKey || '',
                    siteUrl: d.siteUrl || '',
                    min: Math.max(0.01, Number(d.minAmount) || 1),
                    max: Number(d.maxAmount) || 50000
                };
                document.getElementById('auto-pay-box').style.display = apCfg.enabled ? 'block' : 'none';
                document.getElementById('manual-pay-box').style.display = apCfg.enabled ? 'none' : 'block';
                document.getElementById('ap-min-txt').innerText = apMoney(apCfg.min);
                document.getElementById('ap-max-txt').innerText = apMoney(apCfg.max);
                const inp = document.getElementById('ap-amount');
                inp.min = apCfg.min; inp.max = apCfg.max;
                if (apCfg.enabled) apResume();
            });
        }

        // FamGateway API (https://famgateway.in) - create order + verify
        async function apCall(fields) {
            const key = encodeURIComponent(apCfg.apiKey);
            let res;
            try {
                if (fields.action === 'create_order') {
                    const q = new URLSearchParams({ api_key: apCfg.apiKey, amount: fields.amount, customer_name: fields.payer || 'user', customer_phone: fields.phone || '', redirect_url: fields.redirect_url || '' });
                    res = await fetch(`${FG_BASE}/api/qr.php?${q.toString()}`, { method: 'GET', cache: 'no-store' });
                } else {
                    res = await fetch(`${FG_BASE}/api/verify-order.php?api_key=${key}&order_id=${encodeURIComponent(fields.order_id)}`, { method: 'GET', cache: 'no-store' });
                }
            } catch (e) {
                throw new Error('Gateway se connect nahi ho paya. Internet check karo.');
            }
            let j = null;
            try { j = await res.json(); } catch (e) {}
            if (!j) throw new Error('Gateway ka response sahi nahi mila.');

            if (fields.action === 'create_order') {
                if (j.status !== 'success' || !j.data) throw new Error(j.message || 'Order create nahi hua.');
                const d = j.data;
                return { order_id: d.order_id, checkout_url: d.checkout_url, amount: Number(d.amount), payable_amount: Number(d.payable_amount || d.amount), expires_in: 300 };
            }
            // verify
            if (j.status === 'success') {
                const d = j.data || {};
                return { status: 'success', paid: true, amount: Number(d.amount), reference: d.utr || '' };
            }
            if (j.status === 'expired') return { status: 'expired', paid: false };
            if (j.status === 'unauthorized') throw new Error('API Key galat hai. Admin se contact karo.');
            return { status: 'pending', paid: false };
        }

        window.apSetAmount = (v) => {
            const inp = document.getElementById('ap-amount');
            inp.value = v;
            document.querySelectorAll('.ap-chip').forEach(c => c.classList.toggle('on', c.innerText.replace(/\D/g,'') == v));
        };

        window.apStartPayment = async () => {
            if (apBusy) return;
            if (!apCfg.enabled) return showToast('Auto payment abhi available nahi hai', 'error');
            const amt = Math.round(parseFloat(document.getElementById('ap-amount').value) * 100) / 100;
            const phone = (document.getElementById('ap-phone').value || '').replace(/\D/g, '');
            if (phone.length !== 10) return showToast('10 digit mobile number daalo', 'error');
            if (!amt || isNaN(amt)) return showToast('Please enter valid amount', 'error');
            if (amt < apCfg.min) return showToast(`Minimum deposit ₹${apMoney(apCfg.min)} hai`, 'error');
            if (amt > apCfg.max) return showToast(`Maximum deposit ₹${apMoney(apCfg.max)} hai`, 'error');

            // agar pehle ka order abhi bhi chal raha hai to wahi resume karo
            const old = apGetPending();
            if (old && old.uid === currentUserId && Date.now() < old.expiresAt && Math.abs(old.amount - amt) < 0.001 && old.checkoutUrl) {
                apShowPay(old);
                return;
            }

            apBusy = true;
            const btn = document.getElementById('ap-pay-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating order...';
            try {
                const clientId = 'GM' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
                let base = '';
                if (/^https?:$/i.test(location.protocol)) base = location.origin + location.pathname;
                else if (/^https?:\/\//i.test(apCfg.siteUrl)) base = apCfg.siteUrl.trim();
                else base = 'https://famgateway.in';
                const back = (base.split('#')[0].split('?')[0] + '?ap=return').slice(0, 480);
                const o = await apCall({
                    action: 'create_order',
                    amount: amt.toFixed(2),
                    redirect_url: back,
                    payer: String(userData.username || 'user').slice(0, 60),
                    phone: phone
                });
                if (!o.order_id || !o.checkout_url) throw new Error('Order create nahi hua, dobara try karo.');
                if (Math.abs(Number(o.amount) - amt) > 0.009) throw new Error('Amount mismatch, dobara try karo.');

                const expiresAt = Date.now() + (Number(o.expires_in) || 300) * 1000;
                await set(ref(db, `auto_payments/${o.order_id}`), {
                    uid: currentUserId,
                    username: userData.username || '',
                    amount: amt,
                    clientOrderId: clientId,
                    status: 'pending',
                    credited: false,
                    createdAt: Date.now()
                });
                apSavePending({ gwId: o.order_id, uid: currentUserId, amount: amt, expiresAt, checkoutUrl: o.checkout_url });
                apBusy = false;
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Balance';
                const np = apGetPending();
                apShowPay(np);
            } catch (e) {
                showToast(e.message || 'Payment start failed', 'error');
                apBusy = false;
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Balance';
            }
        };

        // payment verify hone ke baad balance add (sirf ek baar, duplicate nahi hota)
        async function apCredit(gwId, v) {
            const pRef = ref(db, `auto_payments/${gwId}`);
            const rec = (await get(pRef)).val();
            if (!rec) throw new Error('Order record nahi mila.');
            const amount = Number(rec.amount);
            if (Math.abs(Number(v.amount) - amount) > 0.015) throw new Error('Paid amount order se match nahi hua. Admin se contact karo.');

            const claim = await runTransaction(ref(db, `auto_payments/${gwId}/credited`), (cur) => cur ? undefined : true);
            if (!claim.committed) {
                const bal = (await get(ref(db, `users/${rec.uid}/balance`))).val();
                return { amount, reference: rec.reference || v.reference || '', balance: Number(bal) || 0, already: true };
            }
            try {
                await runTransaction(ref(db, `users/${rec.uid}/balance`), (cur) => Math.round(((Number(cur) || 0) + amount) * 100) / 100);
            } catch (e) {
                await set(ref(db, `auto_payments/${gwId}/credited`), false);
                throw e;
            }
            await update(pRef, { status: 'success', paidAt: Date.now(), reference: v.reference || '' });
            await set(push(ref(db, `users/${rec.uid}/transactions`)), {
                type: 'Deposit',
                amount: amount,
                description: `Auto Payment Deposit (UPI) - ${gwId}`,
                source: 'gateway', ts: Date.now(),
                date: new Date().toLocaleString()
            });
            const bal = (await get(ref(db, `users/${rec.uid}/balance`))).val();
            return { amount, reference: v.reference || '', balance: Number(bal) || 0, already: false };
        }

        function apShow(html) {
            clearInterval(apTimerInt);
            const _m = document.getElementById('ap-modal'); _m.classList.remove('wide'); _m.innerHTML = html;
            document.getElementById('ap-overlay').classList.remove('hidden');
        }

        // ---- in-page QR payment screen (gateway checkout inside the page) ----
        function apShowPay(p) {
            apWatchId++;
            apShow(`<div class="ap-ico wait"><div class="ap-spin"></div></div>
                <h3>Opening Payment Page</h3>
                <p>₹${apMoney(p.amount)} ka secure UPI QR page khul raha hai...<br>Payment hote hi aap yahin wapas aa jaoge aur balance add ho jayega.</p>
                <button class="ap-btn" style="margin-top:18px" type="button" onclick="apGoGateway()"><i class="fas fa-external-link-alt"></i> Open Payment Page</button>
                <button class="ap-btn2" type="button" onclick="apCancelPending()">Cancel</button>`);
            setTimeout(apGoGateway, 700);
        }
        window.apGoGateway = () => {
            const p = apGetPending();
            if (!p || !p.checkoutUrl) return;
            try { (window.top || window).location.href = p.checkoutUrl; }
            catch (e) { window.open(p.checkoutUrl, '_blank'); }
        };
        window.apContinue = () => { const p = apGetPending(); if (p) apShowPay(p); };

        async function apWatch(p) {
            const myId = apWatchId;
            while (myId === apWatchId) {
                await apSleep(4000);
                if (myId !== apWatchId) return;
                try {
                    const v = await apCall({ action: 'verify', order_id: p.gwId });
                    if (myId !== apWatchId) return;
                    if (v.status === 'success' && v.paid === true) {
                        const r = await apCredit(p.gwId, v);
                        apClearPending(); apWatchId++;
                        apShowSuccess(r); return;
                    }
                    if (v.status === 'expired') {
                        try { await update(ref(db, `auto_payments/${p.gwId}`), { status: 'expired' }); } catch (e) {}
                        apClearPending(); apWatchId++;
                        apShowFailed('Payment time expire ho gaya (5 minute).'); return;
                    }
                } catch (e) {
                    if (/match|record/i.test(e.message)) { apClearPending(); apWatchId++; apShowFailed(e.message); return; }
                }
                if (Date.now() > p.expiresAt + 15000) {
                    apClearPending(); apWatchId++;
                    apShowFailed('Payment receive nahi hui aur order expire ho gaya.'); return;
                }
            }
        }

        window.apCloseModal = () => { apWatchId++; clearInterval(apTimerInt); document.getElementById('ap-modal').classList.remove('wide'); document.getElementById('ap-overlay').classList.add('hidden'); };

        function apShowVerifying() {
            apShow(`<div class="ap-ico wait"><div class="ap-spin"></div></div><h3>Verifying Payment</h3><p>Please wait, aapki payment check ho rahi hai...</p>`);
        }
        function apShowSuccess(r) {
            apShow(`<div class="ap-ico ok"><i class="fas fa-check"></i></div>
                <h3>Payment Successful</h3><p>Aapka balance add ho gaya hai.</p>
                <div class="ap-rows">
                    <div>Amount Added<b class="g">+₹${apMoney(r.amount)}</b></div>
                    <div>New Balance<b>₹${apMoney(r.balance)}</b></div>
                    ${r.reference ? `<div>Reference<b>${apEsc(r.reference)}</b></div>` : ''}
                </div>
                <button class="ap-btn" type="button" onclick="apCloseModal(); switchTab('Dashboard')">Done</button>`);
        }
        function apShowFailed(msg) {
            apShow(`<div class="ap-ico bad"><i class="fas fa-times"></i></div><h3>Payment Not Completed</h3><p>${apEsc(msg)}</p>
                <button class="ap-btn" style="margin-top:20px" type="button" onclick="apCloseModal(); switchTab('AddFunds')">Try Again</button>`);
        }
        function apShowPending(p) {
            apShow(`<div class="ap-ico wait"><i class="fas fa-hourglass-half"></i></div><h3>Payment Pending</h3>
                <p>₹${apMoney(p.amount)} ki payment abhi receive nahi hui.</p>
                <div class="ap-timer" id="ap-left">--:--</div><p>time left</p>
                <button class="ap-btn" style="margin-top:18px" type="button" onclick="apContinue()">Continue Payment</button>
                <button class="ap-btn2" type="button" onclick="apCheckNow()">I have paid - Check status</button>
                <button class="ap-btn2" type="button" onclick="apCancelPending()">Cancel</button>`);
            const tick = () => {
                const left = Math.max(0, Math.floor((p.expiresAt - Date.now()) / 1000));
                const el = document.getElementById('ap-left');
                if (el) el.innerText = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
                if (left <= 0) { clearInterval(apTimerInt); apCheckNow(); }
            };
            tick(); apTimerInt = setInterval(tick, 1000);
        }

        window.apCancelPending = async () => {
            const p = apGetPending();
            if (p) { try { await update(ref(db, `auto_payments/${p.gwId}`), { status: 'cancelled' }); } catch (e) {} }
            apWatchId++; apClearPending(); apCloseModal();
        };
        window.apCheckNow = async () => { const p = apGetPending(); if (p) await apPoll(p, 20000); };

        // verify loop: success -> balance add, expired -> fail, warna pending screen
        async function apPoll(p, maxMs) {
            apShowVerifying();
            const t0 = Date.now();
            while (true) {
                try {
                    const v = await apCall({ action: 'verify', order_id: p.gwId });
                    if (v.status === 'success' && v.paid === true) {
                        const r = await apCredit(p.gwId, v);
                        apClearPending();
                        apShowSuccess(r);
                        return;
                    }
                    if (v.status === 'expired') {
                        try { await update(ref(db, `auto_payments/${p.gwId}`), { status: 'expired' }); } catch (e) {}
                        apClearPending();
                        apShowFailed('Payment time expire ho gaya. Agar paise cut hue hain to admin se contact karo.');
                        return;
                    }
                } catch (e) {
                    if (/match|record/i.test(e.message)) { apClearPending(); apShowFailed(e.message); return; }
                }
                if (Date.now() - t0 >= maxMs) break;
                await apSleep(4000);
            }
            if (Date.now() < p.expiresAt) apShowPending(p);
            else { apClearPending(); apShowFailed('Payment receive nahi hui aur order expire ho gaya.'); }
        }

        async function apResume() {
            if (apResumed || apInIframe) return;
            apResumed = true;
            const cameBack = new URLSearchParams(location.search).get('ap') === 'return';
            if (cameBack) history.replaceState(null, '', location.pathname);
            const p = apGetPending();
            if (!p || p.uid !== currentUserId) return;
            if (cameBack) { await apPoll(p, 60000); }
            else if (Date.now() < p.expiresAt + 86400000) { await apPoll(p, 0); }
            else apClearPending();
        }

        function syncUserDataLogs(uid) {
            onValue(ref(db, `users/${uid}`), (snapshot) => {
                if(snapshot.exists()) {
                    userData = snapshot.val();
                }
                const currentBalance = parseFloat(userData.balance || 0.00).toFixed(2);
                document.getElementById('reseller-balance').innerText = currentBalance;
                document.getElementById('menu-balance-label').innerText = currentBalance;
                ['bk-bal', 'dp-bal'].forEach(i => { const e = document.getElementById(i); if (e) e.innerText = currentBalance; });
                renderDeposits();
                document.getElementById('ap-current-balance').innerText = apMoney(userData.balance);
                
                const formatUser = userData.username ? userData.username.charAt(0).toUpperCase() + userData.username.slice(1) : "Reseller";
                document.getElementById('menu-username-label').innerText = formatUser;
                
                // Profile view field strings setup sync
                document.getElementById('profile-username').value = userData.username ? userData.username.toUpperCase() : "";
                { const wn = document.getElementById('wc-name'); if (wn) {
                    wn.innerText = userData.username ? userData.username.toUpperCase() : 'USER';
                    const wr = document.getElementById('wc-role'), isR = userData.role === 'Reseller';
                    wr.innerHTML = isR ? '<i class="fas fa-crown"></i> RESELLER' : 'USER'; wr.classList.toggle('gold', isR);
                    const wa = document.getElementById('wc-av'), na = document.querySelector('.nav-avatar'); if (wa && na && !wa.src.startsWith('data:')) wa.src = na.src;
                } }
                document.getElementById('profile-role').value = (userData.role || "User").toUpperCase();
                document.getElementById('total-resellers-card').style.display = userData.role === "Reseller" ? "" : "none";
                renderBuyKeysGrid();
                renderResellerCard(); renderMyResellers(); renderRefer(); renderTickets(); renderRefCard();
                if (bkCurrent) renderBkModal();
                document.getElementById('profile-balance').value = `₹${parseFloat(userData.balance || 0).toFixed(2)}`;


                renderKeysList(userData.generatedKeys);
                renderHistoryList(userData.transactions);
            });
        }

        function initLeaderboardSync() {
            onValue(ref(db, 'users'), (snapshot) => {
                const target = document.getElementById('leaderboard-target-rows');
                if(!snapshot.exists()) {
                    target.innerHTML = `<div class="empty-state">No users registered yet.</div>`;
                    return;
                }

                let usersList = [];
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    let keyCount = 0;
                    
                    if (data.generatedKeys) {
                        keyCount = Object.values(data.generatedKeys).filter(k => k && k.source === 'stock').length;
                    } else if (data.keyCount) {
                        keyCount = parseInt(data.keyCount) || 0;
                    }

                    if (keyCount > 0) {
                        let formattedUsername = data.username ? data.username.toUpperCase() : 'UNKNOWN';
                        usersList.push({
                            username: `@${formattedUsername}`,
                            role: data.role || "User",
                            keys: keyCount,
                            balance: parseFloat(data.balance || 0)
                        });
                    }
                });

                if(usersList.length === 0) {
                    target.innerHTML = `<div class="empty-state">No users have bought keys yet.</div>`;
                    return;
                }

                usersList.sort((a, b) => {
                    if (b.keys !== a.keys) {
                        return b.keys - a.keys;
                    }
                    return b.balance - a.balance; 
                });

                const topFive = usersList.slice(0, 5);

                target.innerHTML = '';
                topFive.forEach((u, index) => {
                    target.innerHTML += `
                        <div class="lead-row-item">
                            <span class="lead-rank">#${index + 1}</span>
                            <span class="lead-user">${u.username}</span>
                            <div><span class="role-badge">${u.role}</span></div>
                            <span class="lead-keys-count">${u.keys}=Key</span>
                        </div>`;
                });
            });
        }

        function syncSalesAndCounters() {
            onValue(ref(db, 'users'), (snapshot) => {
                let totalResellers = 0;
                let myTodaySales = 0;
                let myMonthSales = 0;

                const todayStr = new Date().toLocaleDateString();
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                if (snapshot.exists()) {
                    snapshot.forEach((userSnap) => {
                        const uid = userSnap.key;
                        const uData = userSnap.val();



                        if (uid === currentUserId && uData.generatedKeys) {
                            Object.values(uData.generatedKeys).forEach(key => {
                                const keyDate = new Date(key.timestamp);
                                const qty = parseInt(key.qty || 1);

                                if (keyDate.toLocaleDateString() === todayStr) {
                                    myTodaySales += qty;
                                }

                                if (keyDate.getMonth() === currentMonth && keyDate.getFullYear() === currentYear) {
                                    myMonthSales += qty;
                                }
                            });
                        }
                    });
                }


                document.getElementById('count-today-sales').innerText = myTodaySales;
                document.getElementById('count-month-sales').innerText = myMonthSales;

                document.getElementById('today-sales-me').innerText = `Me: ${myTodaySales}`;
                document.getElementById('today-sales-r').innerText = `R: 0`;
                document.getElementById('month-sales-me').innerText = `Me: ${myMonthSales}`;
                document.getElementById('month-sales-r').innerText = `R: 0`;
            });
        }

        function renderKeysList(keysObj) {
            const target = document.getElementById('my-keys-list-target');
            // Only keys that came from admin stock are real; older auto-generated records are hidden.
            if (keysObj) {
                keysObj = Object.fromEntries(Object.entries(keysObj).filter(([, k]) => k && k.source === 'stock' && (!mkSearch || `${k.product} ${k.duration} ${k.keyCode}`.toLowerCase().includes(mkSearch))));
                if (!Object.keys(keysObj).length) keysObj = null;
            }
            if(!keysObj) {
                target.innerHTML = `<div class="empty-state glass">No inventory keys generated yet.</div>`;
                return;
            }
            target.innerHTML = '';
            
            Object.values(keysObj).reverse().forEach(k => {
                const card = document.createElement('div');
                card.className = 'data-item-card glass';
                
                card.innerHTML = `
                    <div class="item-details-left">
                        <span class="item-title-main">${k.product}</span>
                        <span class="item-sub-meta">Duration: ${k.duration} | Qty: ${k.qty}</span>
                        <div class="key-row">
                            <div class="key-display-box">${k.keyCode}</div>
                            <button class="inline-copy-btn" title="Copy Key">
                                <i class="far fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <span class="item-badge-right badge-info">Active</span>`;
                
                const copyBtn = card.querySelector('.inline-copy-btn');
                copyBtn.addEventListener('click', () => {
                    executeClipboardCopy(k.keyCode);
                });
                
                target.appendChild(card);
            });
        }

        function renderHistoryList(historyObj) {
            const target = document.getElementById('history-list-target');
            if (!target) return;
            const entries = Object.entries(historyObj || {}).map(([id, h]) => ({id, ...(h || {})})).sort((a,b) => (Number(b.ts)||Date.parse(b.date)||0) - (Number(a.ts)||Date.parse(a.date)||0));
            const isCredit = h => ['Deposit','SubSeller_Refund','Commission','AdminCredit'].includes(String(h.type||'')) || (Number(h.amount)||0) > 0 && !['Generation','AdminDebit'].includes(String(h.type||''));
            const credit = entries.filter(isCredit).reduce((a,h)=>a+Math.abs(Number(h.amount)||0),0);
            const debit = entries.filter(h=>!isCredit(h)).reduce((a,h)=>a+Math.abs(Number(h.amount)||0),0);
            document.getElementById('user-tx-credit').innerText = `₹${credit.toFixed(2)}`;
            document.getElementById('user-tx-debit').innerText = `₹${debit.toFixed(2)}`;
            document.getElementById('user-tx-count').innerText = String(entries.length);
            const q = (document.getElementById('user-tx-search')?.value || '').trim().toLowerCase();
            const filter = document.getElementById('user-tx-filter')?.value || 'ALL';
            const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const filtered = entries.filter(h => {
                const cr = isCredit(h);
                return (filter === 'ALL' || (filter === 'CREDIT' ? cr : !cr)) && (!q || [h.type,h.description,h.date,h.amount,h.id].some(v=>String(v??'').toLowerCase().includes(q)));
            });
            if (!filtered.length) { target.innerHTML = `<div class="empty-state glass">${entries.length ? 'No matching transactions.' : 'No transaction records found.'}</div>`; return; }
            target.innerHTML = filtered.map(h => {
                const cr = isCredit(h), amount = Math.abs(Number(h.amount)||0);
                return `<div class="data-item-card glass"><div class="item-details-left"><span class="item-title-main">${safe(h.description || h.type || 'Wallet transaction')}</span><span class="item-sub-meta">${safe(h.date || (h.ts ? new Date(Number(h.ts)).toLocaleString() : 'Date unavailable'))} · ${safe(h.type || 'Transaction')}</span><span class="item-sub-meta">Ref: ${safe(h.id.slice(-10))}</span></div><span class="item-badge-right ${cr?'badge-success':'badge-info'}">${cr?'+':'−'}₹${amount.toFixed(2)}</span></div>`;
            }).join('');
        }

        let storeMetaCache = {};
        let bkCurrent = null, bkPlanIdx = 0, bkQty = 1;
        let bkFilter = 'ALL', bkSearch = '', bkGame = 'ALL';

        function bkEsc(t) { return String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

        let allUsers = {}, allTickets = {};
        const escH = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

        async function payReferral(amount) {
            const r = userData.referredBy, pct = Number(rsCfg.commissionPct);
            if (!r || !(pct > 0) || !(amount > 0)) return;
            const c = Math.round(amount * pct) / 100;
            try {
                await runTransaction(ref(db, `users/${r}/balance`), (b) => Math.round(((Number(b) || 0) + c) * 100) / 100);
                await push(ref(db, `users/${r}/transactions`), { type: 'Commission', amount: c, description: `Referral commission from ${userData.username}`, date: new Date().toLocaleString() });
            } catch (e) {}
        }

        function renderMyResellers() {
            const box = document.getElementById('mr-list'); if (!box || !currentUserId) return;
            const mine = Object.entries(allUsers).filter(([id, u]) => u && u.referredBy === currentUserId);
            document.getElementById('mr-users').innerText = mine.length;
            document.getElementById('mr-res').innerText = mine.filter(([id, u]) => u.role === 'Reseller').length;
            document.getElementById('mr-min').innerText = rsCfg.minBalance;
            if (!mine.length) { box.innerHTML = '<div class="generator-card glass" style="text-align:center;color:var(--text-muted);">Abhi koi user aapke link se nahi juda. Refer And Earn se link share karo.</div>'; return; }
            box.innerHTML = mine.map(([id, u]) => {
                const bal = parseFloat(u.balance) || 0, isRes = u.role === 'Reseller';
                const btn = isRes ? '<span style="color:#22c55e;font-weight:700;">RESELLER</span>'
                    : (rsCfg.enabled && bal >= rsCfg.minBalance ? `<button class="btn-main" style="width:auto;padding:8px 16px;" onclick="makeReseller('${escH(id)}')">MAKE RESELLER</button>`
                    : `<span style="color:var(--text-muted);font-size:12px;">Balance ₹${rsCfg.minBalance} chahiye</span>`);
                return `<div class="generator-card glass" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;"><div><b>@${escH(u.username)}</b><div style="color:#00e5ff;font-size:12px;">✅ Ne aapke link se account banaya${u.joinedAt ? ' • ' + new Date(u.joinedAt).toLocaleDateString() : ''}</div><div style="color:var(--text-muted);font-size:12px;">Balance: ₹${bal.toFixed(2)}</div></div>${btn}</div>`;
            }).join('');
        }
        window.makeReseller = async (id) => {
            const u = allUsers[id];
            if (!u || u.referredBy !== currentUserId) return;
            if ((parseFloat(u.balance) || 0) < rsCfg.minBalance) return showToast(`User ke wallet me kam se kam ₹${rsCfg.minBalance} chahiye`, 'error');
            try { await update(ref(db, `users/${id}`), { role: 'Reseller' }); showToast('User ab Reseller ban gaya!'); }
            catch (e) { showToast('Failed, try again', 'error'); }
        };

        function renderRefer() {
            const l = document.getElementById('rf-link'); if (!l || !currentUserId) return;
            l.value = location.origin + location.pathname + '?ref=' + currentUserId;
            document.getElementById('rf-pct').innerText = rsCfg.commissionPct;
        }
        window.copyRefLink = () => { renderRefer(); executeClipboardCopy(document.getElementById('rf-link').value); };

        window.sendTicket = async () => {
            const subject = document.getElementById('tk-subject').value.trim();
            const message = document.getElementById('tk-msg').value.trim();
            if (!subject || !message) return showToast('Subject aur message dono likho', 'error');
            try {
                await push(ref(db, 'tickets'), { uid: currentUserId, username: userData.username || '', subject, message, status: 'open', reply: '', createdAt: Date.now() });
                document.getElementById('tk-subject').value = ''; document.getElementById('tk-msg').value = '';
                showToast('Ticket bhej diya!');
            } catch (e) { showToast('Ticket nahi gaya, try again', 'error'); }
        };
        function renderTickets() {
            const box = document.getElementById('tk-list'); if (!box || !currentUserId) return;
            const mine = Object.entries(allTickets).filter(([id, t]) => t && t.uid === currentUserId).sort((a, b) => b[1].createdAt - a[1].createdAt);
            box.innerHTML = mine.length ? mine.map(([id, t]) => `<div class="generator-card glass" style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;gap:8px;"><b>${escH(t.subject)}</b><span style="color:${t.status === 'answered' ? '#22c55e' : '#f59e0b'};font-size:12px;">${t.status === 'answered' ? 'ANSWERED' : 'OPEN'}</span></div><p style="margin:6px 0;color:var(--text-muted);font-size:13px;">${escH(t.message)}</p>${t.reply ? `<div style="border-top:1px solid rgba(255,255,255,.1);padding-top:6px;font-size:13px;"><b>Admin:</b> ${escH(t.reply)}</div>` : ''}</div>`).join('')
                : '<div class="generator-card glass" style="text-align:center;color:var(--text-muted);">Koi ticket nahi.</div>';
        }

        window.changePassword = async () => {
            const o = document.getElementById('pw-old').value, n = document.getElementById('pw-new').value, n2 = document.getElementById('pw-new2').value;
            if (!o || !n) return showToast('Sab khane bharo', 'error');
            if (n.length < 6) return showToast('New password kam se kam 6 character ka ho', 'error');
            if (n !== n2) return showToast('New password match nahi kar raha', 'error');
            try {
                const cur = (await get(ref(db, `users/${currentUserId}/password`))).val();
                if (cur !== o) return showToast('Current password galat hai', 'error');
                await update(ref(db, `users/${currentUserId}`), { password: n });
                ['pw-old', 'pw-new', 'pw-new2'].forEach(i => document.getElementById(i).value = '');
                showToast('Password badal gaya!');
            } catch (e) { showToast('Failed, try again', 'error'); }
        };

        // ---- links / language / theme / extras ----
        let siteLinks = {}, mkSearch = '', frDone = false, lang = localStorage.getItem('panel_lang') || 'en';
        window.openLink = (k) => { const u = siteLinks[k]; if (!u) return showToast('Admin ne ye link abhi set nahi kiya', 'error'); window.open(u, '_blank'); };
        window.mkSearchInput = (v) => { mkSearch = v.trim().toLowerCase(); renderKeysList(userData.generatedKeys); };
        window.mkReset = () => { document.getElementById('mk-search').value = ''; mkSearch = ''; renderKeysList(userData.generatedKeys); };
        window.dpTab = (t) => {
            ['upi', 'binance', 'bkash'].forEach(x => { document.getElementById('dp-' + x).style.display = x === t ? '' : 'none'; document.getElementById('dpb-' + x).classList.toggle('on', x === t); });
        };
        function renderDeposits() {
            const el = document.getElementById('dp-today'); if (!el) return;
            const today = new Date().toLocaleDateString();
            const sum = Object.values(userData.transactions || {}).filter(t => t && t.type === 'Deposit' && String(t.date || '').startsWith(today)).reduce((a, t) => a + (Number(t.amount) || 0), 0);
            el.innerText = sum.toFixed(2);
        }
        window.setLang = (l) => {
            lang = l; localStorage.setItem('panel_lang', l);
            document.getElementById('lang-en').classList.toggle('on', l === 'en'); document.getElementById('lang-hi').classList.toggle('on', l === 'hi');
            const n = Number(siteLinks.safetyBalance) || 10;
            document.getElementById('sf-text').innerText = l === 'hi' ? `अकाउंट सुरक्षा के लिए ${n}+ बैलेंस रखें।` : `Keep ${n}+ balance for account safety.`;
        };
        const THEMES = [0, 60, 130, 200, 280];
        window.cycleTheme = () => { const i = (Number(localStorage.getItem('panel_theme') || 0) + 1) % THEMES.length; localStorage.setItem('panel_theme', i); document.documentElement.style.filter = THEMES[i] ? `hue-rotate(${THEMES[i]}deg)` : ''; };
        { const i = Number(localStorage.getItem('panel_theme') || 0); if (THEMES[i]) document.documentElement.style.filter = `hue-rotate(${THEMES[i]}deg)`; }

        function renderRefCard() {
            if (!currentUserId) return;
            const isRes = userData.role === 'Reseller';
            const mine = Object.values(allUsers).filter(u => u && u.referredBy === currentUserId);
            const target = Number(siteLinks.refTarget) || 30, pct = rsCfg.commissionPct;
            const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
            set('fr-done', mine.length); set('fr-target', target); set('count-my-users', mine.length); set('count-my-resellers', mine.filter(u => u.role === 'Reseller').length);
            document.querySelectorAll('.fr-pct').forEach(e => e.innerText = pct);
            document.querySelectorAll('.fr-t2').forEach(e => e.innerText = target);
            document.querySelectorAll('.rs-min-t').forEach(e => e.innerText = Number(rsCfg.minBalance).toFixed(2));
            document.getElementById('fr-bar').style.width = Math.min(100, mine.length / target * 100) + '%';
            document.getElementById('free-ref-card').style.display = isRes ? 'none' : '';
            document.getElementById('reseller-only-cards').style.display = isRes ? '' : 'none';
            if (!isRes && !frDone && mine.length >= target) {
                frDone = true;
                update(ref(db, `users/${currentUserId}`), { role: 'Reseller' }).then(() => showToast('Badhai ho! Free Reseller ban gaye!')).catch(() => { frDone = false; });
            }
        }

        let rsCfg = { enabled:false, minBalance:10, commissionPct:1 };
        function renderResellerCard() {
            const c = document.getElementById('become-reseller-card'); if (!c) return;
            c.style.display = (rsCfg.enabled && userData.role !== 'Reseller') ? '' : 'none';
            document.getElementById('rs-min-amt').innerText = Number(rsCfg.minBalance).toFixed(2);
        }
        window.upgradeToReseller = async () => {
            if (userData.role === 'Reseller') return;
            if ((parseFloat(userData.balance) || 0) < rsCfg.minBalance) return showToast(`Reseller banne ke liye wallet me kam se kam ₹${rsCfg.minBalance} chahiye. Pehle Deposit karo.`, 'error');
            try { await update(ref(db, `users/${currentUserId}`), { role: 'Reseller' }); showToast('Ab aap Reseller ho! Reseller rate unlock.'); }
            catch (e) { showToast('Upgrade failed, try again', 'error'); }
        };
        let supCfg = { enabled:false, apiKey:'', masterKey:'' };
        const SUPPLIER_URL = 'https://bantibhaiya.to/api/reseller_v1.php';
        const bkSupPid = (k) => supCfg.enabled ? String((storeMetaCache[k] || {}).supplierPid || '') : '';

        function setupLiveStoreListener() {
            onValue(ref(db, 'store_management'), (snapshot) => {
                liveDatabaseStore = snapshot.exists() ? snapshot.val() : {};
                renderBuyKeysGrid();
            });
            onValue(ref(db, 'store_products'), (snapshot) => {
                storeMetaCache = snapshot.exists() ? snapshot.val() : {};
                renderBuyKeysGrid();
            });
            onValue(ref(db, 'key_stock'), (snapshot) => {
                liveStock = snapshot.exists() ? snapshot.val() : {};
                if (bkCurrent) renderBkModal();
            });
            onValue(ref(db, 'site_settings/links'), (snapshot) => {
                siteLinks = snapshot.val() || {};
                const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v || 'Admin ne abhi details nahi daali.'; };
                set('dp-binance-txt', siteLinks.binanceText); set('dp-bkash-txt', siteLinks.bkashText);
                setLang(lang); renderRefCard();
                const ab = document.getElementById('ann-bar'); if (ab) { ab.style.display = siteLinks.announcement ? '' : 'none'; document.getElementById('ann-text').textContent = siteLinks.announcement || ''; }
            });
            onValue(ref(db, 'users'), (snapshot) => { allUsers = snapshot.val() || {}; renderMyResellers(); renderRefCard(); });
            onValue(ref(db, 'tickets'), (snapshot) => { allTickets = snapshot.val() || {}; renderTickets(); });
            onValue(ref(db, 'site_settings/reseller_upgrade'), (snapshot) => {
                const d = snapshot.exists() ? snapshot.val() : {};
                rsCfg = { enabled: !!d.enabled, minBalance: Number(d.minBalance) || 10, commissionPct: d.commissionPct != null ? Number(d.commissionPct) : 1 };
                renderMyResellers(); renderRefer();
                renderResellerCard();
            });
            onValue(ref(db, 'site_settings/public_api'), (snapshot) => { const d=snapshot.val()||{}; const url=document.getElementById('user-api-url'); if(url) url.value=d.baseUrl||''; const ch=document.getElementById('api-channel-line'); if(ch) ch.innerHTML=d.channelUrl ? `<a href="${String(d.channelUrl).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" target="_blank" rel="noopener">OFFICIAL ARYAN CHANNEL</a> · ${d.docsUrl ? `<a href="${String(d.docsUrl).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" target="_blank" rel="noopener">API DOCS</a>` : ''}` : 'Official channel URL admin ne abhi set nahi kiya.'; });
            // Supplier credentials are intentionally not loaded into the browser.
            // Automatic supplier delivery must be performed by a secured server endpoint.
            supCfg = { enabled: false, apiKey: '', masterKey: '' };
            renderBuyKeysGrid();
            onValue(ref(db, 'site_settings/maintenance'), (snapshot) => {
                siteMaint = snapshot.exists() ? snapshot.val() : {};
                applySiteMaint();
            });
            onValue(ref(db, 'product_maintenance'), (snapshot) => {
                productMaint = snapshot.exists() ? snapshot.val() : {};
                renderBuyKeysGrid();
            });
        }

        function getBkProducts() {
            return Object.keys(liveDatabaseStore || {}).map(key => {
                const plansObj = liveDatabaseStore[key] || {};
                const meta = storeMetaCache[key] || {};
                const first = Object.values(plansObj)[0] || {};
                const plans = Object.keys(plansObj).map(pk => ({
                    pk: pk,
                    days: plansObj[pk].daysPlan || pk,
                    price: parseFloat((userData.role === "Reseller" && plansObj[pk].resellerPrice != null ? plansObj[pk].resellerPrice : plansObj[pk].priceRate) || 0)
                })).filter(p => !isNaN(p.price));
                const tags = Array.isArray(meta.tags) ? meta.tags : Object.keys(meta.tags || {});
                return { key, name: meta.name || first.productName || key, pid: String(meta.pid || ''), tags, imageUrl: meta.imageUrl || '', downloadUrl: meta.downloadUrl || '', supplierPid: meta.supplierPid || '', game: String(meta.game || '').trim().toUpperCase(), videoUrl: meta.videoUrl || '', badge: String(meta.badge || '').toUpperCase(), features: (Array.isArray(meta.features) ? meta.features : String(meta.features || '').split('\n')).map(x => String(x).trim()).filter(Boolean), plans };
            }).filter(p => p.plans.length);
        }

        function renderBuyKeysGrid() {
            const grid = document.getElementById('bk-grid');
            if (!grid) return;
            const all = getBkProducts();
            const q = bkSearch.trim().toLowerCase();
            const list = all.filter(p => (bkFilter === 'ALL' || p.tags.includes(bkFilter)) && (bkGame === 'ALL' || p.game === bkGame) && (!q || p.name.toLowerCase().includes(q)));
            document.querySelectorAll('.bk-chip:not(.bk-gchip)').forEach(c => c.classList.toggle('active', c.dataset.tag === bkFilter));
            const gbox = document.getElementById('bk-games');
            if (gbox) { const games = ['ALL', ...new Set(all.map(p => p.game).filter(Boolean))]; gbox.innerHTML = games.map(g => `<button class="bk-chip bk-gchip ${g === bkGame ? 'active' : ''}" onclick="bkSetGame(decodeURIComponent('${encodeURIComponent(g)}'))">${g === 'ALL' ? 'ALL GAMES' : bkEsc(g)}</button>`).join(''); }
            if (!list.length) {
                grid.innerHTML = `<div class="bk-empty">${all.length ? 'Koi product nahi mila' : 'No products uploaded by Admin'}</div>`;
                return;
            }
            grid.innerHTML = list.map(p => {
                const minPrice = Math.min(...p.plans.map(x => x.price));
                const img = p.imageUrl
                    ? `<img class="bk-img" src="${bkEsc(p.imageUrl)}" alt="">`
                    : `<div class="bk-img bk-img-ph"><i class="fas fa-key"></i></div>`;
                const tags = p.tags.map(t => `<span class="bk-tag"><i class="fas fa-tag"></i>${bkEsc(t)}</span>`).join('');
                const isMaint = !!productMaint[p.key];
                const key = bkEsc(p.key);
                const badges = (p.tags[0] ? `<span class="bk-badge">${bkEsc(p.tags[0])}</span>` : '') + (p.game ? `<span class="bk-badge g">${bkEsc(p.game)}</span>` : '');
                const media = `<div class="bk-media">${img}<div class="bk-badges">${badges}</div>${p.badge ? `<span class="bk-ribbon bk-rb-${p.badge === 'NEW' ? 'new' : (p.badge === 'HOT' ? 'hot' : 'best')}">${p.badge === 'HOT' ? '<i class="fas fa-fire"></i> ' : (p.badge === 'NEW' ? '<i class="fas fa-bolt"></i> ' : '<i class="fas fa-trophy"></i> ')}${bkEsc(p.badge)}</span>` : ''}${p.videoUrl ? `<button class="bk-play" onclick="bkVideo('${key}')" aria-label="Play"><i class="fas fa-play"></i></button>` : ''}</div>`;
                const feats = p.features.length ? `<div class="bk-feats" id="bkf-${key}">${p.features.map((f, i) => `<div class="bk-feat ${i >= 3 ? 'bk-feat-more' : ''}"><i class="fas fa-bolt" style="color:#8ea2ff;"></i> ${bkEsc(f)}</div>`).join('')}</div>${p.features.length > 3 ? `<div class="bk-more" onclick="bkToggleFeat('${key}')"><i class="fas fa-chevron-down"></i></div>` : ''}` : '';
                const rows = (!isMaint && bkPlansOpen[p.key]) ? p.plans.map((pl, i) => {
                    const av = bkStockCount(p.key, pl.pk);
                    return `<div class="bk-prow"><div><div class="pn">${bkEsc(pl.days)}</div><div class="pp">₹${Number.isInteger(pl.price) ? pl.price : pl.price.toFixed(2)}</div></div>${av < 1 ? '<span class="bk-sold">SOLD OUT</span>' : `<div style="display:flex;align-items:center;"><input class="bk-q" type="number" min="1" max="100" value="1" id="bkq-${key}-${i}"><button class="bk-bybtn" onclick="bkBuyRow('${key}', ${i})">BUY</button></div>`}</div>`;
                }).join('') : '';
                return `<div class="bk-card ${isMaint ? 'bk-card-maint' : ''}">
                    ${media}
                    <div class="bk-name">${bkEsc(p.name)}</div>
                    <div class="bk-pid" style="display:inline-flex;gap:6px;align-items:center;margin:5px auto 10px;padding:5px 10px;border:1px solid rgba(0,240,255,.45);border-radius:8px;color:#00f0ff;font-size:12px;font-weight:800;">PID ID: ${bkEsc(p.pid || 'NOT SET')}</div>
                    ${isMaint ? '<div style="text-align:center;"><span class="bk-maint-tag"><i class="fas fa-tools"></i> Under maintenance</span></div>' : ''}
                    ${feats}
                    ${isMaint ? `<button class="bk-buy bk-maint" disabled><i class="fas fa-tools"></i> Maintenance</button>` : `
                    <div class="bk-act">
                        <button onclick="bkDownload('${key}')"><i class="fas fa-file-arrow-down"></i> CHECK UPDATE FILE</button>
                        <button class="vid" onclick="bkVideo('${key}')"><i class="fas fa-play"></i> CHECK VIDEO / FEEDBACK</button>
                        <button class="bk-pk" onclick="bkTogglePlans('${key}')">${userData.role === 'Reseller' ? 'BUY RESELLER KEY' : 'PURCHASE KEY'}</button>
                    </div>${rows}`}
                </div>`;
            }).join('');
        }

        window.bkSetFilter = (t) => { bkFilter = t; renderBuyKeysGrid(); };
        let bkPlansOpen = {};
        window.bkTogglePlans = (k) => { bkPlansOpen[k] = !bkPlansOpen[k]; renderBuyKeysGrid(); };
        window.bkBuyRow = (k, i) => {
            const p = getBkProducts().find(x => x.key === k); if (!p) return;
            if (productMaint[k]) return showToast('Ye product abhi maintenance me hai', 'error');
            const el = document.getElementById(`bkq-${k}-${i}`);
            bkCurrent = p; bkPlanIdx = i; bkQty = Math.max(1, Math.min(100, parseInt(el && el.value) || 1));
            window.bkConfirmBuy();
        };
        window.bkSetGame = (g) => { bkGame = g; renderBuyKeysGrid(); };
        window.bkToggleFeat = (k) => { const e = document.getElementById('bkf-' + k); if (e) e.classList.toggle('open'); };
        window.bkVideo = (k) => { const p = getBkProducts().find(x => x.key === k); if (!p || !p.videoUrl) return showToast('Video link admin ne abhi set nahi kiya', 'error'); window.open(p.videoUrl, '_blank'); };
        window.bkSearchInput = (v) => { bkSearch = v; renderBuyKeysGrid(); };

        function bkStockCount(productKey, planKey) {
            if (bkSupPid(productKey)) return 100; // auto supplier: stock hamesha available
            const o = (liveStock[productKey] || {})[planKey] || {};
            return Object.keys(o).length;
        }

        function renderBkModal() {
            if (!bkCurrent) return;
            const p = getBkProducts().find(x => x.key === bkCurrent.key);
            if (!p) { bkCurrent = null; document.getElementById('bk-modal').classList.add('hidden'); return; }
            if (bkPlanIdx >= p.plans.length) bkPlanIdx = 0;
            document.getElementById('bk-modal-title').innerText = p.name;
            document.getElementById('bk-modal-plans').innerHTML = p.plans.map((pl, i) =>
                `<button type="button" class="bk-plan ${i === bkPlanIdx ? 'active' : ''}" onclick="bkPickPlan(${i})"><span>${bkEsc(pl.days)}</span><b>₹${pl.price.toFixed(2)}</b></button>`
            ).join('');
            document.getElementById('bk-qty').innerText = bkQty;
            const pl = p.plans[bkPlanIdx];
            document.getElementById('bk-modal-total').innerText = `₹${((pl ? pl.price : 0) * bkQty).toFixed(2)}`;
            const btn = document.getElementById('bk-confirm');
            const avail = pl ? bkStockCount(p.key, pl.pk) : 0;
            const inStock = avail >= bkQty;
            btn.disabled = !inStock;
            btn.innerText = inStock ? 'BUY KEYS' : (avail ? `ONLY ${avail} IN STOCK` : 'OUT OF STOCK');
        }

        window.bkOpenBuy = (key) => {
            const p = getBkProducts().find(x => x.key === key);
            if (!p) return showToast("Product not available!", "error");
            if (productMaint[key]) return showToast("Ye product abhi maintenance me hai", "error");
            bkCurrent = p; bkPlanIdx = 0; bkQty = 1;
            renderBkModal();
            document.getElementById('bk-modal').classList.remove('hidden');
        };
        window.bkCloseBuy = () => {
            document.getElementById('bk-modal').classList.add('hidden');
            bkCurrent = null;
        };
        window.bkPickPlan = (i) => { bkPlanIdx = i; renderBkModal(); };
        window.bkQtyChange = (d) => { bkQty = Math.max(1, bkQty + d); renderBkModal(); };
        window.bkDownload = (key) => {
            if (productMaint[key]) return showToast("Ye product abhi maintenance me hai", "error");
            const p = getBkProducts().find(x => x.key === key);
            if (!p) return;
            if (!p.downloadUrl) return showToast("Download link admin ne abhi set nahi kiya", "error");
            window.open(p.downloadUrl, '_blank');
        };

        // ---- AUTO KEY: supplier se turant key (proxy server ke through) ----
        async function bkBuyFromSupplier(p, plan, qty, totalCost, pid) {
            showToast('Auto key delivery backend not configured. Supplier API secrets must stay on the server; no balance was deducted.', 'error');
            return false;
        }

        window.bkConfirmBuy = async () => {
            if (!bkCurrent) return;
            const p = getBkProducts().find(x => x.key === bkCurrent.key);
            const plan = p && p.plans[bkPlanIdx];
            if (!plan) return showToast("Please select a duration first!", "error");
            if (productMaint[p.key]) return showToast("Ye product abhi maintenance me hai", "error");
            if (userData.status === "Banned") return showToast("Your account is suspended/banned!", "error");

            const qty = bkQty;
            const totalCost = plan.price * qty;
            const currentBal = parseFloat(userData.balance || 0.00);
            if (currentBal < totalCost) return showToast(`Insufficient funds! Required: ₹${totalCost.toFixed(2)}`, "error");
            const supPid = bkSupPid(p.key);
            if (supPid) return bkBuyFromSupplier(p, plan, qty, totalCost, supPid);
            const avail = bkStockCount(p.key, plan.pk);
            if (avail < qty) return showToast(`Stock khatam! Abhi sirf ${avail} key available hai`, "error");

            loader.classList.remove('hidden');
            const stockRef = ref(db, `key_stock/${p.key}/${plan.pk}`);
            let taken = [];
            try {
                // Atomically take exactly `qty` real keys from admin stock.
                const res = await runTransaction(stockRef, (cur) => {
                    taken = [];
                    const entries = cur ? Object.entries(cur) : [];
                    if (entries.length < qty) return; // abort: not enough stock
                    const rest = {};
                    entries.forEach(([id, val], i) => {
                        if (i < qty) taken.push({ id, key: val }); else rest[id] = val;
                    });
                    return rest;
                });
                if (!res.committed || taken.length !== qty) {
                    showToast("Stock khatam ho gaya, dobara try karo", "error");
                    return;
                }

                try {
                    const nowIso = new Date().toISOString();
                    const existing = userData.generatedKeys ? Object.values(userData.generatedKeys).filter(k => k && k.source === 'stock').length : 0;
                    for (const t of taken) {
                        await push(ref(db, `users/${currentUserId}/generatedKeys`), {
                            product: p.name, duration: plan.days, qty: 1, keyCode: t.key, timestamp: nowIso, source: 'stock', price: plan.price
                        });
                    }
                    await push(ref(db, `users/${currentUserId}/transactions`), {
                        type: "Generation", amount: totalCost,
                        description: `Generated ${qty} Key for ${p.name}`, date: new Date().toLocaleString()
                    });
                    await update(ref(db, `users/${currentUserId}`), {
                        balance: currentBal - totalCost, keyCount: existing + taken.length
                    });
                } catch (err) {
                    // Something failed after stock was taken: put the keys back.
                    await runTransaction(stockRef, (cur) => {
                        const o = cur || {};
                        taken.forEach(t => { o[t.id] = t.key; });
                        return o;
                    });
                    throw err;
                }

                payReferral(totalCost);
                window.bkCloseBuy();
                showToast("Keys generated successfully!");
                switchTab('MyKeys');
            } catch (e) {
                showToast("Purchase failed, try again!", "error");
            } finally {
                loader.classList.add('hidden');
            }
        };

        /* --- PROFILE AND ENCRYPTED SECURITY HANDLER --- */
        document.getElementById('btn-update-security').onclick = async () => {
            const currPass = document.getElementById('security-curr-pass').value;
            const newPass = document.getElementById('security-new-pass').value;
            const confPass = document.getElementById('security-conf-pass').value;

            if (!currPass || !newPass || !confPass) {
                return showToast("Please fill all password fields!", "error");
            }
            if (currPass !== userData.password) {
                return showToast("Current password does not match!", "error");
            }
            if (newPass.length < 6) {
                return showToast("New password must be at least 6 characters long!", "error");
            }
            if (newPass !== confPass) {
                return showToast("New passwords do not match each other!", "error");
            }

            loader.classList.remove('hidden');

            try {
                await update(ref(db, `users/${currentUserId}`), {
                    password: newPass
                });

                showToast("Security settings updated successfully!");
                
                document.getElementById('security-curr-pass').value = '';
                document.getElementById('security-new-pass').value = '';
                document.getElementById('security-conf-pass').value = '';

            } catch (err) {
                showToast("Database synchronization failed!", "error");
            } finally {
                loader.classList.add('hidden');
            }
        };

        /* Reseller API sample generator: generates a code template, not a live provider call. */
        document.getElementById('btn-build-api-code')?.addEventListener('click',()=>{
          const pid=document.getElementById('api-sample-pid').value.trim();
          const duration=document.getElementById('api-sample-duration').value.trim();
          const qty=Math.max(1,parseInt(document.getElementById('api-sample-qty').value||'1',10));
          const android=document.getElementById('api-sample-android').value.trim();
          const apiUrl=document.getElementById('user-api-url').value.trim().replace(/\/$/,'');
          const key=document.getElementById('user-api-key').value.trim();
          if(!pid||!duration) return showToast('Product PID aur Duration bharo','error');
          if(!apiUrl||!key) return showToast('Pehle API URL configure aur API key generate karo','error');
          const code=`<?php
$apiUrl = '${apiUrl.replace(/'/g, "\\'")}';
// Current ARYAN API accepts a Firebase ID token (not the personal API key yet).
$firebaseIdToken = 'PASTE_FIREBASE_ID_TOKEN_HERE';
$data = [
  'pid_id' => '${pid.replace(/'/g, "\\'")}',
  'duration' => '${duration.replace(/'/g, "\\'")}',
  'quantity' => ${qty}
];
$ch = curl_init($apiUrl . '/api/v1/order');
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($data), CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $firebaseIdToken], CURLOPT_TIMEOUT => 25]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo $httpCode . ': ' . $response;
// Android ID is a placeholder until the API backend explicitly supports it.
?>`;
          document.getElementById('api-sample-code').value=code;
        });
        document.getElementById('btn-copy-api-code')?.addEventListener('click',async()=>{const v=document.getElementById('api-sample-code').value;if(!v)return showToast('Pehle code generate karo','error');try{await navigator.clipboard.writeText(v);showToast('API code copied');}catch(e){showToast('Copy failed','error');}});

        /* Personal API token display/generation. Backend must validate this token before production use. */
        document.getElementById('api-key-eye')?.addEventListener('click',()=>{const el=document.getElementById('user-api-key'); el.type=el.type==='password'?'text':'password'; document.getElementById('api-key-eye').textContent=el.type==='password'?'SHOW':'HIDE';});
        document.getElementById('btn-copy-api-key')?.addEventListener('click',async()=>{const k=document.getElementById('user-api-key').value; if(!k)return showToast('Pehle API key generate karo','error'); try{await navigator.clipboard.writeText(k);showToast('API key copied');}catch(e){showToast('Copy unavailable','error');}});
        document.getElementById('btn-generate-api-key')?.addEventListener('click',async()=>{if(!currentUserId)return showToast('Login required','error'); if(!confirm('Nayi API key banane par purani key replace ho jayegi. Continue?'))return; try{const bytes=new Uint8Array(32); crypto.getRandomValues(bytes); const token='ary_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''); await set(ref(db,`users/${currentUserId}/apiKey`),token); document.getElementById('user-api-key').value=token; document.getElementById('user-api-key').type='text'; showToast('Personal API key generated. Backend activation is still required.');}catch(e){showToast('API key save failed. Check Firebase rules.','error');}});
        onValue(ref(db,'site_settings/public_api'),snap=>{const d=snap.val()||{}; const el=document.getElementById('user-api-url'); if(el)el.value=d.baseUrl||''; const ch=document.getElementById('api-channel-line'); if(ch)ch.textContent=d.channelUrl?'Official ARYAN Channel: '+d.channelUrl:'Official channel not configured';});
        if(currentUserId){ get(ref(db,`users/${currentUserId}/apiKey`)).then(s=>{if(s.exists())document.getElementById('user-api-key').value=s.val();}).catch(()=>{}); }

        /* --- LOGIN & REGISTRATION FLOWS --- */
        async function continueWithGoogle() {
            const loaderEl=document.getElementById('loader'); loaderEl.classList.remove('hidden');
            try {
              const provider=new GoogleAuthProvider(); provider.setCustomParameters({prompt:'select_account'});
              const result=await signInWithPopup(auth,provider); const g=result.user; const userRef=ref(db,`users/${g.uid}`); const snap=await get(userRef);
              if(!snap.exists()) await set(userRef,{username:(g.displayName||g.email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g,'').slice(0,24),name:g.displayName||'',email:g.email||'',balance:0,role:'User',status:'Active',authProvider:'google',createdAt:Date.now(),photoURL:g.photoURL||''});
              const fresh=await get(userRef); if(fresh.val()?.status==='Banned') { await signOut(auth); throw new Error('Account suspended'); }
              localStorage.setItem('panel_uid',g.uid); initUserSession(g.uid); showToast('Google sign-in successful');
            } catch(e) { showToast(e.message==='Account suspended'?'Your account is suspended':'Google sign-in failed. Firebase Console me Google provider enable karein.','error'); }
            finally { loaderEl.classList.add('hidden'); }
        }
        document.getElementById('btn-google-login').onclick=continueWithGoogle;
        document.getElementById('btn-google-signup').onclick=continueWithGoogle;

        document.getElementById('btn-login').onclick = async () => {
            const username = document.getElementById('login-username').value.trim().toLowerCase();
            const pass = document.getElementById('login-pass').value;

            if(!username || !pass) return showToast("Enter all required credentials", "error");
            loader.classList.remove('hidden');

            try {
                const userSnapshot = await get(ref(db, 'users'));
                let matchedUid = null;
                let userObj = null;

                if (userSnapshot.exists()) {
                    userSnapshot.forEach((childSnapshot) => {
                        const data = childSnapshot.val();
                        if (((data.username && data.username.toLowerCase() === username) || (data.email && data.email.trim().toLowerCase() === username)) && data.password === pass) {
                            matchedUid = childSnapshot.key;
                            userObj = data;
                        }
                    });
                }

                if (matchedUid) {
                    if (userObj.status === "Banned") {
                        showToast("Your account is suspended/banned!", "error");
                    } else {
                        localStorage.setItem('panel_uid', matchedUid);
                        initUserSession(matchedUid);
                        showToast("Logged in securely!");
                    }
                } else {
                    showToast("Invalid Username or Password", "error");
                }
            } catch (err) {
                showToast("System connectivity error", "error");
            } finally {
                loader.classList.add('hidden');
            }
        };

        document.getElementById('btn-signup').onclick = async () => {
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-gmail').value.trim();
            const username = document.getElementById('signup-username').value.trim().toLowerCase();
            const pass = document.getElementById('signup-pass').value;

            if(!name || !email || !username || pass.length < 6) {
                return showToast("All fields are required, password min 6 chars", "error");
            }

            loader.classList.remove('hidden');

            try {
                const userSnapshot = await get(ref(db, 'users'));
                let usernameExists = false;

                if (userSnapshot.exists()) {
                    userSnapshot.forEach((childSnapshot) => {
                        const data = childSnapshot.val();
                        if (data.username && data.username.toLowerCase() === username) {
                            usernameExists = true;
                        }
                    });
                }

                if (usernameExists) {
                    showToast("Username already taken!", "error");
                    loader.classList.add('hidden');
                    return;
                }

                const newUid = "UID-" + Math.floor(100000 + Math.random() * 900000) + "-" + username;

                await set(ref(db, `users/${newUid}`), { 
                    name: name,
                    email: email,
                    username: username, 
                    password: pass,
                    referredBy: localStorage.getItem('panel_ref') || '',
                    joinedAt: Date.now(),
                    balance: 0.00,
                    keyCount: 0,
                    role: "User",
                    status: "Active"
                });

                localStorage.setItem('panel_uid', newUid);
                initUserSession(newUid);
                showToast("Account registered successfully!");

            } catch (err) { 
                showToast("Registration configurations failed", "error"); 
            } finally {
                loader.classList.add('hidden');
            }
        };

        document.getElementById('btn-logout').onclick = async () => {
            if(sidebar.classList.contains('active')) toggleSidebar();
            localStorage.removeItem('panel_uid');
            currentUserId = null;
            mainApp.style.display = 'none';
            authScreen.classList.remove('hidden');
            document.getElementById('login-username').value = '';
            document.getElementById('login-pass').value = '';
            showToast("Logged out successfully");
        };
        window.__aryanAppBooted = true;
        if (window.__aryanBootFallback) clearTimeout(window.__aryanBootFallback);
