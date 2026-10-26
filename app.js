
const SUPABASE_URL = "https://sllolviwcpkyjqrcuoas.supabase.co";
const SUPABASE_KEY = "sb_publishable_IiiljDKowBA5XvvbbIu03A_r18Ikfj5";

const status = document.getElementById("connectionStatus");
const systemMessage = document.getElementById("systemMessage");
const loginBtn = document.getElementById("loginBtn");
const authMessage = document.getElementById("authMessage");
const clanList = document.getElementById("clanList");
const spinBtn = document.getElementById("spinBtn");
const spinMessage = document.getElementById("spinMessage");

let supabaseClient = null;
let clans = [];
let spinning = false;
let currentUser = null;

function showMessage(message) {
  if (spinMessage) spinMessage.textContent = message;
}

function setupPlayerInfo() {
  let info = document.getElementById("playerProgress");

  if (!info && spinMessage) {
    info = document.createElement("p");
    info.id = "playerProgress";
    spinMessage.insertAdjacentElement("afterend", info);
  }

  return info;
}

function setupHistory() {
  let history = document.getElementById("spinHistory");

  if (!history && spinMessage) {
    history = document.createElement("div");
    history.id = "spinHistory";
    history.innerHTML = "<h3>Histórico de giros</h3><ul></ul>";
    const progress = setupPlayerInfo();
    (progress || spinMessage).insertAdjacentElement("afterend", history);
  }

  return history;
}

function drawWheel(items) {
  const wheel = document.getElementById("wheel");
  if (!wheel) return;

  wheel.querySelectorAll(".wheel-label").forEach(el => el.remove());

  if (!items.length) {
    wheel.style.background = "#29131d";
    return;
  }

  const colors = [
    "#792238", "#34202d", "#a43b46", "#4b2637",
    "#986c3d", "#40202c", "#67233b", "#53313a"
  ];

  const step = 360 / items.length;

  wheel.style.background = `conic-gradient(from -90deg, ${
    items.map((clan, i) =>
      `${colors[i % colors.length]} ${i * step}deg ${(i + 1) * step}deg`
    ).join(",")
  })`;

  const size = wheel.clientWidth || 300;
  const radius = size * 0.39;
  const labelWidth = Math.min(68, size * 0.24);
  const fontSize = size < 280 ? 8 : 9;

  items.forEach((clan, i) => {
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

async function loadClans() {
  const { data, error } = await supabaseClient
    .from("cla_opcoes")
    .select("id,nome,peso,ativo")
    .eq("ativo", true)
    .order("id");

  if (error) throw error;

  clans = data || [];
  drawWheel(clans);
}

async function loadProgress() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient.rpc(
    "meu_progresso_giros"
  );

  if (error) {
    console.error("Erro ao carregar progresso:", error);
    return;
  }

  const info = setupPlayerInfo();
  if (!info) return;

  info.textContent =
    `Giros usados: ${data.giros_usados}/5 | ` +
    `Giros extras: ${data.giros_extras} | ` +
    `Giros disponíveis: ${data.giros_restantes}`;

  if (data.bloqueado) {
    showMessage("Sua conta está bloqueada para girar.");
    spinBtn.disabled = true;
  } else if (!spinning) {
    spinBtn.disabled = data.giros_restantes <= 0;
    if (data.giros_restantes <= 0) {
      showMessage("Você não tem giros disponíveis.");
    } else {
      showMessage("Tudo pronto! Você pode girar a roleta.");
    }
  }
}

async function loadHistory() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient.rpc(
    "meu_historico_giros"
  );

  if (error) {
    console.error("Erro ao carregar histórico:", error);
    return;
  }

  const history = setupHistory();
  const list = history?.querySelector("ul");
  if (!list) return;

  list.replaceChildren();

  if (!data || data.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Você ainda não realizou giros.";
    list.appendChild(item);
    return;
  }

  data.forEach(entry => {
    const item = document.createElement("li");
    const date = entry.criado_em
      ? new Date(entry.criado_em).toLocaleString("pt-BR")
      : "";

    item.textContent = date
      ? `${entry.cla} — ${date}`
      : entry.cla;

    list.appendChild(item);
  });
}

async function updatePlayerData() {
  await loadProgress();
  await loadHistory();
}


function animateWheel(clanName) {
  return new Promise(resolve => {
    const wheel = document.getElementById("wheel");

    if (!wheel || !clans.length) {
      resolve();
      return;
    }

    const index = clans.findIndex(
      clan => clan.nome === clanName
    );

    if (index < 0) {
      console.error("Clã sorteado não encontrado:", clanName);
      resolve();
      return;
    }

    const step = 360 / clans.length;

    // O primeiro segmento começa no topo (-90°).
    // Calculamos o centro exato do segmento sorteado.
    const segmentCenter = -90 + (index + 0.5) * step;

    // A seta fica no topo, em -90°.
    const targetAngle = -90 - segmentCenter;

    const currentRotation =
      Number(wheel.dataset.rotation || 0);

    const currentNormalized =
      ((currentRotation % 360) + 360) % 360;

    const targetNormalized =
      ((targetAngle % 360) + 360) % 360;

    const adjustment =
      (targetNormalized - currentNormalized + 360) % 360;

    const finalRotation =
      currentRotation + 360 * 6 + adjustment;

    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;

      wheel.removeEventListener("transitionend", onEnd);
      clearTimeout(fallback);

      resolve();
    }

    function onEnd(event) {
      if (event.target === wheel && event.propertyName === "transform") {
        finish();
      }
    }

    wheel.addEventListener("transitionend", onEnd);

    const fallback = setTimeout(finish, 5500);

    wheel.style.transition =
      "transform 5s cubic-bezier(0.12, 0.75, 0.12, 1)";

    wheel.style.transform =
      `rotate(${finalRotation}deg)`;

    wheel.dataset.rotation = String(finalRotation);
  });
}


async function doSpin() {
  if (!supabaseClient || !currentUser || spinning) return;

  spinning = true;
  spinBtn.disabled = true;
  showMessage("A roleta está girando...");

  try {
    // O banco decide o clã e controla o consumo do giro.
    const { data, error } = await supabaseClient.rpc("girar_roleta");

    if (error) throw error;

    const result = typeof data === "string" ? JSON.parse(data) : data;
    const clanName = result?.cla;

    if (!clanName) {
      throw new Error("O banco não retornou o clã sorteado.");
    }

    await animateWheel(clanName);

    showMessage(`🎉 Seu clã sorteado foi: ${clanName}!`);

    await updatePlayerData();
  } catch (error) {
    console.error("Erro ao girar:", error);
    showMessage(error.message || "Não foi possível realizar o giro.");
    await updatePlayerData();
  } finally {
    spinning = false;
    await loadProgress();
  }
}

async function updateAuthState(session) {
  currentUser = session?.user || null;

  if (currentUser) {
    loginBtn.textContent = "Discord conectado";
    loginBtn.disabled = true;
    authMessage.textContent =
      `Conectado como ${currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.email ||
      "jogador"}`;

    await updatePlayerData();
  } else {
    loginBtn.textContent = "Entrar com Discord";
    loginBtn.disabled = false;
    authMessage.textContent = "Entre com o Discord para jogar.";
    spinBtn.disabled = true;
    showMessage("Faça login para liberar seus giros.");
  }
}

async function init() {
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
    await loadClans();

    status.textContent = "Banco conectado";
    systemMessage.textContent =
      "Conexão com o Supabase estabelecida.";

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;

    await updateAuthState(data.session);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      // Evita operações assíncronas diretamente dentro do callback.
      setTimeout(() => updateAuthState(session), 0);
    });
  } catch (error) {
    console.error("Erro de inicialização:", error);
    status.textContent = "Falha na conexão";
    systemMessage.textContent =
      "Erro ao iniciar: " + error.message;
  }
}

loginBtn?.addEventListener("click", async () => {
  if (!supabaseClient) return;

  loginBtn.disabled = true;
  authMessage.textContent = "Abrindo o login do Discord...";

  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: window.location.origin + "/"
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error("Erro de login:", error);
    authMessage.textContent = "Falha no login: " + error.message;
    loginBtn.disabled = false;
  }
});

spinBtn?.addEventListener("click", doSpin);

init();
