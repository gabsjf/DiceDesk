// src/app.js
import express from "express";
import path from "path";
import session from "express-session";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import morgan from "morgan";
import expressLayouts from "express-ejs-layouts";
import dashboardRouter from "./routes/dashboard.routes.js";

// ⚠️ Ajuste o import abaixo conforme o NOME do seu arquivo real:
//   - Se for "campanhas.routes.js"  => "./routes/campanhas.routes.js"
//   - Se for "campanhas.route.js"   => "./routes/campanhas.route.js"
import campanhasRouter from "./routes/campanhas.routes.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// Logs
app.use(morgan("dev"));

// Views + Layouts (EJS)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "_layout"); // usa src/views/_layout.ejs

// Body parser
app.use(express.urlencoded({ extended: true }));

// Cookies, Sessão, CSRF
app.use(cookieParser());
app.use(session({
  secret: "troque-este-segredo",
  resave: false,
  saveUninitialized: true
}));
app.use(csurf());

// Expor csrf e flash para as views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// Arquivos estáticos (public/)
const staticDir = path.resolve(__dirname, "../public");
console.log("🟦 Servindo estáticos de:", staticDir);
app.use(express.static(staticDir));

// Rotas
app.get("/", (req, res) => res.redirect("/dashboard"));
app.use("/dashboard", dashboardRouter);
app.use("/campanhas", campanhasRouter);

// 404
app.use((req, res) => res.status(404).send("Página não encontrada"));

// Tratamento de erros (inclui CSRF)
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).send("Falha de verificação CSRF.");
  }
  console.error(err);
  res.status(500).send("Erro interno do servidor.");
});

export default app;
