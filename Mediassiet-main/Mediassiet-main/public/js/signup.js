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
  
    // Parallax effect
    brand.addEventListener("mousemove", (e) => {
      const r = brand.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      parallax.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    });
    brand.addEventListener("mouseleave", () => parallax.style.transform = "translate(0,0)");

    // Function to show error/success messages
    function showMessage(message, type = 'error') {
      // Remove existing messages
      const existing = document.querySelector('.message-alert');
      if (existing) existing.remove();

      const alertDiv = document.createElement('div');
      alertDiv.className = `message-alert fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
        type === 'success' 
          ? 'bg-green-100 border border-green-400 text-green-700' 
          : 'bg-red-100 border border-red-400 text-red-700'
      }`;
      alertDiv.innerHTML = `
        <div class="flex items-center justify-between">
          <span>${message}</span>
          <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg font-bold">&times;</button>
        </div>
      `;
      document.body.appendChild(alertDiv);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (alertDiv.parentElement) alertDiv.remove();
      }, 5000);
    }

    // Signup form submission handler
    document.getElementById("signupForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      let email = "", password = "", userData = {};

      // Get form data based on active role
      if (activeRole === "patient") {
        email = document.getElementById("patientEmail").value.trim();
        password = document.getElementById("patientPassword").value.trim();
        userData = {
          fullName: document.getElementById("patientName").value.trim(),
          role: CONFIG.ROLES.PATIENT
        };
      } else if (activeRole === "doctor") {
        email = document.getElementById("doctorEmail").value.trim();
        password = document.getElementById("doctorPassword").value.trim();
        userData = {
          fullName: document.getElementById("doctorName").value.trim(),
          licenseNo: document.getElementById("doctorLicense").value.trim(),
          role: CONFIG.ROLES.DOCTOR
        };
      } else {
        email = document.getElementById("hospitalEmail").value.trim();
        password = document.getElementById("hospitalPassword").value.trim();
        userData = {
          hospitalName: document.getElementById("hospitalName").value.trim(),
          registrationId: document.getElementById("hospitalReg").value.trim(),
          role: CONFIG.ROLES.HOSPITAL,
          fullName: document.getElementById("hospitalName").value.trim() // Use hospital name as full name
        };
      }

      // Basic validation
      if (!email || !password) {
        showMessage("Please fill in all required fields");
        return;
      }

      if (!userData.fullName && !userData.hospitalName) {
        showMessage("Please enter your name");
        return;
      }

      // Disable submit button during processing
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';

      try {
        // Use the Auth.signUp method from auth.js
        const result = await Auth.signUp(email, password, userData);
        
        if (result.success) {
          showMessage(result.message, 'success');
          // Redirect to login after successful signup
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        } else {
          showMessage(result.error || 'Failed to create account');
        }
      } catch (error) {
        console.error('Signup error:', error);
        showMessage(error.message || 'An unexpected error occurred');
      } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  })();