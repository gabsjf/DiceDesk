import { admin } from '../config/firebase.js'; // ⬅️ IMPORTANTE: Verifique se este caminho está correto!

/**
 * MIDDLEWARE 1: authMiddleware (Para Páginas)
 * * Força a autenticação. Se o usuário não estiver logado
 * (sem cookie ou cookie inválido), ele REDIRECIONA para /login.
 * * Use para rotas GET que renderizam páginas inteiras.
 */
export const authMiddleware = (req, res, next) => {
  const sessionCookie = req.cookies.session || '';

  if (!sessionCookie) {
    // Não há cookie, força o login
    return res.redirect("/login");
  }

  admin.auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((decodedClaims) => {
      // Sucesso, injeta o usuário e continua
      req.user = decodedClaims;
      next();
    })
    .catch((error) => {
      // Cookie inválido ou expirado, força o login
      console.error("authMiddleware: Falha na verificação do cookie.", error.code);
      return res.redirect("/login");
    });
};

/**
 * MIDDLEWARE 2: checkAuthStatus (Para API/Fetch) - NOVO!
 * * APENAS verifica a autenticação. Se o usuário não estiver logado
 * (sem cookie ou cookie inválido), ele NÃO REDIRECIONA.
 * * Ele apenas chama next() e deixa 'req.user' como 'undefined'.
 * Use para rotas POST/PUT/DELETE chamadas via fetch (XHR/AJAX).
 */
export const checkAuthStatus = (req, res, next) => {
  const sessionCookie = req.cookies.session || '';

  if (!sessionCookie) {
    // Não há cookie? Tudo bem. Continua sem usuário.
    return next();
  }

  admin.auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((decodedClaims) => {
      // Sucesso, injeta o usuário
      req.user = decodedClaims;
      next();
    })
    .catch((error) => {
      // Cookie inválido? Tudo bem. Continua sem usuário.
      console.warn("checkAuthStatus: Cookie de sessão inválido ou expirado.", error.code);
      next();
    });
};


/**
 * MIDDLEWARE 3: extractUserId (O "Fiscal") - ATUALIZADO!
 * * Este middleware deve rodar DEPOIS de 'authMiddleware' OU 'checkAuthStatus'.
 * Ele pega 'req.user' (se existir) e o transforma em 'req.userId'.
 * * Se 'req.user' não existir (porque o checkAuthStatus falhou),
 * ele retorna um erro JSON 401, que o seu 'fetch' vai entender.
 */
export const extractUserId = (req, res, next) => {
  // Pega o ID do usuário injetado por 'authMiddleware' ou 'checkAuthStatus'
  const userId = req.user?.uid || req.user?.sub; 

  if (!userId) {
    // Falha: 'req.user' está indefinido.
    console.error("extractUserId: Falha ao extrair userId, 'req.user' está indefinido. Acesso negado.");

    // Verifica se é uma requisição de API (fetch)
    if (req.xhr || req.headers.accept.includes('json')) {
        // Retorna o erro JSON que seu 'fetch' vai receber no 'alert()'
        return res.status(401).json({ 
          success: false, 
          message: "Acesso negado. Sua sessão expirou, faça login novamente." 
        });
    }
    
    // Se não for API (improvável cair aqui), redireciona
    return res.redirect('/login');
  }

  // Sucesso! Injeta req.userId para os controllers
  req.userId = userId;
  // Injeta também nos 'locals' para que o EJS possa acessar (se necessário)
  res.locals.userId = userId; 
  
  next();
};