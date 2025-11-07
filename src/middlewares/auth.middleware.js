import { adminAuth as admin } from '../config/firebase.js'; 

export const authMiddleware = (req, res, next) => {
  const sessionCookie = req.cookies.session || '';
  if (!sessionCookie) return res.redirect("/login");

  admin.verifySessionCookie(sessionCookie, true)
    .then((decodedClaims) => {
      req.user = decodedClaims;
      next();
    })
    .catch((error) => {
      console.error("authMiddleware: Falha.", error.code);
      return res.redirect("/login");
    });
};

export const checkAuthStatus = (req, res, next) => {
  // ✅ LOG 1
  console.log('[checkAuthStatus] ➡️ Executando...');
  const sessionCookie = req.cookies.session || '';
  
  // ✅ NOVO: Inicializa req.userId para garantir que não haja lixo
  req.userId = undefined; 

  if (!sessionCookie) {
    console.log('[checkAuthStatus] ...sem cookie. Chamando next()');
    return next();
  }

  admin.verifySessionCookie(sessionCookie, true)
    .then((decodedClaims) => {
      // ✅ LOG 2
      console.log('[checkAuthStatus] ✅ Cookie verificado. Injetando req.user:', decodedClaims.uid);
      req.user = decodedClaims;
      
      // ✅ CORREÇÃO: Popula req.userId aqui mesmo!
      const userId = decodedClaims.uid || decodedClaims.sub;
      req.userId = userId;
      
      // ✅ NOVO LOG
      console.log(`[checkAuthStatus] ✅ req.userId populado: ${userId}`);
      
      next();
    })
    .catch((error) => {
      console.warn("[checkAuthStatus] ⚠️ Cookie inválido. Chamando next()", error.code);
      next();
    });
};

// 🚨 ESTE MIDDLEWARE SE TORNA REDUNDANTE PARA ROTAS QUE USAM checkAuthStatus GLOBALMENTE
export const extractUserId = (req, res, next) => {
  // ✅ LOG 3
  console.log('[extractUserId] ➡️ Executando... Verificando req.user:', req.user);
  const userId = req.user?.uid || req.user?.sub; 

  if (!userId) {
    // ✅ LOG 4
    console.error("[extractUserId] ❌ FALHA. req.user está indefinido.");
    return res.status(401).json({ 
      success: false, 
      message: "Acesso negado (extractUserId falhou)."
    });
  }

  // ✅ LOG 5
  console.log(`[extractUserId] ✅ Sucesso. Injetando req.userId: ${userId}`);
  req.userId = userId;
  res.locals.userId = userId; 
  next();
};