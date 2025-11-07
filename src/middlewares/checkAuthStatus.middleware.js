// Dentro do seu 'auth.middleware.js'
import { admin } from '../config/firebase.js'; // ⬅️ Verifique se o caminho do import do admin está correto

/**
 * -----------------------------------------------------------------
 * ✅ NOVO MIDDLEWARE: checkAuthStatus
 * -----------------------------------------------------------------
 * Apenas verifica o cookie de sessão e injeta 'req.user'.
 * NUNCA redireciona. É feito para rotas de API/fetch.
 */
export const checkAuthStatus = (req, res, next) => {
  // 1. Pega o cookie 'session' (o mesmo nome que seu authMiddleware usa)
  const sessionCookie = req.cookies.session || '';

  if (!sessionCookie) {
    console.log('[checkAuthStatus] ➡️ Sem cookie de sessão. Chamando next()');
    return next();
  }

  // 2. Tenta verificar o cookie com o Firebase
  admin.auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((decodedClaims) => {
      console.log('[checkAuthStatus] ✅ Cookie verificado. Injetando req.user:', decodedClaims.uid);
      req.user = decodedClaims;
      next();
    })
    .catch((error) => {
      // 4. Falha (cookie expirado/inválido)? Tudo bem.
      // Apenas chame next() e deixe 'req.user' indefinido.
      console.warn("[checkAuthStatus] ⚠️ Cookie inválido. Chamando next()", error.code);
      next();
    });
};


/**
 * -----------------------------------------------------------------
 * SEU MIDDLEWARE ANTIGO: authMiddleware (Provavelmente se parece com isso)
 * -----------------------------------------------------------------
 * Força o login. Redireciona se o cookie for inválido.
 * É feito para carregamento de páginas (GET).
 */
export const authMiddleware = (req, res, next) => {
  const sessionCookie = req.cookies.session || '';

  if (!sessionCookie) {
    // 🛑 FALHA: Redireciona
    return res.redirect("/login");
  }

  admin.auth()
    .verifySessionCookie(sessionCookie, true)
    .then((decodedClaims) => {
      req.user = decodedClaims;
      next();
    })
    .catch((error) => {
      // 🛑 FALHA: Redireciona
      console.error("authMiddleware: Falha na verificação do cookie.", error.code);
      return res.redirect("/login");
    });
};

/**
 * -----------------------------------------------------------------
 * SEU MIDDLEWARE ATUAL: extractUserId
 * -----------------------------------------------------------------
 * Este middleware é executado DEPOIS de 'checkAuthStatus' ou 'authMiddleware'.
 * Ele pega 'req.user' (se existir) e transforma em 'req.userId'.
 */
export const extractUserId = (req, res, next) => {
  console.log('[extractUserId] ➡️ Verificando req.user:', req.user);
  const userId = req.user?.uid || req.user?.sub; 

  if (!userId) {
    // O 'checkAuthStatus' falhou, então 'req.user' está vazio.
    console.error("[extractUserId] ❌ FALHA. req.user está indefinido ou não tem UID.");
    console.error("extractUserId: Falha, 'req.user' está indefinido.");

    // Retorna um erro JSON (perfeito para 'fetch')
    return res.status(401).json({ 
      success: false, 
      message: "Acesso negado. Faça login novamente." 
    });
  }

  // Sucesso!
  console.log(`[extractUserId] ✅ Sucesso. Injetando req.userId: ${userId}`);
  req.userId = userId;
  next();
};