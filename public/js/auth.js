// public/js/auth.js
document.addEventListener('DOMContentLoaded', function () {
  const auth = window.firebaseAuth;
  const firebase = window.firebase;

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authErrorDiv = document.getElementById('authError');

  function showErr(msg) {
    if (!authErrorDiv) return;
    authErrorDiv.textContent = msg || 'Ocorreu um erro. Tente novamente.';
    authErrorDiv.classList.remove('d-none');
  }
  function clearErr() {
    if (!authErrorDiv) return;
    authErrorDiv.classList.add('d-none');
    authErrorDiv.textContent = '';
  }
  function mapFirebaseErr(error) {
    const c = error?.code || '';
    if (c.includes('user-not-found') || c.includes('wrong-password')) return 'Credenciais inválidas.';
    if (c.includes('email-already-in-use')) return 'Este email já está em uso.';
    if (c.includes('weak-password')) return 'Senha fraca, use pelo menos 6 caracteres.';
    if (c.includes('invalid-email')) return 'Email inválido.';
    if (c.includes('user-token-expired')) return 'Sua sessão expirou. Faça login novamente.';
    return 'Falha na autenticação. Tente novamente.';
  }

  // Persistência 100% em memória
  (async () => {
    try {
      if (auth && firebase?.auth) {
        await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
      }
    } catch (e) {
      // não falha a UI por isso
    }
  })();

  // ================= LOGIN =================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErr();

      if (!auth) { showErr('Falha ao inicializar o Firebase.'); return; }

      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;

      try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const idToken = await cred.user.getIdToken(true); // token fresquinho

        const r = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });

        const data = await r.json().catch(() => null);
        if (!r.ok || !data?.redirect) {
          showErr(data?.message || 'Falha ao estabelecer sessão com o servidor.');
          // encerra o estado local pra não “prender” o token
          try { await auth.signOut(); } catch {}
          return;
        }

        // Agora que o cookie httpOnly foi emitido, pode sair do cliente
        try { await auth.signOut(); } catch {}

        window.location.href = data.redirect;
      } catch (err) {
        showErr(mapFirebaseErr(err));
        try { await auth.signOut(); } catch {}
      }
    });
  }

  // =============== REGISTRO ===============
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErr();

      if (!auth) { showErr('Falha ao inicializar o Firebase.'); return; }

      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;
      const confirm = registerForm.confirmPassword.value;

      if (password !== confirm) {
        showErr('As senhas não conferem.');
        return;
      }

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const idToken = await cred.user.getIdToken(true);

        const r = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });

        const data = await r.json().catch(() => null);
        if (!r.ok || !data?.redirect) {
          showErr(data?.message || 'Falha ao iniciar sessão após o cadastro.');
          try { await auth.signOut(); } catch {}
          return;
        }

        try { await auth.signOut(); } catch {}
        window.location.href = data.redirect;
      } catch (err) {
        showErr(mapFirebaseErr(err));
        try { await auth.signOut(); } catch {}
      }
    });
  }
});
