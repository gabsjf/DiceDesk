import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import morgan from "morgan";
import expressLayouts from "express-ejs-layouts";
import { fileURLToPath } from "url";

// Rotas de páginas/recursos
import dashboardRouter from "./routes/dashboard.routes.js";
import campanhasRouter from "./routes/campanhas.routes.js";
import sessoesRouter from "./routes/sessoes.routes.js";
import sessoesPublicRouter from "./routes/sessoes.public.routes.js";
import jogadoresRouter from "./routes/jogadores.routes.js";
import sessoesPagesRouter from "./routes/sessoes.pages.routes.js";

// Autenticação
import authRoutes from "./routes/auth.routes.js";
import { authMiddleware, checkAuthStatus } from "./middlewares/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// Logs
app.use(morgan("dev"));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Estáticos
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use(express.static(path.resolve(__dirname, "../public")));

// Views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "_layout");

// Sessão e cookies
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "troque-este-segredo",
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: "lax" }
}));

// Status de auth em res.locals
app.use(checkAuthStatus);

// Flash sempre definido
app.use((req, res, next) => {
  const f = req.session.flash || {};
  res.locals.flash = { success: null, info: null, warning: null, danger: null, ...f };
  delete req.session.flash;
  next();
});

// Config pública do Firebase para as views
app.use((req, res, next) => {
  // projectId pode vir do JSON privado ou do .env
  let projectId = process.env.FIREBASE_PROJECT_ID || "";
  try {
    const creds = JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}");
    if (creds && creds.project_id) projectId = creds.project_id;
  } catch {}

  const cfg = {
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : ""),
    projectId: projectId || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : ""),
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || "",
  };

  res.locals.firebasePublic = cfg;                 // nome usado nas views
  res.locals.FIREBASE_CONFIG_PUBLIC = cfg;         // compat se alguma view esperar esse nome
  next();
});

/* ===================== ROTAS ===================== */

// Rotas públicas de autenticação (ex: /login, /register)
app.use("/", authRoutes);

// NOVO: Rota de Logout (POST)
app.post("/logout", (req, res) => {
  // Destroi a sessão do Express no servidor
  req.session.destroy(err => {
    if (err) {
      console.error("Erro ao destruir a sessão:", err);
      return res.status(500).json({ success: false, message: "Erro ao encerrar a sessão." });
    }

    // 1. Limpa o cookie da sessão do Express
    // O nome padrão é 'connect.sid', mas depende da sua configuração
    // Se você usa o nome padrão, essa linha deve funcionar.
    res.clearCookie('connect.sid', { path: '/', sameSite: 'lax' }); 
    res.clearCookie('session', { path: '/', sameSite: 'lax' });

    // 2. Opcional: Limpa o cookie de sessão do Firebase, se estiver usando
    // (Apenas se o seu middleware de auth estiver setando um cookie chamado '__session')
    // res.clearCookie('__session', { path: '/', sameSite: 'lax' }); 

    // Resposta de sucesso (o JavaScript do frontend fará o redirecionamento)
    res.status(200).json({ success: true, message: "Sessão encerrada com sucesso." });
  });
});

// Raiz
app.get("/", (req, res) => res.redirect("/dashboard"));

// Rotas protegidas
app.use("/dashboard", authMiddleware, dashboardRouter);
app.use("/campanhas", authMiddleware, campanhasRouter);
app.use("/jogadores", authMiddleware, jogadoresRouter);
app.use("/sessoes", authMiddleware, sessoesPagesRouter);
app.use("/campanhas/:id", authMiddleware, sessoesRouter);

// Rotas públicas da sessão, se existirem
app.use("/", sessoesPublicRouter);

// 404
app.use((req, res) => res.status(404).send("Página não encontrada"));

// Erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Erro interno do servidor.");
});

export default app;