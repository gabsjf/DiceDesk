document.addEventListener('DOMContentLoaded', function () {
    // Usa a variável global definida em auth_layout.ejs (assumindo que o Firebase Auth está inicializado lá)
    const auth = window.firebaseAuth; 
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authErrorDiv = document.getElementById('authError');

    /**
     * Exibe uma mensagem de erro na div de erro.
     */
    function displayError(message, errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }

    /**
     * Lida com erros específicos do Firebase.
     */
    function handleFirebaseError(error) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Credenciais inválidas. Verifique seu email e senha.';
            case 'auth/email-already-in-use':
                return 'Este email já está em uso. Tente fazer login.';
            case 'auth/weak-password':
                return 'A senha deve ter pelo menos 6 caracteres.';
            case 'auth/invalid-email':
                return 'O formato do email é inválido.';
            default:
                console.error('Erro de autenticação do Firebase:', error);
                return 'Ocorreu um erro desconhecido. Tente novamente.';
        }
    }


    // =========================================================
    // LÓGICA DE LOGIN
    // =========================================================

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            authErrorDiv.classList.add('d-none'); // Limpa erros

            if (!auth) {
                displayError('Erro de inicialização do Firebase. Tente recarregar a página.', authErrorDiv);
                return;
            }

            try {
                // 1. Faz login no Firebase (cliente)
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const idToken = await userCredential.user.getIdToken();

                // 2. Envia o ID Token para o servidor Express para criar o cookie de sessão
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken })
                });

                const data = await response.json();

                // CORREÇÃO CRÍTICA: Verifica se a resposta HTTP é 200/204 E se o backend retornou o caminho de redirect.
                if (response.ok && data.redirect) {
                    // 3. Sucesso: Express criou o cookie de sessão, redireciona
                    window.location.href = data.redirect;
                } else {
                    // 4. Falha na criação do cookie no servidor
                    displayError(data.message || 'Falha ao estabelecer sessão com o servidor.', authErrorDiv);
                }

            } catch (error) {
                // Erro de autenticação do Firebase (ex: senha errada)
                displayError(handleFirebaseError(error), authErrorDiv);
            }
        });
    }


    // =========================================================
    // LÓGICA DE CADASTRO
    // =========================================================

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;
            authErrorDiv.classList.add('d-none'); // Limpa erros

            if (password !== confirmPassword) {
                displayError('As senhas não coincidem.', authErrorDiv);
                return;
            }

            if (!auth) {
                displayError('Erro de inicialização do Firebase. Tente recarregar a página.', authErrorDiv);
                return;
            }

            try {
                // 1. Cria usuário no Firebase (cliente)
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const idToken = await userCredential.user.getIdToken();

                // 2. Envia o ID Token para o servidor Express (rota /register, que chama o loginPost)
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken })
                });
                
                const data = await response.json();

                // CORREÇÃO CRÍTICA: Verifica se a resposta HTTP é 200/204 E se o backend retornou o caminho de redirect.
                if (response.ok && data.redirect) {
                    // 3. Sucesso: Express criou o cookie de sessão, redireciona
                    window.location.href = data.redirect;
                } else {
                    // 4. Falha na criação do cookie no servidor
                    displayError(data.message || 'Falha ao iniciar sessão após o cadastro.', authErrorDiv);
                }


            } catch (error) {
                // Erro de autenticação do Firebase (ex: email já existe)
                displayError(handleFirebaseError(error), authErrorDiv);
            }
        });
    }
});