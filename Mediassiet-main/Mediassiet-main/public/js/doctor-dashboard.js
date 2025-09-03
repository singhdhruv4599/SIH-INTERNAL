// js/doctor-dashboard.js
const todayISO = new Date().toISOString().split('T')[0];
const demoAppointments = [
  { id:'a1', appointment_date: todayISO, appointment_time:'10:00 AM', patient:'John Doe', contact:'+91 90000 11111', reason:'Follow-up', status:'scheduled' },
  { id:'a2', appointment_date: todayISO, appointment_time:'11:30 AM', patient:'Aarti Mehta', contact:'+91 90000 22222', reason:'Consultation', status:'scheduled' },
  { id:'a3', appointment_date: '2099-01-01', appointment_time:'04:00 PM', patient:'Rahul Verma', contact:'+91 90000 33333', reason:'General', status:'completed' }
];

async function guard() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return location.href='login.html';
  await Auth.init();
  const u = Auth.getCurrentUser();
  if (u?.role && u.role !== CONFIG.ROLES.DOCTOR) {
    if (u.role === CONFIG.ROLES.HOSPITAL) location.href='hospital-dashboard.html';
    if (u.role === CONFIG.ROLES.PATIENT) location.href='patient-dashboard.html';
  }
}

function setActive(text){
  document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
  [...document.querySelectorAll('.nav-link')].find(l=>l.textContent.trim().startsWith(text))?.classList.add('active');
}

function showToday(){
  setActive('Today');
  const list = demoAppointments.filter(a => a.appointment_date === todayISO && a.status === 'scheduled');
  const html = `
    <div class="dashboard-header"><h2 class="dashboard-title">Today's Schedule</h2><p style="color:var(--muted)">Appointments for ${new Date().toDateString()}</p></div>
    <div class="data-card"><div class="data-card-body" id="todayWrap">${renderTable(list,true)}</div></div>
  `;
  document.getElementById('docContent').innerHTML = html;
}

function renderTable(list, showActions=false){
  if (!list.length) return `<p>No appointments</p>`;
  return `
    <div style="overflow:auto">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="text-align:left;padding:.6rem;border-bottom:1px solid #eef2f6">Date</th>
          <th style="text-align:left;padding:.6rem;border-bottom:1px solid #eef2f6">Time</th>
          <th style="text-align:left;padding:.6rem;border-bottom:1px solid #eef2f6">Patient</th>
          <th style="text-align:left;padding:.6rem;border-bottom:1px solid #eef2f6">Reason</th>
          <th style="text-align:left;padding:.6rem;border-bottom:1px solid #eef2f6">Status</th>
          ${showActions?'<th style="padding:.6rem;border-bottom:1px solid #eef2f6">Action</th>':''}
        </tr></thead>
        <tbody>
          ${list.map(a=>`
            <tr>
              <td style="padding:.6rem">${new Date(a.appointment_date).toLocaleDateString()}</td>
              <td style="padding:.6rem">${a.appointment_time}</td>
              <td style="padding:.6rem">${a.patient} <div style="color:var(--muted);font-size:.85rem">${a.contact}</div></td>
              <td style="padding:.6rem">${a.reason}</td>
              <td style="padding:.6rem"><span class="badge badge-green">${a.status}</span></td>
              ${showActions?`<td style="padding:.6rem"><button class="btn" onclick="markComplete('${a.id}')">Complete</button> <button class="btn-outline" onclick="cancelApt('${a.id}')">Cancel</button></td>`:''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showAppointments(){
  setActive('Appointments');
  const html = `
    <div class="dashboard-header"><h2 class="dashboard-title">All Appointments</h2><p style="color:var(--muted)">Full list with actions</p></div>
    <div class="data-card"><div class="data-card-body" id="allWrap">${renderTable(demoAppointments,true)}</div></div>
  `;
  document.getElementById('docContent').innerHTML = html;
}

function showPatients(){
  setActive('Patients');
  // quick dummy rollup
  const patients = [...new Map(demoAppointments.map(a=>[a.patient, a])).values()];
  const html = `
    <div class="dashboard-header"><h2 class="dashboard-title">Patients</h2><p style="color:var(--muted)">Recent patients</p></div>
    <div class="data-grid">
      ${patients.map(p=>`
        <div class="data-card">
          <div class="data-card-header"><div><strong>${p.patient}</strong><div style="color:var(--muted);font-size:.9rem">${p.contact}</div></div><span class="badge badge-green">Active</span></div>
          <div class="data-card-body">
            <div><strong>Last Visit:</strong> ${new Date(p.appointment_date).toLocaleDateString()} at ${p.appointment_time}</div>
            <div style="margin-top:.6rem"><button class="btn-outline" onclick="alert('Open patient file for ${p.patient}')">Open File</button></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('docContent').innerHTML = html;
}

async function showProfile(){
  setActive('Profile');
  const user = (await supabaseClient.auth.getUser()).data.user;
  const full = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor';
  const html = `
    <div class="dashboard-header"><h2 class="dashboard-title">Profile</h2></div>
    <div class="data-card">
      <div class="data-card-body" style="display:flex;gap:1rem;align-items:center">
        <div class="avatar">${full.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
        <div>
          <div style="font-weight:800">${full}</div>
          <div style="color:var(--muted)">${user?.email||''}</div>
          <div style="color:var(--muted);margin-top:.4rem">Role: Doctor</div>
          <div style="margin-top:.6rem"><button class="btn-outline" onclick="Auth.signOut()">Logout</button></div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('docContent').innerHTML = html;
}

function showSettings(){
  setActive('Settings');
  document.getElementById('docContent').innerHTML = `
    <div class="dashboard-header"><h2 class="dashboard-title">Settings</h2></div>
    <div class="data-card"><div class="data-card-body">
      <label><input type="checkbox" checked> Appointment reminders</label><br/>
      <label><input type="checkbox"> Email summaries</label><br/>
      <button class="btn" style="margin-top:.6rem" onclick="alert('Saved')">Save</button>
    </div></div>
  `;
}

window.markComplete = (id) => {
  const apt = demoAppointments.find(a => a.id === id);
  if (apt) { apt.status='completed'; showToday(); showAppointments(); alert('Appointment marked completed'); }
};
window.cancelApt = (id) => {
  const apt = demoAppointments.find(a => a.id === id);
  if (apt && confirm('Cancel this appointment?')) { apt.status='cancelled'; showToday(); showAppointments(); alert('Appointment cancelled'); }
};

function filterAppointments(){
  const q = (document.getElementById('docSearch').value||'').toLowerCase();
  const filtered = demoAppointments.filter(a => (a.patient + a.reason).toLowerCase().includes(q));
  // Update current view if it's appointments
  const active = [...document.querySelectorAll('.nav-link')].find(l=>l.classList.contains('active'))?.textContent || '';
  if (active.includes('Appointments')){
    document.getElementById('docContent').querySelector('#allWrap').innerHTML = renderTable(filtered,true);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await guard();
  showToday();
});
