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
  
    // Function to show error message
    function showError(message) {
      const errorContainer = document.getElementById('errorMessage');
      const errorText = document.getElementById('errorText');
      
      errorText.textContent = message;
      errorContainer.classList.remove('hidden');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorContainer.classList.add('hidden');
      }, 5000);
    }
    
    // Function to clear error message
    function clearError() {
      const errorContainer = document.getElementById('errorMessage');
      errorContainer.classList.add('hidden');
    }
    
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError(); // Clear any previous errors
  
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
  
      if (!email || !pwd) {
        showError("Please enter both email and password");
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError("Please enter a valid email address");
        return;
      }
  
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pwd });
        
        if (error) {
          // Handle specific error cases
          if (error.message.includes('Invalid login credentials')) {
            showError("Invalid email or password. Please try again.");
          } else if (error.message.includes('Email not confirmed')) {
            showError("Please verify your email before logging in.");
          } else {
            throw error;
          }
          return;
        }
        
        if (!data?.user) throw new Error("Login failed. Please try again.");
  
        let role = data.user.user_metadata?.role;
        if (!role) {
          const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();
            
          if (profileError) {
            console.error("Profile error:", profileError);
            showError("Error loading your profile. Please try again.");
            return;
          }
          role = profile?.role || "patient";
        }
        
        // Clear any existing error before redirecting
        clearError();
        
        // Redirect based on role
        switch(role) {
          case "doctor":
            window.location.href = "doctor-dashboard.html";
            break;
          case "hospital":
            window.location.href = "hospital-dashboard.html";
            break;
          default:
            window.location.href = "patient-dashboard.html";
        }
        
      } catch (err) {
        console.error("Login error:", err);
        showError(err.message || "An unexpected error occurred. Please try again.");
      }
    });
  })();