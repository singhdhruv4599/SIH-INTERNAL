// js/auth.js
// =============== Auth Utils (SignUp / SignIn / Session) ===============
const Auth = {
    currentUser: null,
  
    async init() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) {
        const user = session.user;
        // try role from metadata else profiles
        let role = user.user_metadata?.role;
        if (!role) {
          const { data: profile } = await supabaseClient.from('profiles').select('role, full_name').eq('id', user.id).single();
          role = profile?.role || CONFIG.ROLES.PATIENT;
          user.user_metadata = { ...(user.user_metadata || {}), role, full_name: profile?.full_name || '' };
        }
        this.currentUser = user;
        localStorage.setItem('sb-user', JSON.stringify({ id: user.id, email: user.email, role }));
      } else {
        this.currentUser = null;
        localStorage.removeItem('sb-user');
      }
    },
  
    getCurrentUser() {
      if (this.currentUser) return this.currentUser;
      try {
        const cached = JSON.parse(localStorage.getItem('sb-user'));
        return cached || null;
      } catch {
        return null;
      }
    },
  
    // ✅ Register a new user + profile
    async signUp(email, password, userData = {}) {
      try {
        if (!email || !password) throw new Error('Email and password are required');
  
        email = String(email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address');
        if (password.length < 8) throw new Error('Password must be at least 8 characters long');
  
        if (!window.supabaseClient) throw new Error('Authentication service is not available. Please refresh the page.');
  
        const role = userData.role || CONFIG.ROLES.PATIENT;
  
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: userData.fullName || '',
              role,
              created_at: new Date().toISOString()
            },
            emailRedirectTo: `${window.location.origin}/verify-email.html`
          }
        });
        if (error) throw error;
        if (!data.user) throw new Error('User registration failed');
  
        // Upsert into profiles
        const { error: profileError } = await supabaseClient.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: userData.fullName || '',
          phone: userData.phone || '',
          role,
          specialization: userData.specialization || null,
          experience: userData.experience ?? null,
          license_no: userData.licenseNo || null,
          hospital_name: userData.hospitalName || null,
          registration_id: userData.registrationId || null,
          location: userData.location || null,
          avatar_url: userData.avatarUrl || '',
          updated_at: new Date().toISOString()
        });
        if (profileError) throw profileError;
  
        return { success: true, message: 'Registration successful! Please check your email.', user: data.user };
      } catch (err) {
        console.error('❌ SignUp Error:', err.message);
        return { success: false, error: err.message || 'Failed to create account' };
      }
    },
  
    // ✅ Sign in + role redirect
    async signIn(email, password) {
      try {
        if (!email || !password) throw new Error('Email and password required');
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: String(email).toLowerCase(),
          password
        });
        if (error) throw error;
        if (!data?.user) throw new Error('Authentication failed');
  
        this.currentUser = data.user;
  
        // get role
        let role = this.currentUser.user_metadata?.role;
        if (!role) {
          const { data: profile, error: profileErr } = await supabaseClient.from('profiles').select('role').eq('id', data.user.id).single();
          if (profileErr) throw profileErr;
          role = profile?.role || CONFIG.ROLES.PATIENT;
        }
  
        // redirect by role
        if (role === CONFIG.ROLES.DOCTOR) window.location.href = 'doctor-dashboard.html';
        else if (role === CONFIG.ROLES.HOSPITAL) window.location.href = 'hospital-dashboard.html';
        else window.location.href = 'patient-dashboard.html';
  
        return { success: true, user: data.user };
      } catch (err) {
        console.error('❌ SignIn Error:', err.message);
        return { success: false, error: err.message || 'Failed to sign in' };
      }
    },
  
    async signOut() {
      try {
        await supabaseClient.auth.signOut();
        localStorage.removeItem('sb-user');
        window.location.href = 'login.html';
      } catch (e) {
        console.error('Logout error:', e);
        window.location.href = 'login.html';
      }
    }
  };
  
  window.Auth = Auth;
  