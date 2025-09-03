// js/hospital-dashboard.js
// Hospital dashboard with Patient-like UI shell & green theme
// Requires: js/config.js and js/auth.js

/* ---------------- Init ---------------- */
(async function initHospitalDashboard() {
    try {
      if (!window.supabaseClient) {
        console.error('Supabase not initialized - ensure js/config.js is loaded');
        document.getElementById('contentArea').innerHTML = '<p style="color:red">Auth not initialized.</p>';
        return;
      }
  
      // Check session
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = 'login.html';
        return;
      }
  
      // Auth helper
      if (window.Auth && typeof Auth.init === 'function') {
        await Auth.init();
      }
  
      // Role guard
      const user = Auth.getCurrentUser();
      const role = user?.user_metadata?.role || user?.role;
      if (role && role !== CONFIG.ROLES.HOSPITAL) {
        if (role === CONFIG.ROLES.DOCTOR) return window.location.href = 'doctor-dashboard.html';
        return window.location.href = 'patient-dashboard.html';
      }
  
      // Load topbar user
      const userMeta = (session.user?.user_metadata) || {};
      const email = session.user.email || userMeta.email || 'admin@hospital.com';
      const orgName = userMeta.hospital_name || 'Your Hospital';
      const fullName = userMeta.full_name || orgName || email.split('@')[0];
      const initials = fullName.split(' ').map(s => s.charAt(0)).slice(0,2).join('').toUpperCase();
  
      document.getElementById('userAvatar').textContent = initials || 'H';
      document.getElementById('userName').textContent = fullName || 'Hospital Admin';
      document.getElementById('userEmail').textContent = email;
  
      // Expose globals for handlers
      window.applyFilter = applyFilter;
      window.showOverview = showOverview;
      window.showBeds = showBeds;
      window.showEquipment = showEquipment;
      window.showStaff = showStaff;
      window.showSettings = showSettings;
      window.toggleUserMenu = toggleUserMenu;
      window.logout = logout;
      window.showNotifications = showNotifications;
  
      // Default view
      showOverview();
  
    } catch (err) {
      console.error('Init error:', err);
      document.getElementById('contentArea').innerHTML = '<p style="color:red">Initialization failed. Open console.</p>';
    }
  })();
  
  /* ---------------- Demo / State ---------------- */
  const BED_TYPES = ['ICU','General','Emergency'];
  const EQUIP_TYPES = ['Ventilator','MRI Machine','X-Ray Machine','CT Scanner','Ultrasound','ECG Machine'];
  
  const state = {
    status:'available',
    beds: [
      { type:'ICU', total:10, available:3 },
      { type:'General', total:60, available:40 },
      { type:'Emergency', total:8, available:2 }
    ],
    doctors: { total: 25, available: 18 },
    equipment: [
      { type:'Ventilator', total:10, available:8 },
      { type:'MRI Machine', total:2, available:1 },
      { type:'X-Ray Machine', total:3, available:2 },
      { type:'CT Scanner', total:1, available:1 },
      { type:'Ultrasound', total:4, available:3 },
      { type:'ECG Machine', total:6, available:5 }
    ]
  };
  
  /* ---------------- UI Helpers ---------------- */
  function setActiveNav(key) {
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const map = { overview:'Overview', beds:'Beds', equipment:'Equipment', staff:'Staff', settings:'Settings' };
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.textContent.trim().startsWith(map[key] || '')) link.classList.add('active');
    });
  }
  
  function toggleUserMenu() {
    const el = document.getElementById('userDropdown');
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
  }
  
  function showNotifications() {
    alert('No new notifications (demo).');
  }
  
  async function logout() {
    try { await supabaseClient.auth.signOut(); } catch (e) {}
    window.location.href = 'login.html';
  }
  
  /* ---------------- Sections ---------------- */
  function showOverview() {
    setActiveNav('overview');
    const container = document.getElementById('contentArea');
  
    const totalBeds = state.beds.reduce((s,b)=>s+b.total,0);
    const availBeds = state.beds.reduce((s,b)=>s+b.available,0);
    const bedPct = totalBeds ? Math.round((availBeds/totalBeds)*100) : 0;
  
    container.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Overview</h2>
        <p class="dashboard-subtitle">Real-time hospital status & summaries</p>
      </div>
  
      <div class="stats-grid">
        <div class="stat-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:700">Hospital Status</div>
              <div style="color:var(--muted);font-size:.9rem">Current load indicator</div>
            </div>
            <span class="status-badge ${state.status==='available'?'status-available':'status-full'}">${state.status==='available'?'Available':'Full'}</span>
          </div>
          <div style="margin-top:.75rem;display:flex;gap:.5rem">
            <button class="btn" onclick="toggleStatus()">${state.status==='available'?'Mark as Full':'Mark as Available'}</button>
          </div>
        </div>
  
        <div class="stat-card">
          <div style="font-weight:700">Bed Occupancy</div>
          <div style="color:var(--muted);font-size:.9rem">Available / Total</div>
          <div style="margin-top:.5rem;font-size:1.4rem;font-weight:800">${availBeds} / ${totalBeds}</div>
          <div style="background:#e5e7eb;height:10px;border-radius:8px;margin-top:.6rem">
            <div style="height:10px;border-radius:8px;width:${bedPct}%;background:#10b981"></div>
          </div>
        </div>
  
        <div class="stat-card">
          <div style="font-weight:700">Doctor Availability</div>
          <div style="color:var(--muted);font-size:.9rem">On duty now</div>
          <div style="margin-top:.5rem;font-size:1.4rem;font-weight:800">${state.doctors.available} / ${state.doctors.total}</div>
          <div style="margin-top:.6rem;display:flex;gap:.5rem">
            <button class="btn-outline" onclick="showStaff()">Manage Staff</button>
          </div>
        </div>
      </div>
  
      <div class="data-grid">
        ${state.beds.map(b => `
          <div class="data-card">
            <div class="data-card-header">
              <div>
                <h3 class="data-card-title">${escapeHtml(b.type)} Beds</h3>
                <div style="font-size:.9rem;color:var(--muted)">Available: ${b.available} / ${b.total}</div>
              </div>
              <div><span class="status-badge ${b.available>0?'status-available':'status-full'}">${b.available>0?'Available':'Full'}</span></div>
            </div>
            <div class="data-card-body">
              <div style="display:flex;justify-content:space-between;margin-top:.25rem">
                <div><strong>Occupied:</strong> ${Math.max(b.total - b.available,0)}</div>
                <button class="btn-outline" onclick="showBeds()">Update</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  
    // expose toggle
    window.toggleStatus = () => {
      state.status = state.status==='available' ? 'full' : 'available';
      showOverview();
    };
  }
  
  function showBeds() {
    setActiveNav('beds');
    const container = document.getElementById('contentArea');
  
    let rows = BED_TYPES.map(t=>{
      const rec = state.beds.find(b=>b.type===t) || { total:0, available:0 };
      return `
        <tr>
          <td style="padding:.6rem 0">${t}</td>
          <td><input data-bed="${t}-total" type="number" min="0" value="${rec.total}" class="search-input" style="height:38px"></td>
          <td><input data-bed="${t}-avail" type="number" min="0" value="${rec.available}" class="search-input" style="height:38px"></td>
          <td style="text-align:center">${Math.max(rec.total - rec.available,0)}</td>
        </tr>
      `;
    }).join('');
  
    container.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Manage Beds</h2>
        <p class="dashboard-subtitle">Update per-bed-type capacity & availability</p>
      </div>
  
      <div class="data-card">
        <div class="data-card-body">
          <div style="overflow:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th style="text-align:left;padding:.5rem 0">Type</th>
                  <th style="text-align:left">Total</th>
                  <th style="text-align:left">Available</th>
                  <th style="text-align:center">Occupied</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div style="margin-top:1rem;display:flex;gap:.5rem">
            <button class="btn" onclick="saveBeds()">Save Beds</button>
            <button class="btn-outline" onclick="showOverview()">Back to Overview</button>
          </div>
        </div>
      </div>
    `;
  
    window.saveBeds = async () => {
      BED_TYPES.forEach(t=>{
        const total = Number(document.querySelector(`[data-bed="${t}-total"]`).value||0);
        const available = Number(document.querySelector(`[data-bed="${t}-avail"]`).value||0);
        const idx = state.beds.findIndex(b=>b.type===t);
        if (idx>=0) state.beds[idx] = { type:t, total, available };
        else state.beds.push({ type:t, total, available });
      });
  
      // (Optional) Save to Supabase: beds table (if you have one)
      // try {
      //   const uid = (await supabaseClient.auth.getUser()).data.user?.id;
      //   await supabaseClient.from('hospital_beds').upsert(state.beds.map(b=>({ owner_id: uid, ...b })));
      // } catch(e){ console.log('beds upsert skipped', e); }
  
      alert('Bed counts updated!');
      showOverview();
    };
  }
  
  function showEquipment() {
    setActiveNav('equipment');
    const container = document.getElementById('contentArea');
  
    let rows = EQUIP_TYPES.map(t=>{
      const rec = state.equipment.find(e=>e.type===t) || { total:0, available:0 };
      return `
        <tr>
          <td style="padding:.6rem 0">${t}</td>
          <td><input data-eq="${t}-total" type="number" min="0" value="${rec.total}" class="search-input" style="height:38px"></td>
          <td><input data-eq="${t}-avail" type="number" min="0" value="${rec.available}" class="search-input" style="height:38px"></td>
          <td style="text-align:center">${Math.max(rec.total - rec.available,0)}</td>
        </tr>
      `;
    }).join('');
  
    container.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Manage Equipment</h2>
        <p class="dashboard-subtitle">Track critical equipment availability</p>
      </div>
  
      <div class="data-card">
        <div class="data-card-body">
          <div style="overflow:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th style="text-align:left;padding:.5rem 0">Equipment</th>
                  <th style="text-align:left">Total</th>
                  <th style="text-align:left">Available</th>
                  <th style="text-align:center">In Use</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div style="margin-top:1rem;display:flex;gap:.5rem">
            <button class="btn" onclick="saveEquip()">Save Equipment</button>
            <button class="btn-outline" onclick="showOverview()">Back to Overview</button>
          </div>
        </div>
      </div>
    `;
  
    window.saveEquip = async () => {
      EQUIP_TYPES.forEach(t=>{
        const total = Number(document.querySelector(`[data-eq="${t}-total"]`).value||0);
        const available = Number(document.querySelector(`[data-eq="${t}-avail"]`).value||0);
        const idx = state.equipment.findIndex(e=>e.type===t);
        if (idx>=0) state.equipment[idx] = { type:t, total, available };
        else state.equipment.push({ type:t, total, available });
      });
  
      // (Optional) Save to Supabase: equipment table (if you have one)
      // try {
      //   const uid = (await supabaseClient.auth.getUser()).data.user?.id;
      //   await supabaseClient.from('hospital_equipment').upsert(state.equipment.map(e=>({ owner_id: uid, ...e })));
      // } catch(e){ console.log('equip upsert skipped', e); }
  
      alert('Equipment updated!');
      showOverview();
    };
  }
  
  function showStaff() {
    setActiveNav('staff');
    const container = document.getElementById('contentArea');
  
    container.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Staff</h2>
        <p class="dashboard-subtitle">Manage doctor availability</p>
      </div>
  
      <div class="data-card">
        <div class="data-card-body">
          <div class="stats-grid" style="margin-bottom:0">
            <div class="stat-card">
              <div style="font-weight:700">Doctors On Duty</div>
              <div style="font-size:1.4rem;font-weight:800;margin-top:.4rem">${state.doctors.available} / ${state.doctors.total}</div>
              <div style="display:flex;gap:.5rem;margin-top:.6rem">
                <button class="btn" onclick="changeDocAvail(1)">+1 On Duty</button>
                <button class="btn-outline" onclick="changeDocAvail(-1)">-1 On Duty</button>
              </div>
            </div>
          </div>
          <div style="margin-top:1rem">
            <button class="btn-outline" onclick="showOverview()">Back to Overview</button>
          </div>
        </div>
      </div>
    `;
  
    window.changeDocAvail = (delta) => {
      const next = Math.min(Math.max(0, state.doctors.available + delta), state.doctors.total);
      state.doctors.available = next;
      showStaff();
    };
  }
  
  function showSettings() {
    setActiveNav('settings');
    const container = document.getElementById('contentArea');
  
    container.innerHTML = `
      <div class="dashboard-header"><h2 class="dashboard-title">Settings</h2></div>
      <div class="data-card">
        <div class="data-card-body">
          <div style="display:grid;gap:.75rem">
            <label><input type="checkbox" checked> Email notifications</label>
            <label><input type="checkbox"> SMS alerts</label>
            <label>Theme: 
              <select id="themeSelect">
                <option value="hospital">Hospital (Green)</option>
                <option value="patient">Patient (Blue)</option>
                <option value="doctor">Doctor (Indigo)</option>
              </select>
            </label>
            <button class="btn" onclick="saveSettings()">Save Settings</button>
          </div>
        </div>
      </div>
    `;
  
    window.saveSettings = () => {
      alert('Settings saved (demo).');
    };
  }
  
  /* ---------------- Search Filter ---------------- */
  function applyFilter() {
    const q = (document.getElementById('globalSearch').value || '').toLowerCase();
  
    // Find active tab
    const activeText = Array.from(document.querySelectorAll('.nav-link')).find(n => n.classList.contains('active'))?.textContent || '';
  
    if (activeText.includes('Overview')) {
      // Simple filter: if query contains bed or equipment types, jump to sections
      if (BED_TYPES.some(b => b.toLowerCase().includes(q)) && q) return showBeds();
      if (EQUIP_TYPES.some(e => e.toLowerCase().includes(q)) && q) return showEquipment();
    } else if (activeText.includes('Beds')) {
      // Filter rows by type text
      document.querySelectorAll('[data-bed]').forEach(inp=>{
        const row = inp.closest('tr');
        const type = row?.children?.[0]?.textContent?.toLowerCase() || '';
        row.style.display = type.includes(q) ? '' : 'none';
      });
    } else if (activeText.includes('Equipment')) {
      document.querySelectorAll('[data-eq]').forEach(inp=>{
        const row = inp.closest('tr');
        const type = row?.children?.[0]?.textContent?.toLowerCase() || '';
        row.style.display = type.includes(q) ? '' : 'none';
      });
    } else if (activeText.includes('Staff')) {
      // nothing fancy; keeping it simple for demo
    } else {
      showOverview();
    }
  }
  
  /* ---------------- Utils ---------------- */
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"'`=\/]/g, function (s) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#96;','=':'&#61;' })[s];
    });
  }
      