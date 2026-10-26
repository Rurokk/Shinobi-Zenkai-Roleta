
const SUPABASE_URL = "https://sllolviwcpkyjqrcuoas.supabase.co";
const SUPABASE_KEY = "sb_publishable_IiiljDKowBA5XvvbbIu03A_r18Ikfj5";

const status = document.getElementById("connectionStatus");
const systemMessage = document.getElementById("systemMessage");
const loginBtn = document.getElementById("loginBtn");
const authMessage = document.getElementById("authMessage");
const clanList = document.getElementById("clanList");

let supabaseClient = null;

async function init() {
  if (
    SUPABASE_URL.includes("COLE_AQUI") ||
    SUPABASE_KEY.includes("COLE_AQUI")
  ) {
    status.textContent = "Configuração pendente";
    systemMessage.textContent =
      "Adicione a URL e a chave publicável do Supabase.";
    clanList.textContent = "Aguardando configuração.";
    return;
  }

  if (!window.supabase?.createClient) {
    status.textContent = "Biblioteca indisponível";
    systemMessage.textContent =
      "Não foi possível carregar a biblioteca do Supabase.";
    return;
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  try {
    const { data, error } = await supabaseClient
      .from("cla_opcoes")
      .select("id,nome")
      .eq("ativo", true)
      .order("nome");

    if (error) throw error;

    status.textContent = "Banco conectado";
    systemMessage.textContent =
      "Conexão com o Supabase estabelecida.";
    loginBtn.disabled = false;
    clanList.replaceChildren();

    if (!data?.length) {
      clanList.textContent = "Nenhum clã ativo encontrado.";
      return;
    }

    data.forEach(clan => {
      const chip = document.createElement("span");
      chip.className = "clan-chip";
      chip.textContent = clan.nome;
      clanList.appendChild(chip);
    });

  } catch (error) {
    console.error("Erro de conexão:", error);
    status.textContent = "Falha na conexão";
    systemMessage.textContent =
      "Erro ao consultar os clãs: " + error.message;
    clanList.textContent = "Não foi possível carregar os clãs.";
  }
}

loginBtn.addEventListener("click", async () => {
  if (!supabaseClient) return;

  loginBtn.disabled = true;
  authMessage.textContent = "Abrindo o login do Discord...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: window.location.origin + "/"
        }
      });

    if (error) throw error;

    if (data?.url) {
      window.location.assign(data.url);
    } else {
      throw new Error("URL de login não retornada.");
    }
  } catch (error) {
    console.error("Erro de login:", error);
    authMessage.textContent = "Falha no login: " + error.message;
    loginBtn.disabled = false;
  }
});

init();
