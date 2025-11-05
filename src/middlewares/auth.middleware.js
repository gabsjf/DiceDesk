// src/middlewares/auth.middleware.js

// Importa o serviço de autenticação diretamente, conforme configurado em firebase.js
import { adminAuth } from "../config/firebase.js"; 

/**
 * Verifica o cookie de sessão e injeta o usuário autenticado na requisição.
 * Se o usuário não estiver autenticado, redireciona para a página de login.
 */
export const authMiddleware = async (req, res, next) => {
  const sessionCookie = req.cookies.session || "";

  res.locals.isLoggedIn = false;
  res.locals.user = null;

  // Se não houver cookie, o usuário não está logado
  if (!sessionCookie) {
    return res.redirect("/login");
  }

  try {
    // 🚨 Este é o ponto de falha: usa adminAuth para verificar o token.
    const decodedClaims = await adminAuth 
      .verifySessionCookie(sessionCookie, true /** checkRevoked */);

    req.user = decodedClaims;
    res.locals.user = decodedClaims;
    res.locals.isLoggedIn = true;
    res.locals.displayName = decodedClaims.name || decodedClaims.email.split('@')[0] || 'Usuário';

    return next();

  } catch (error) {
    // Falha na verificação: limpa o cookie e redireciona
    console.error("Erro de validação do cookie:", error.message);
    res.clearCookie("session");
    return res.redirect("/login");
  }
};


/**
 * Verifica o status de login, mas NÃO redireciona se falhar.
 * Usado em rotas que precisam saber se o usuário está logado, mas não precisam de proteção obrigatória.
 */
export const checkAuthStatus = async (req, res, next) => {
  const sessionCookie = req.cookies.session || "";
  
  res.locals.isLoggedIn = false;
  res.locals.user = null;

  if (sessionCookie) {
    try {
      const decodedClaims = await adminAuth
        .verifySessionCookie(sessionCookie, true);

      req.user = decodedClaims;
      res.locals.user = decodedClaims;
      res.locals.isLoggedIn = true;
      res.locals.displayName = decodedClaims.name || decodedClaims.email.split('@')[0] || 'Usuário';

    } catch (error) {
      // Falha na autenticação silenciosa
      res.clearCookie("session");
    }
  }

  next();
};