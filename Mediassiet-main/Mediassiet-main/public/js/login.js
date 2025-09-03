// Dynamic UI + Supabase Login (role aware)
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
  
      Object.keys(roleCards).forEach(k => roleCards[k].classList.remove("border-sky-500","shadow-lg"));
      roleCards[role].classList.add("border-sky-500","shadow-lg");
  
      if (role === "patient") {
        brand.className = "relative p-10 md:p-12 bg-gradient-to-br from-sky-100 via-white to-emerald-100";
        roleImg.src = "https://img.icons8.com/color/128/heart-with-pulse.png";
        roleTitle.textContent = "Welcome Patient";
        roleTag.textContent = "Book appointments, track reports & stay healthy.";
        roleExtra.classList.remove("hidden");
      } else if (role === "doctor") {
        brand.className = "relative p-10 md:p-12 bg-gradient-to-br from-emerald-50 via-white to-emerald-100";
        roleImg.src = "https://img.icons8.com/color/128/doctor-male.png";
        roleTitle.textContent = "Welcome Doctor";
        roleTag.textContent = "Manage schedules, patients & consults with ease.";
        roleExtra.classList.add("hidden");
      } else {
        brand.className = "relative p-10 md:p-12 bg-gradient-to-br from-fuchsia-50 via-white to-fuchsia-100";
        roleImg.src = "https://img.icons8.com/color/128/hospital-room.png";
        roleTitle.textContent = "Welcome Hospital";
        roleTag.textContent = "Beds, equipment & staffing — in one dashboard.";
        roleExtra.classList.add("hidden");
      }
    }
  
    activate("patient");
    roleCards.patient.onclick = () => activate("patient");
    roleCards.doctor.onclick = () => activate("doctor");
    roleCards.hospital.onclick = () => activate("hospital");
  
    brand.addEventListener("mousemove", (e) => {
      const r = brand.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      parallax.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    });
    brand.addEventListener("mouseleave", () => parallax.style.transform = "translate(0,0)");
  
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
  
      let email = "", pwd = "";
      if (activeRole === "patient") {
        email = document.getElementById("email").value.trim();
        pwd = document.getElementById("password").value.trim();
      } else if (activeRole === "doctor") {
        email = document.getElementById("doctorEmail").value.trim();
        pwd = document.getElementById("doctorPassword").value.trim();
      } else {
        email = document.getElementById("hospitalEmail").value.trim();
        pwd = document.getElementById("hospitalPassword").value.trim();
      }
  
      if (!email || !pwd) return alert("Please enter email & password");
  
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
        if (!data?.user) throw new Error("Login failed");
  
        let role = data.user.user_metadata?.role;
        if (!role) {
          const { data: profile } = await supabaseClient.from("profiles").select("role").eq("id", data.user.id).single();
          role = profile?.role || "patient";
        }
  
        if (role === "doctor") window.location.href = "doctor-dashboard.html";
        else if (role === "hospital") window.location.href = "hospital-dashboard.html";
        else window.location.href = "patient-dashboard.html";
      } catch (err) {
        console.error("Login error:", err.message);
        alert(err.message || "Login failed");
      }
    });
  })();
  