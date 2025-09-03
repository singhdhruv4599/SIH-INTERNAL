// js/doctor-dashboard.js

/* ========= Demo Data ========= */
const todayISO = new Date().toISOString().split('T')[0];

const demoAppointments = [
  { id:'a1', appointment_date: todayISO, appointment_time:'9:00 AM',  patient:'John Doe',     contact:'+91 90000 11111', reason:'General Checkup', status:'scheduled', tag:'Confirmed' },
  { id:'a2', appointment_date: todayISO, appointment_time:'10:30 AM', patient:'Sarah Wilson', contact:'+91 90000 22222', reason:'Follow-up',       status:'scheduled', tag:'Pending'   },
  { id:'a3', appointment_date: todayISO, appointment_time:'2:00 PM',  patient:'Michael Brown',contact:'+91 90000 33333', reason:'Consultation',   status:'scheduled', tag:'Confirmed' },
  { id:'a4', appointment_date: '2099-01-01', appointment_time:'4:00 PM', patient:'Rahul Verma', contact:'+91 90000 44444', reason:'General', status:'completed', tag:'Done' }
];

/* ========= Auth guard (as-is) ========= */
async function guard() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return (location.href='login.html');
  await Auth.init();
  const u = Auth.getCurrentUser();
  if (u?.role && u.role !== CONFIG.ROLES.DOCTOR) {
    if (u.role === CONFIG.ROLES.HOSPITAL) return (location.href='hospital-dashboard.html');
    if (u.role === CONFIG.ROLES.PATIENT)  return (location.href='patient-dashboard.html');
  }
}

/* ========= Helpers ========= */
function setActive(text){
  document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
  [...document.querySelectorAll('.nav-link')]
    .find(l=>l.textContent.trim().toLowerCase().startsWith(text.toLowerCase()))
    ?.classList.add('active');
}

function uniquePatientsCount(list){
  return new Set(list.map(a => a.patient)).size;
}

function pill(text, tone='green'){
  const tones = {
    green:  'bg-emerald-100 text-emerald-700',
    gray:   'bg-slate-100 text-slate-700',
    yellow: 'bg-amber-100 text-amber-700',
    red:    'bg-rose-100 text-rose-700',
    blue:   'bg-blue-100 text-blue-700'
  };
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${tones[tone]||tones.gray}">${text}</span>`;
}

/* ========= Screenshot-like Widgets ========= */
function renderStatCards(){
  // Derived metrics similar to screenshot
  const today = demoAppointments.filter(a => a.appointment_date === todayISO && a.status === 'scheduled');
  const totalPatients = uniquePatientsCount(demoAppointments);
  const pending = demoAppointments.filter(a => (a.tag||'').toLowerCase()==='pending').length;
  const availableSlots = Math.max(0, 12 - today.length); // demo logic

  const card = (title, value, sub, icon, accent='') => `
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-slate-500 text-sm">${title}</div>
          <div class="mt-2 text-3xl font-extrabold tracking-tight">${value}</div>
          <div class="mt-2 text-xs text-emerald-600 flex items-center gap-1">${sub}</div>
        </div>
        <div class="h-10 w-10 rounded-lg flex items-center justify-center ${accent}">
          <i class="${icon} text-white text-lg"></i>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      ${card(`Today's Appointments`, today.length, `↑ ${Math.max(1,today.length%5)} more than yesterday`, 'fa-regular fa-calendar-days', 'bg-blue-500')}
      ${card(`Total Patients`, totalPatients, `↑ ${Math.max(1,totalPatients%13)} new this month`, 'fa-solid fa-user-group', 'bg-emerald-500')}
      ${card(`Pending Reviews`, pending, `— No change`, 'fa-regular fa-clipboard', 'bg-amber-500')}
      ${card(`Available Slots`, availableSlots, `↑ ${Math.max(1,availableSlots)} slots added`, 'fa-regular fa-clock', 'bg-teal-500')}
    </div>
  `;
}

function renderSchedule(items){
  if(!items.length) return `<div class="text-slate-500">No appointments today.</div>`;

  const row = a => `
    <div class="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
      <div class="flex items-center gap-4">
        <span class="inline-flex items-center font-bold text-slate-700 bg-slate-100 rounded-lg px-3 py-1.5 w-[94px] justify-center">${a.appointment_time}</span>
        <div>
          <div class="font-semibold text-slate-800">${a.patient}</div>
          <div class="text-xs text-slate-500">${a.reason}</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        ${pill(a.tag === 'Pending' ? 'Pending' : 'Confirmed', a.tag === 'Pending' ? 'yellow' : 'green')}
        <button class="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onclick="markComplete('${a.id}')">Complete</button>
        <button class="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50" onclick="cancelApt('${a.id}')">Cancel</button>
      </div>
    </div>
  `;

  return `<div class="space-y-3">${items.map(row).join('')}</div>`;
}

function renderQuickActions(){
  const actionBtn = (icon, text, tone) => `
    <button class="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3">
      <span class="h-9 w-9 flex items-center justify-center rounded-lg ${tone} text-white">
        <i class="${icon}"></i>
      </span>
      <span class="font-semibold text-slate-800">${text}</span>
    </button>
  `;
  return `
    <div class="bg-white rounded-xl shadow-sm border border-slate-200">
      <div class="px-5 py-4 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
        <i class="fa-regular fa-bolt"></i> Quick Actions
      </div>
      <div class="p-4 space-y-3">
        ${actionBtn('fa-solid fa-user-plus','Add New Patient','bg-blue-600')}
        ${actionBtn('fa-regular fa-calendar-xmark','Block Time Slot','bg-slate-500')}
        ${actionBtn('fa-solid fa-prescription','Write Prescription','bg-emerald-600')}
        ${actionBtn('fa-regular fa-file-lines','View Medical Records','bg-slate-700')}
      </div>
    </div>
  `;
}

/* ========= Views ========= */
function showToday(){
  setActive('Today');

  const todayList = demoAppointments
    .filter(a => a.appointment_date === todayISO && a.status === 'scheduled')
    .sort((a,b) => new Date(`1970/01/01 ${a.appointment_time}`) - new Date(`1970/01/01 ${b.appointment_time}`));

  const html = `
    <div class="dashboard-header">
      <h2 class="dashboard-title">Overview</h2>
      <p class="text-slate-500">Welcome back, here is today's summary.</p>
    </div>

    ${renderStatCards()}

    <div class="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200">
          <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-regular fa-calendar"></i> Today's Schedule</div>
            <button class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
              <i class="fa-solid fa-plus"></i> Add Appointment
            </button>
          </div>
          <div class="p-4">
            ${renderSchedule(todayList)}
          </div>
        </div>
      </div>

      <div>
        ${renderQuickActions()}
      </div>
    </div>
  `;

  document.getElementById('docContent').innerHTML = html;
}

function showAppointments(){
  setActive('Appointments');

  const row = a => `
    <tr class="border-b last:border-0">
      <td class="px-4 py-3">${new Date(a.appointment_date).toLocaleDateString()}</td>
      <td class="px-4 py-3">${a.appointment_time}</td>
      <td class="px-4 py-3">
        <div class="font-medium">${a.patient}</div>
        <div class="text-xs text-slate-500">${a.contact}</div>
      </td>
      <td class="px-4 py-3">${a.reason}</td>
      <td class="px-4 py-3">${pill(a.status==='scheduled'?'Scheduled':a.status, a.status==='scheduled'?'blue':a.status==='completed'?'green':a.status==='cancelled'?'red':'gray')}</td>
      <td class="px-4 py-3 text-right">
        <button class="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 mr-2" onclick="markComplete('${a.id}')">Complete</button>
        <button class="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50" onclick="cancelApt('${a.id}')">Cancel</button>
      </td>
    </tr>
  `;

  const html = `
    <div class="dashboard-header">
      <h2 class="dashboard-title">All Appointments</h2>
      <p class="text-slate-500">Manage every appointment in one place.</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-auto">
        <table class="min-w-[720px] w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr class="text-left text-slate-600 text-sm">
              <th class="px-4 py-3 font-semibold">Date</th>
              <th class="px-4 py-3 font-semibold">Time</th>
              <th class="px-4 py-3 font-semibold">Patient</th>
              <th class="px-4 py-3 font-semibold">Reason</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            ${demoAppointments.map(row).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('docContent').innerHTML = html;
}

function showPatients(){
  setActive('Patients');
  const patients = [...new Map(demoAppointments.map(a=>[a.patient, a])).values()];

  const card = p => `
    <div class="bg-white rounded-xl shadow-sm border border-slate-200">
      <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-slate-800">${p.patient}</div>
          <div class="text-xs text-slate-500">${p.contact}</div>
        </div>
        ${pill('Active','green')}
      </div>
      <div class="p-4 text-sm">
        <div><span class="font-semibold">Last Visit:</span> ${new Date(p.appointment_date).toLocaleDateString()} at ${p.appointment_time}</div>
        <button class="mt-3 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50" onclick="alert('Open patient file for ${p.patient}')">Open File</button>
      </div>
    </div>
  `;

  const html = `
    <div class="dashboard-header">
      <h2 class="dashboard-title">Patients</h2>
      <p class="text-slate-500">Recent & active patients.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      ${patients.map(card).join('')}
    </div>
  `;

  document.getElementById('docContent').innerHTML = html;
}

async function showProfile(){
  setActive('Profile');
  const user = (await supabaseClient.auth.getUser()).data.user;
  const full = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor';
  const initials = full.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();

  const html = `
    <div class="dashboard-header">
      <h2 class="dashboard-title">Profile</h2>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
      <div class="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold">${initials}</div>
      <div>
        <div class="font-bold text-slate-800">${full}</div>
        <div class="text-slate-500 text-sm">${user?.email||''}</div>
        <div class="text-slate-500 text-sm mt-1">Role: Doctor</div>
        <button class="mt-3 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50" onclick="Auth.signOut()">Logout</button>
      </div>
    </div>
  `;
  document.getElementById('docContent').innerHTML = html;
}

function showSettings(){
  setActive('Settings');
  const html = `
    <div class="dashboard-header">
      <h2 class="dashboard-title">Settings</h2>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 text-sm">
      <label class="flex items-center gap-3"><input type="checkbox" class="h-4 w-4" checked> Appointment reminders</label>
      <label class="flex items-center gap-3"><input type="checkbox" class="h-4 w-4"> Email summaries</label>
      <button class="mt-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onclick="alert('Saved')">Save</button>
    </div>
  `;
  document.getElementById('docContent').innerHTML = html;
}

/* ========= Actions ========= */
window.markComplete = (id) => {
  const apt = demoAppointments.find(a => a.id === id);
  if (!apt) return;
  apt.status = 'completed';
  apt.tag = 'Done';
  // refresh whichever view the user is on
  const active = document.querySelector('.nav-link.active')?.textContent.trim().toLowerCase() || '';
  if (active.startsWith('appointments')) showAppointments(); else showToday();
};

window.cancelApt = (id) => {
  const apt = demoAppointments.find(a => a.id === id);
  if (!apt) return;
  if (confirm('Cancel this appointment?')) {
    apt.status = 'cancelled';
    apt.tag = 'Cancelled';
    const active = document.querySelector('.nav-link.active')?.textContent.trim().toLowerCase() || '';
    if (active.startsWith('appointments')) showAppointments(); else showToday();
  }
};

function filterAppointments(){
  const q = (document.getElementById('docSearch')?.value||'').toLowerCase();
  const filtered = demoAppointments.filter(a => (a.patient + ' ' + a.reason).toLowerCase().includes(q));

  const active = document.querySelector('.nav-link.active')?.textContent.trim().toLowerCase() || '';
  if (active.startsWith('appointments')) {
    // Re-render table with filtered list
    const listHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-auto">
          <table class="min-w-[720px] w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr class="text-left text-slate-600 text-sm">
                <th class="px-4 py-3 font-semibold">Date</th>
                <th class="px-4 py-3 font-semibold">Time</th>
                <th class="px-4 py-3 font-semibold">Patient</th>
                <th class="px-4 py-3 font-semibold">Reason</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              ${filtered.map(a => `
                <tr class="border-b last:border-0">
                  <td class="px-4 py-3">${new Date(a.appointment_date).toLocaleDateString()}</td>
                  <td class="px-4 py-3">${a.appointment_time}</td>
                  <td class="px-4 py-3">
                    <div class="font-medium">${a.patient}</div>
                    <div class="text-xs text-slate-500">${a.contact}</div>
                  </td>
                  <td class="px-4 py-3">${a.reason}</td>
                  <td class="px-4 py-3">${pill(a.status,'blue')}</td>
                  <td class="px-4 py-3 text-right">
                    <button class="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 mr-2" onclick="markComplete('${a.id}')">Complete</button>
                    <button class="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50" onclick="cancelApt('${a.id}')">Cancel</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById('docContent').querySelector('.bg-white.rounded-xl.shadow-sm.border').outerHTML = listHTML;
  } else if (active.startsWith('today')) {
    const todayList = filtered.filter(a => a.appointment_date === todayISO && a.status === 'scheduled');
    const scheduleHTML = renderSchedule(todayList);
    const scheduleContainer = [...document.querySelectorAll('#docContent .p-4')].pop();
    if (scheduleContainer) scheduleContainer.innerHTML = scheduleHTML;
  }
}

/* ========= Init ========= */
document.addEventListener('DOMContentLoaded', async () => {
  await guard();
  showToday();
  // live-search hook
  const search = document.getElementById('docSearch');
  if (search) search.addEventListener('input', filterAppointments);
});
