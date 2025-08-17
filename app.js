// ====== CONFIG À RENSEIGNER ======
const TWITCH_CLIENT_ID = "ewuh2hnhg1crfe8dwwvjb54gosuyvo"; 
const TWITCH_APP_TOKEN = "u28d8ip1479nep4isnjeqb04pvjvx6"; // Token intégré
const REFRESH_MS = 60_000; // 60s
const STREAMERS_TXT_URL = "streamers.txt"; 

// Organisateurs affichés en haut
const ORGANIZERS = ["Pochoskywalker", "GarleyQuinn", "Ninistre"];

// ====== OUTILS TWITCH ======
const twitchHeaders = {
  "Client-ID": TWITCH_CLIENT_ID,
  "Authorization": `Bearer ${TWITCH_APP_TOKEN}`,
};

async function fetchStreamersList() {
  const res = await fetch(STREAMERS_TXT_URL, { cache: "no-store" });
  const text = await res.text();
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

async function fetchStreamData(logins) {
  const url = new URL("https://api.twitch.tv/helix/streams");
  logins.forEach(login => url.searchParams.append("user_login", login));
  const res = await fetch(url, { headers: twitchHeaders });
  const data = await res.json();
  return data.data || [];
}

async function render() {
  const streamers = await fetchStreamersList();
  const liveData = await fetchStreamData(streamers);

  const liveLogins = liveData.map(s => s.user_login.toLowerCase());

  // Organisateurs
  const orgContainer = document.getElementById("organizers-list");
  orgContainer.innerHTML = "";
  ORGANIZERS.forEach(login => {
    const streamer = liveData.find(s => s.user_login.toLowerCase() === login.toLowerCase());
    orgContainer.appendChild(createStreamerCard(login, streamer));
  });

  // Participants en live
  const liveContainer = document.getElementById("participants-live-list");
  liveContainer.innerHTML = "";
  streamers.filter(s => !ORGANIZERS.includes(s)).forEach(login => {
    const streamer = liveData.find(s => s.user_login.toLowerCase() === login.toLowerCase());
    if (streamer) liveContainer.appendChild(createStreamerCard(login, streamer));
  });

  // Participants hors ligne
  const offContainer = document.getElementById("participants-off-list");
  offContainer.innerHTML = "";
  streamers.filter(s => !ORGANIZERS.includes(s)).forEach(login => {
    if (!liveLogins.includes(login.toLowerCase())) {
      offContainer.appendChild(createStreamerCard(login, null));
    }
  });
}

function createStreamerCard(login, data) {
  const card = document.createElement("div");
  card.className = "streamer-card";

  if (data) {
    card.innerHTML = `
      <img src="\${data.thumbnail_url.replace('{width}', '320').replace('{height}', '180')}" alt="Miniature du live">
      <div class="info">
        <strong>\${data.user_name}</strong> - LIVE (\${data.viewer_count} viewers)<br>
        <span>\${data.title}</span>
      </div>
      <button onclick="copyToClipboard('\${data.user_name}')">Copier le pseudo</button>
    `;
  } else {
    card.innerHTML = `
      <div class="offline">OFF</div>
      <div class="info">
        <strong>\${login}</strong> - Hors ligne
      </div>
      <button onclick="copyToClipboard('\${login}')">Copier le pseudo</button>
    `;
  }
  return card;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  alert("Pseudo copié : " + text);
}

setInterval(render, REFRESH_MS);
render();
