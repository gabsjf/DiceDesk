// ✅ CORREÇÃO: Importa 'adminAuth' e dá o apelido (alias) de 'admin'
import { adminAuth as admin } from '../config/firebase.js'; 

/**
 * MIDDLEWARE 1: authMiddleware (Para Páginas)
 * (O resto do código funciona sem mudanças)
 */
export const authMiddleware = (req, res, next) => {
  const sessionCookie = req.cookies.session || '';

  if (!sessionCookie) {
    return res.redirect("/login");
  }

  // Agora 'admin' se refere ao 'adminAuth' que você importou
  admin.auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((decodedClaims) => {
      req.user = decodedClaims;
      next();
    })
    .catch((error) => {
      console.error("authMiddleware: Falha na verificação do cookie.", error.code);
      return res.redirect("/login");
    });
};

/**
 * MIDDLEWARE 2: checkAuthStatus (Para API/Fetch)
 */
export const checkAuthStatus = (req, res, next) => {
  const sessionCookie = req.cookies.session || '';

  if (!sessionCookie) {
    return next();
  }

  // E aqui também
  admin.auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((decodedClaims) => {
      req.user = decodedClaims;
      next();
    })
    .catch((error) => {
      console.warn("checkAuthStatus: Cookie de sessão inválido ou expirado.", error.code);
      next();
    });
};


/**
 * MIDDLEWARE 3: extractUserId (O "Fiscal")
 */
export const extractUserId = (req, res, next) => {
  const userId = req.user?.uid || req.user?.sub; 

  if (!userId) {
    console.error("extractUserId: Falha ao extrair userId, 'req.user' está indefinido. Acesso negado.");

    if (req.xhr || req.headers.accept.includes('json')) {
        return res.status(401).json({ 
          success: false, 
          message: "Acesso negado. Sua sessão expirou, faça login novamente." 
        });
    }
    
    return res.redirect('/login');
  }

  req.userId = userId;
  res.locals.userId = userId; 
  
  next();
};