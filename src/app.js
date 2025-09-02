// src/app.js
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import morgan from "morgan";
import expressLayouts from "express-ejs-layouts";
import dashboardRouter from "./routes/dashboard.routes.js";
import campanhasRouter from "./routes/campanhas.routes.js";
import { fileURLToPath } from "url";
import sessoesRouter from "./routes/sessoes.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(morgan("dev"));
app.use("/sessoes", sessoesRouter);
app.use(express.static(path.resolve(__dirname, "../public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "_layout");

app.use(cookieParser());
app.use(session({
  secret: "troque-este-segredo",
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: "lax" } // OK para localhost
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// somente flash global
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// Rotas
app.get("/", (req, res) => res.redirect("/dashboard"));
app.use("/dashboard", dashboardRouter);
app.use("/campanhas", campanhasRouter);

// 404
app.use((req, res) => res.status(404).send("Página não encontrada"));

// Erros (inclui CSRF por rota)
app.use((err, req, res, next) => {
  if (err && err.code === "EBADCSRFTOKEN") {
    return res.status(403).send("Falha na verificação CSRF.");
  }
  console.error(err);
  res.status(500).send("Erro interno do servidor.");
});

export default app;
