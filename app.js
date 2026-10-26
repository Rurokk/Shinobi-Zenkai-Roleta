
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
    
drawWheel(data || []);

document.getElementById("spinBtn").disabled = true;
document.getElementById("spinMessage").textContent =
  "Roleta carregada. O sorteio seguro será ativado na próxima etapa.";


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

function drawWheel(clans) {
  const wheel = document.getElementById("wheel");
  if (!wheel) return;

  wheel.querySelectorAll(".wheel-label").forEach(el => el.remove());

  if (!clans || clans.length === 0) {
    wheel.style.background = "#29131d";
    return;
  }

  const colors = [
    "#792238", "#34202d", "#a43b46", "#4b2637",
    "#986c3d", "#40202c", "#67233b", "#53313a"
  ];

  const step = 360 / clans.length;

  wheel.style.background = `conic-gradient(from -90deg, ${
    clans.map((clan, i) =>
      `${colors[i % colors.length]} ${i * step}deg ${(i + 1) * step}deg`
    ).join(",")
  })`;

  const size = wheel.clientWidth || 300;
  const radius = size * 0.39;
const labelWidth = Math.min(68, size * 0.24);
const fontSize = size < 280 ? 8 : 9;

  clans.forEach((clan, i) => {
    const angle = i * step + step / 2 - 90;

    const label = document.createElement("div");
    label.className = "wheel-label";
    label.style.transform = `rotate(${angle}deg)`;

    const span = document.createElement("span");
    span.textContent = clan.nome;
    span.style.setProperty("--label-width", `${labelWidth}px`);
    span.style.setProperty("--label-size", `${fontSize}px`);
    span.style.setProperty("--label-radius", `${radius}px`);
    span.style.setProperty("--counter-angle", `${-angle}deg`);

    label.appendChild(span);
    wheel.appendChild(label);
  });
}


init();
