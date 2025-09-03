(function () {
    const brand = document.getElementById("brandPanel");
    const parallax = document.getElementById("brandParallax");
  
    const roleCards = {
      patient: document.getElementById("card-patient"),
      doctor: document.getElementById("card-doctor"),
      hospital: document.getElementById("card-hospital"),
    };
    const sections = {
      patient: document.getElementById("patientForm"),
      doctor: document.getElementById("doctorForm"),
      hospital: document.getElementById("hospitalForm"),
    };
  
    const roleImg = document.getElementById("roleImg");
    const roleTitle = document.getElementById("roleTitle");
    const roleTag = document.getElementById("roleTagline");
    const roleExtra = document.getElementById("roleExtra");
  
    let activeRole = "patient";
  
    function activate(role) {
      activeRole = role;
      Object.keys(sections).forEach(k => sections[k].classList.add("hidden"));
      sections[role].classList.remove("hidden");
  
      Object.keys(roleCards).forEach(k => roleCards[k].classList.remove("border-emerald-500","shadow-lg"));
      roleCards[role].classList.add("border-emerald-500","shadow-lg");
  
      if (role === "patient") {
        brand.className = "relative p-10 md:p-12 bg-gradient-to-br from-sky-100 via-white to-emerald-100";
        roleImg.src = "https://img.icons8.com/color/128/heart-with-pulse.png";
        roleTitle.textContent = "Join as Patient";
        roleTag.textContent = "Book appointments & track your health.";
        roleExtra.className = "mt-4 text-center";
        roleExtra.innerHTML = `<span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-red-50 text-red-600 font-semibold">
          ⚡ 24×7 Emergency Support</span>`;
      } else if (role === "doctor") {
        brand.className = "relative p-10 md:p-12 bg-gradient-to-br from-emerald-50 via-white to-emerald-100";
        roleImg.src = "https://img.icons8.com/color/128/doctor-male.png";
        roleTitle.textContent = "Join as Doctor";
        roleTag.textContent = "Consult patients and manage schedules.";
        roleExtra.className = "mt-4 text-center";
        roleExtra.innerHTML = `<span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 text-green-700 font-semibold">
          ✅ Verified License Required</span>`;
      } else {
        brand.className = "relative p-10 md:p-12 bg-gradient-to-br from-fuchsia-50 via-white to-fuchsia-100";
        roleImg.src = "https://img.icons8.com/color/128/hospital-room.png";
        roleTitle.textContent = "Register Hospital";
        roleTag.textContent = "Manage resources and patient admissions.";
        roleExtra.className = "mt-4 text-center";
        roleExtra.innerHTML = `<span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-fuchsia-50 text-fuchsia-700 font-semibold">
          🏥 24×7 Resource Management</span>`;
      }
    }
  
    activate("patient");
    roleCards.patient.onclick = () => activate("patient");
    roleCards.doctor.onclick = () => activate("doctor");
    roleCards.hospital.onclick = () => activate("hospital");
  
    // same Supabase signup logic here...
  })();
  