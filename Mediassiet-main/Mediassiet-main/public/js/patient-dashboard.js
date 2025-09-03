// js/patient-dashboard.js
// Patient dashboard logic: auth guard, UI loading, search, bookings

(async function initPatientDashboard() {
    try {
      if (!window.supabaseClient) {
        console.error('Supabase not initialized - ensure js/config.js is loaded');
        document.getElementById('contentArea').innerHTML = '<p style="color:red">Auth not initialized.</p>';
        return;
      }
  
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) { window.location.href = 'login.html'; return; }
  
      if (window.Auth && typeof Auth.init === 'function') { await Auth.init(); }
  
      const userMeta = (session.user?.user_metadata) || {};
      const email = session.user.email || userMeta.email || 'you@example.com';
      const fullName = userMeta.full_name || email.split('@')[0];
      const initials = fullName.split(' ').map(s => s.charAt(0)).slice(0,2).join('').toUpperCase();
  
      document.getElementById('userAvatar').textContent = initials || 'P';
      document.getElementById('userName').textContent = fullName || 'Patient';
      document.getElementById('userEmail').textContent = email;
  
      showHospitals();
  
      window.applyFilter = applyFilter;
      window.viewHospitalDetails = viewHospitalDetails;
      window.bookAppointment = bookAppointment;
      window.showHospitals = showHospitals;
      window.showDoctors = showDoctors;
      window.showAppointments = showAppointments;
      window.showEmergency = showEmergency;
      window.showProfile = showProfile;
      window.showSettings = showSettings;
      window.logout = logout;
      window.toggleUserMenu = toggleUserMenu;
      window.showNotifications = showNotifications;
  
    } catch (err) {
      console.error('Init error:', err);
      document.getElementById('contentArea').innerHTML = '<p style="color:red">Initialization failed. Open console.</p>';
    }
  })();
  
  /* ---------- Dummy data ---------- */
  const dummyHospitals = [
    { id: 1, name: 'City General Hospital', location: 'Mumbai, Maharashtra', beds: 45, available: 12, status: 'available', contact: '+91 98765 43210', lastUpdated: '2 hours ago' },
    { id: 2, name: 'Metro Health Center', location: 'New Delhi', beds: 30, available: 0, status: 'full', contact: '+91 98765 12345', lastUpdated: '1 hour ago' },
    { id: 3, name: 'Sunshine Medical', location: 'Bangalore', beds: 25, available: 5, status: 'available', contact: '+91 98765 67890', lastUpdated: '3 hours ago' },
    { id: 4, name: 'Green Valley Hospital', location: 'Hyderabad', beds: 50, available: 3, status: 'available', contact: '+91 98765 09876', lastUpdated: '5 hours ago' }
  ];
  
  const dummyDoctors = [
    { id: 1, name: 'Dr. Ramesh Kumar', specialization: 'Cardiologist', hospital: 'City General Hospital', availability: 'Mon-Fri 9AM-1PM' },
    { id: 2, name: 'Dr. Priya Singh', specialization: 'Neurologist', hospital: 'Metro Health Center', availability: 'Tue-Thu 2PM-6PM' },
    { id: 3, name: 'Dr. Amit Patel', specialization: 'Orthopedic', hospital: 'Sunshine Medical', availability: 'Mon, Wed 10AM-3PM' },
    { id: 4, name: 'Dr. Anjali Desai', specialization: 'Pediatrician', hospital: 'Green Valley Hospital', availability: 'Mon-Fri 9AM-5PM' },
  ];
  
  let dummyAppointments = [
    { id: 101, doctorId: 1, doctor: 'Dr. Ramesh Kumar', date: '2025-09-10', time: '10:00 AM', status: 'Confirmed' },
    { id: 102, doctorId: 4, doctor: 'Dr. Anjali Desai', date: '2025-09-12', time: '02:30 PM', status: 'Pending' }
  ];
  
  /* ---------- Helpers & UI renderers ---------- */
  function setActiveNav(sectionName) {
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const map = {
      hospitals: 'Hospitals', doctors: 'Doctors', appointments: 'Appointments',
      emergency: 'Emergency', profile: 'Profile', settings: 'Settings'
    };
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.textContent.trim().startsWith(map[sectionName] || '')) link.classList.add('active');
    });
  }
  
  async function showHospitals() {
    setActiveNav('hospitals');
    const container = document.getElementById('contentArea');
    container.innerHTML = `<div class="dashboard-header"><h2 class="dashboard-title">Available Hospitals</h2><p class="dashboard-subtitle">Find hospitals near you</p></div>`;
  
    let hospitals = dummyHospitals;
    try {
      const { data, error } = await supabaseClient.from('hospitals').select('*').order('name', { ascending: true });
      if (!error && Array.isArray(data) && data.length) hospitals = data.map(h => ({
        id: h.id, name: h.name, location: h.city || h.location || '', beds: h.total_beds || h.beds || 0,
        available: h.available_beds || h.available || 0, status: h.status || ((h.available_beds ?? 0)>0?'available':'full'),
        contact: h.contact || h.phone || 'N/A', lastUpdated: h.updated_at || 'N/A'
      }));
    } catch (e) {}
  
    let html = `<div class="data-grid">`;
    hospitals.forEach(h => {
      const occupancy = h.beds ? Math.round(((h.beds - h.available) / h.beds) * 100) : 0;
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 class="data-card-title">${escapeHtml(h.name)}</h3>
              <div style="font-size:.9rem;color:var(--muted)">${escapeHtml(h.location)}</div>
            </div>
            <div><span class="status-badge ${h.status==='available'?'status-available':'status-full'}">${h.status==='available'?'Available':'Full'}</span></div>
          </div>
          <div class="data-card-body">
            <div class="detail-item" style="margin-bottom:.5rem"><strong>Beds:</strong> ${h.available}/${h.beds}</div>
            <div class="detail-item" style="margin-bottom:.5rem"><strong>Occupancy:</strong> ${occupancy}%</div>
            <div class="detail-item" style="margin-bottom:.5rem"><strong>Contact:</strong> ${escapeHtml(h.contact)}</div>
            <div style="display:flex;justify-content:space-between;margin-top:1rem">
              <button class="btn-outline" onclick="viewHospitalDetails(${h.id})">View</button>
              <button class="btn" onclick="bookAtHospital(${h.id})">Book Appointment</button>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML += html;
  }
  
  async function showDoctors() {
    setActiveNav('doctors');
    const container = document.getElementById('contentArea');
    container.innerHTML = `<div class="dashboard-header"><h2 class="dashboard-title">Doctors</h2><p class="dashboard-subtitle">Search doctors by specialization and book</p></div>`;
  
    let doctors = dummyDoctors;
    try {
      const { data, error } = await supabaseClient.from('doctors').select('id,full_name,specialization,hospital_name,availability').order('full_name');
      if (!error && Array.isArray(data) && data.length) doctors = data.map(d => ({
        id: d.id, name: d.full_name || d.name, specialization: d.specialization || '', hospital: d.hospital_name || '', availability: d.availability || 'N/A'
      }));
    } catch (e) {}
  
    let html = `<div class="data-grid">`;
    doctors.forEach(d => {
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 class="data-card-title">${escapeHtml(d.name)}</h3>
              <div style="font-size:.9rem;color:var(--muted)">${escapeHtml(d.specialization)} • ${escapeHtml(d.hospital)}</div>
            </div>
            <div><span class="status-badge status-available">Available</span></div>
          </div>
          <div class="data-card-body">
            <div style="margin-bottom:.5rem"><strong>Timing:</strong> ${escapeHtml(d.availability)}</div>
            <div style="display:flex;gap:.5rem">
              <button class="btn-outline" onclick="viewDoctor(${d.id})">Details</button>
              <button class="btn" onclick="bookAppointment(${d.id})">Book Appointment</button>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML += html;
  }
  
  async function showAppointments() {
    setActiveNav('appointments');
    const container = document.getElementById('contentArea');
    container.innerHTML = `<div class="dashboard-header"><h2 class="dashboard-title">My Appointments</h2><p class="dashboard-subtitle">View and manage your appointments</p></div>`;
  
    let appointments = dummyAppointments;
    try {
      const uid = (await supabaseClient.auth.getUser()).data.user?.id;
      if (uid) {
        const { data, error } = await supabaseClient.from('appointments')
          .select('id,doctor_name,appointment_date,appointment_time,status')
          .eq('patient_id', uid)
          .order('appointment_date', { ascending:true });
        if (!error && Array.isArray(data)) {
          appointments = data.map(a => ({
            id: a.id, doctor: a.doctor_name || 'Doctor', date: a.appointment_date, time: a.appointment_time, status: a.status || 'Pending'
          }));
        }
      }
    } catch (e) {}
  
    if (!appointments.length) {
      container.innerHTML += `<p>No appointments found. Book from Doctors or Hospitals tab.</p>`;
      return;
    }
  
    let html = `<div style="display:grid;gap:1rem">`;
    appointments.forEach(a => {
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 class="data-card-title">${escapeHtml(a.doctor)}</h3>
              <div style="font-size:.9rem;color:var(--muted)">${escapeHtml(a.date)} • ${escapeHtml(a.time)}</div>
            </div>
            <div><span class="status-badge ${a.status.toLowerCase()==='confirmed'?'status-available':'status-full'}">${escapeHtml(a.status)}</span></div>
          </div>
          <div class="data-card-body">
            <div style="display:flex;gap:.5rem">
              ${a.status.toLowerCase() !== 'confirmed'
                ? `<button class="btn" onclick="confirmAppointment(${a.id})">Confirm</button>`
                : `<button class="btn-outline" onclick="cancelAppointment(${a.id})">Cancel</button>`}
              <button class="btn-outline" onclick="viewAppointment(${a.id})">Details</button>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML += html;
  }
  
  function showEmergency() {
    setActiveNav('emergency');
    const container = document.getElementById('contentArea');
    container.innerHTML = `
      <div class="dashboard-header"><h2 class="dashboard-title text-red-600">Emergency</h2><p class="dashboard-subtitle">Immediate help and emergency contacts</p></div>
      <div class="data-card">
        <div class="data-card-body" style="text-align:center">
          <h3 style="font-size:1.25rem">If this is an emergency call <strong>108</strong> or your local ambulance</h3>
          <p style="margin-top:.75rem;color:var(--muted)">Nearest hospitals and ambulances will be contacted.</p>
          <div style="margin-top:1rem;display:flex;gap:.6rem;justify-content:center">
            <button class="btn" onclick="alert('Calling 108...')">Call 108</button>
            <button class="btn-outline" onclick="alert('Requesting ambulance to your location...')">Request Ambulance</button>
          </div>
        </div>
      </div>
    `;
  }
  
  function showProfile() {
    setActiveNav('profile');
    const container = document.getElementById('contentArea');
    container.innerHTML = `<div class="dashboard-header"><h2 class="dashboard-title">Profile</h2></div><div class="data-card"><div class="data-card-body">Loading...</div></div>`;
    (async () => {
      let profile = null;
      try {
        const uid = (await supabaseClient.auth.getUser()).data.user?.id;
        if (uid) {
          const { data } = await supabaseClient.from('profiles').select('*').eq('id', uid).single();
          if (data) profile = data;
        }
      } catch (e) {}
      const sessionUser = (await supabaseClient.auth.getUser()).data.user;
      const email = sessionUser?.email || 'you@example.com';
      const full_name = profile?.full_name || sessionUser?.user_metadata?.full_name || email.split('@')[0];
  
      container.innerHTML = `
        <div class="data-card">
          <div class="data-card-body">
            <div style="display:flex;align-items:center;gap:1rem">
              <div class="avatar">${(full_name||'P').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
              <div>
                <div style="font-weight:700">${escapeHtml(full_name)}</div>
                <div style="color:var(--muted)">${escapeHtml(email)}</div>
                <div style="margin-top:.5rem;color:var(--muted)">${escapeHtml(profile?.role || 'patient')}</div>
              </div>
            </div>
            <div style="margin-top:1rem">
              <p><strong>Phone:</strong> ${escapeHtml(profile?.phone || '—')}</p>
              <p><strong>Location:</strong> ${escapeHtml(profile?.location || '—')}</p>
            </div>
          </div>
        </div>
      `;
    })();
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
            <label>Theme: <select><option>Light</option><option>Dark</option></select></label>
            <button class="btn" onclick="alert('Settings saved')">Save Settings</button>
          </div>
        </div>
      </div>
    `;
  }
  
  /* ---------- Actions ---------- */
  function viewHospitalDetails(id) {
    const h = dummyHospitals.find(x => x.id === id) || { name: 'Hospital' };
    alert('Hospital details: ' + (h.name || id));
  }
  
  function bookAtHospital(hospitalId) {
    showDoctors();
    document.getElementById('globalSearch').value = dummyHospitals.find(h=>h.id===hospitalId)?.name || '';
    applyFilter();
    setTimeout(()=>alert('Search results filtered to hospital — pick a doctor to book.'),200);
  }
  
  async function bookAppointment(doctorId) {
    const doc = dummyDoctors.find(d => d.id === doctorId) || { name: 'Doctor' };
    const appointment = {
      id: Math.floor(Math.random()*90000)+1000,
      doctorId,
      doctor: doc.name,
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      status: 'Pending'
    };
  
    try {
      const uid = (await supabaseClient.auth.getUser()).data.user?.id;
      if (uid) {
        const { error } = await supabaseClient.from('appointments').insert([{
          patient_id: uid,
          doctor_id: doctorId,
          doctor_name: doc.name,
          appointment_date: appointment.date,
          appointment_time: appointment.time,
          status: 'Pending'
        }]);
        if (!error) { alert('Appointment requested. Check My Appointments.'); showAppointments(); return; }
      }
    } catch (e) {}
  
    dummyAppointments.push(appointment);
    alert('Appointment booked (demo data). Check My Appointments tab.');
    showAppointments();
  }
  
  async function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return;
    try {
      const { error } = await supabaseClient.from('appointments').update({ status: 'Cancelled' }).eq('id', id);
      if (!error) { alert('Appointment cancelled.'); showAppointments(); return; }
    } catch (e) {}
    dummyAppointments = dummyAppointments.map(a => a.id === id ? ({...a, status: 'Cancelled'}) : a );
    showAppointments();
  }
  
  async function confirmAppointment(id) {
    try {
      const { error } = await supabaseClient.from('appointments').update({ status: 'Confirmed' }).eq('id', id);
      if (!error) { alert('Appointment confirmed.'); showAppointments(); return; }
    } catch (e) {}
    dummyAppointments = dummyAppointments.map(a => a.id === id ? ({...a, status: 'Confirmed'}) : a );
    showAppointments();
  }
  
  function viewAppointment(id) { alert('Viewing appointment ' + id); }
  
  /* ---------- Utility ---------- */
  function applyFilter() {
    const q = (document.getElementById('globalSearch').value || '').toLowerCase();
    const activeText = Array.from(document.querySelectorAll('.nav-link')).find(n => n.classList.contains('active'))?.textContent || '';
    if (activeText.includes('Hospitals')) {
      const filtered = dummyHospitals.filter(h => (h.name+h.location).toLowerCase().includes(q));
      const container = document.getElementById('contentArea');
      if (!filtered.length) return container.innerHTML = `<p>No hospitals found.</p>`;
      let html = `<div class="data-grid">`;
      filtered.forEach(h => {
        const occupancy = h.beds ? Math.round(((h.beds - h.available) / h.beds) * 100) : 0;
        html += `
          <div class="data-card">
            <div class="data-card-header">
              <div><h3 class="data-card-title">${escapeHtml(h.name)}</h3><div style="font-size:.9rem;color:var(--muted)">${escapeHtml(h.location)}</div></div>
              <div><span class="status-badge ${h.status==='available'?'status-available':'status-full'}">${h.status}</span></div>
            </div>
            <div class="data-card-body">
              <div><strong>Beds:</strong> ${h.available}/${h.beds}</div>
              <div><strong>Occupancy:</strong> ${occupancy}%</div>
              <div style="margin-top:.6rem;"><button class="btn" onclick="viewHospitalDetails(${h.id})">View</button></div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      container.innerHTML = html;
    } else if (activeText.includes('Doctors')) {
      const filtered = dummyDoctors.filter(d => (d.name + d.specialization + d.hospital).toLowerCase().includes(q));
      const container = document.getElementById('contentArea');
      if (!filtered.length) return container.innerHTML = `<p>No doctors found.</p>`;
      let html = `<div class="data-grid">`;
      filtered.forEach(d => {
        html += `
          <div class="data-card">
            <div class="data-card-header"><div><h3>${escapeHtml(d.name)}</h3><div style="color:var(--muted)">${escapeHtml(d.specialization)} • ${escapeHtml(d.hospital)}</div></div><div><span class="status-badge status-available">Available</span></div></div>
            <div class="data-card-body"><div style="margin-bottom:.5rem"><strong>Timing:</strong> ${escapeHtml(d.availability)}</div><div><button class="btn" onclick="bookAppointment(${d.id})">Book Appointment</button></div></div>
          </div>
        `;
      });
      html += `</div>`;
      container.innerHTML = html;
    } else {
      showHospitals();
    }
  }
  
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"'`=\/]/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#96;','=':'&#61;' })[s]);
  }
  
  /* ---------- UI helpers ---------- */
  function toggleUserMenu() {
    const el = document.getElementById('userDropdown');
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
  }
  
  function showNotifications() { alert('No new notifications (demo).'); }
  
  /* ---------- Auth ---------- */
  async function logout() {
    try { await supabaseClient.auth.signOut(); } catch (e) { console.warn('logout', e); }
    window.location.href = 'login.html';
  }
  