import { adminAuth } from "../config/firebase.js";

const MAX_AGE = 7 * 24 * 60 * 60 * 1000; 

export const loginGet = (req, res) => {
  if (res.locals.isLoggedIn) {
    return res.redirect("/dashboard");
  }
  res.render("auth/login", {
    title: "Login",
    layout: "layouts/auth_layout",
  });
};

export const loginPost = async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) {
    return res.status(401).send("Token ausente.");
  }

  try {
    
    await adminAuth.verifyIdToken(idToken, true);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: MAX_AGE });

    const isLocalhost = req.hostname === "localhost" || req.hostname === "127.0.0.1";
    res.cookie("session", sessionCookie, {
      httpOnly: true,
      sameSite: "Lax",
      secure: !isLocalhost, 
      maxAge: MAX_AGE,
    });

    // Esta resposta está correta para o AJAX de login!
    return res.status(200).json({ redirect: "/dashboard" });
  } catch (error) {
    console.error("Erro ao criar cookie de sessão:", error);
    // AQUI: Retorna JSON para o frontend tratar o erro
    return res.status(401).json({ 
        success: false, 
        message: "Credenciais inválidas ou token expirado." 
    });
  }
};

export const registerGet = (req, res) => {
  if (res.locals.isLoggedIn) {
    return res.redirect("/dashboard");
  }
  res.render("auth/register", {
    title: "Cadastro",
    layout: "layouts/auth_layout",
  });
};

// CORREÇÃO: O registerPost deve fazer a mesma coisa que o loginPost: criar o cookie
// O registro do usuário em si (createUserWithEmailAndPassword) DEVE ser feito no frontend,
// e o idToken resultante deve ser enviado para cá.
export const registerPost = async (req, res) => {
  // Chamamos loginPost, pois o fluxo é idêntico: recebe o idToken, verifica e cria o cookie.
  // A diferença é que a conta já foi criada pelo cliente Firebase antes de enviar o idToken.
  return loginPost(req, res);
};

export const logout = async (req, res) => {
  try {
    const cookie = req.cookies?.session;
    if (cookie) {
      const decoded = await adminAuth.verifySessionCookie(cookie, true);
      // Revogar o token de atualização é importante para segurança
      await adminAuth.revokeRefreshTokens(decoded.sub);
    }
  } catch {}
  
  // AÇÃO CRÍTICA: Limpar o cookie no navegador
  res.clearCookie("session");
  
  // Como o frontend já está fazendo o redirecionamento após o POST 200 OK, 
  // e esta função é para POST, devolvemos sucesso.
  return res.status(200).json({ success: true });
};