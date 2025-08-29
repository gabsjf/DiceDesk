// src/app.js
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import csrf from "csurf";
import morgan from "morgan";
import expressLayouts from "express-ejs-layouts";
import dashboardRouter from "./routes/dashboard.routes.js";
import campanhasRouter from "./routes/campanhas.routes.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

/* Logs */
app.use(morgan("dev"));

/* Arquivos estáticos (não precisam de CSRF) */
const staticDir = path.resolve(__dirname, "../public");
console.log("🟦 Servindo estáticos de:", staticDir);
app.use(express.static(staticDir));

/* Views + Layouts (EJS) */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "_layout"); // usa src/views/_layout.ejs

/* Cookies, Sessão */
app.use(cookieParser());
app.use(session({
  secret: "troque-este-segredo",
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: "lax" } // ajuste se usar domínios diferentes
}));

/* Body parsers (antes do csurf para ler token do body) */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* CSRF (habilitado) */
app.use(csrf()); // por sessão; se preferir por cookie: csrf({ cookie: true })

/* Expor csrf e flash para as views */
app.use((req, res, next) => {
  try {
    res.locals.csrfToken = req.csrfToken();    // disponível em TODAS as views
  } catch {
    res.locals.csrfToken = "";
  }
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

/* Rotas */
app.get("/", (req, res) => res.redirect("/dashboard"));
app.use("/dashboard", dashboardRouter);
app.use("/campanhas", campanhasRouter);

/* 404 */
app.use((req, res) => res.status(404).send("Página não encontrada"));

/* Tratamento de erros (inclui CSRF) */
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).send("Falha de verificação CSRF.");
  }
  console.error(err);
  res.status(500).send("Erro interno do servidor.");
});

export default app;
