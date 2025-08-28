

// Toggle tema claro/escuro
document.getElementById("themeToggle")?.addEventListener("click", () => {
  const html = document.documentElement;
  const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch {}
});

// Resgata tema salvo
(() => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch {}
})();

// Toggle sidebar (mobile)
document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  document.querySelector(".sidebar")?.classList.toggle("d-none");
});


