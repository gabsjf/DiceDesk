// public/js/combat.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("Combat.js carregado");

  // Verifica se as variáveis globais estão disponíveis
  if (!window.sessaoId || !window.userId) {
    console.error("sessaoId ou userId não definidos. Verifique se a view joga.ejs está injetando esses valores.");
    return;
  }

  console.log("Sessão atual:", window.sessaoId);

  const btnIniciar = document.getElementById("btnIniciarCombate");

  if (!btnIniciar) {
    console.warn("Botão de iniciar combate não encontrado na página.");
    return;
  }

  btnIniciar.addEventListener("click", async () => {
    console.log("Iniciando combate...");

    // Exemplo: coleta inputs de ordem de iniciativa
    const campos = document.querySelectorAll(".iniciativa-input");
    const order = [];

    campos.forEach((campo) => {
      const nome = campo.getAttribute("data-nome");
      const iniciativa = parseInt(campo.value) || 0;
      order.push({ nome, iniciativa });
    });

    try {
      const resposta = await fetch(`/sessoes/${window.sessaoId}/combat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: order,
          roundStart: 1,
        }),
        credentials: "include",
      });

      const data = await resposta.json();
      console.log("Resposta do servidor:", data);

      if (data.success) {
        alert("Combate iniciado com sucesso!");
      } else {
        alert("Erro ao iniciar combate: " + data.message);
      }
    } catch (err) {
      console.error("Erro ao enviar requisição:", err);
      alert("Erro interno ao iniciar combate.");
    }
  });
});
