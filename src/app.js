// src/app.js
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import morgan from "morgan";
import expressLayouts from "express-ejs-layouts";
import { fileURLToPath } from "url";

// rotas
import dashboardRouter from "./routes/dashboard.routes.js";
import campanhasRouter from "./routes/campanhas.routes.js";
import sessoesRouter from "./routes/sessoes.routes.js";             // rotas aninhadas: /campanhas/:id/...
import sessoesPublicRouter from "./routes/sessoes.public.routes.js"; // rotas públicas: /sessoes/:sid ...
import jogadoresRouter from "./routes/jogadores.routes.js";
import sessoesPagesRouter from "./routes/sessoes.pages.routes.js";

// caminhos base
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// inicializa o app
const app = express();

// logs
app.use(morgan("dev"));

// parsers de body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// arquivos estáticos
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads"))); // imagens de upload
app.use(express.static(path.resolve(__dirname, "../public")));              // CSS, JS e assets do app

// views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "_layout");

// sessão e cookies
app.use(cookieParser());
app.use(session({
  secret: "troque-este-segredo",
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: "lax" }
}));

// flash messages globais
app.use((req, res, next) => {
  const f = req.session.flash || {};
  res.locals.flash = { success: null, info: null, warning: null, danger: null, ...f };
  delete req.session.flash;
  next();
});

// rotas principais
app.get("/", (req, res) => res.redirect("/dashboard"));
app.use("/dashboard", dashboardRouter);
app.use("/campanhas", campanhasRouter);
app.use("/jogadores", jogadoresRouter);
app.use("/sessoes", sessoesPagesRouter);

// rotas aninhadas de sessões: POST /campanhas/:id/sessoes etc.
app.use("/campanhas/:id", sessoesRouter);

// rotas públicas da sessão: GET /sessoes/:sid e ações de combate
app.use("/", sessoesPublicRouter);

// 404
app.use((req, res) => res.status(404).send("Página não encontrada"));

// erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Erro interno do servidor.");
});

export default app;
