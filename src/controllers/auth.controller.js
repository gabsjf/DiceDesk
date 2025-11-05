// src/controllers/auth.controller.js

import { adminAuth } from "../config/firebase.js";

const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

export const loginGet = (req, res) => {
  if (res.locals.isLoggedIn) {
    return res.redirect("/dashboard");
  }
  res.render("auth/login", {
    title: "Login",
    layout: "layouts/auth_layout",
  });
};

export const loginPost = async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) {
    return res.status(401).send("Token ausente.");
  }

  try {
    // opcional para diagnósticos: garante que o token é do seu projeto e está válido
    await adminAuth.verifyIdToken(idToken, true);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: MAX_AGE });

    const isLocalhost = req.hostname === "localhost" || req.hostname === "127.0.0.1";
    res.cookie("session", sessionCookie, {
      httpOnly: true,
      sameSite: "Lax",
      secure: !isLocalhost, // true somente em HTTPS
      maxAge: MAX_AGE,
    });

    return res.status(200).json({ redirect: "/dashboard" });
  } catch (error) {
    console.error("Erro ao criar cookie de sessão:", error);
    return res.status(401).send("Falha na autenticação. Token inválido, expirado ou de outro projeto.");
  }
};

export const registerGet = (req, res) => {
  if (res.locals.isLoggedIn) {
    return res.redirect("/dashboard");
  }
  res.render("auth/register", {
    title: "Cadastro",
    layout: "layouts/auth_layout",
  });
};

export const registerPost = async (req, res) => {
  // o cadastro do usuário é feito no cliente, aqui apenas criamos a sessão como no login
  return loginPost(req, res);
};

export const logout = async (req, res) => {
  try {
    const cookie = req.cookies?.session;
    if (cookie) {
      const decoded = await adminAuth.verifySessionCookie(cookie, true);
      await adminAuth.revokeRefreshTokens(decoded.sub);
    }
  } catch {}
  res.clearCookie("session");
  return res.redirect("/login");
};
