// ====== CONFIG ======
const TWITCH_CLIENT_ID = "y1z1ffxabakcw927se6dkm3jkhgpeb";
const TWITCH_APP_TOKEN = "u28d8ip1479nep4isnjeqb04pvjvx6";
const REFRESH_MS = 60_000;
const STREAMERS_TXT_URL = "streamers.txt";
const ORGANIZERS = ["Pochoskywalker", "GarleyQuinn", "Ninistre"];

// ====== TWITCH HELPERS ======
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
  if (!res.ok) {
    console.error("Erreur Helix", res.status);
    return [];
  }
  const data = await res.json();
  return data.data || [];
}

function createStreamerCard(login, live) {
  const card = document.createElement("div");
  card.className = "streamer-card";

  if (live) {
    const thumb = live.thumbnail_url.replace("{width}", "480").replace("{height}", "270") + `?t=${Date.now()}`;
    card.innerHTML = `
      <img src="${thumb}" alt="Miniature du live">
      <div class="info">
        <strong>${live.user_name}</strong> — <span class="live">LIVE</span> (${live.viewer_count} viewers)<br>
        <span class="title">${live.title || ""}</span>
      </div>
      <div class="actions">
        <button class="copy">Copier le pseudo</button>
        <a class="open" href="https://twitch.tv/${login}" target="_blank" rel="noopener">Ouvrir</a>
      </div>
    `;
    card.querySelector(".copy").addEventListener("click", () => navigator.clipboard.writeText(live.user_login));
  } else {
    card.innerHTML = `
      <div class="offline">OFF</div>
      <div class="info">
        <strong>${login}</strong> — Hors ligne
      </div>
      <div class="actions">
        <button class="copy">Copier le pseudo</button>
        <a class="open" href="https://twitch.tv/${login}" target="_blank" rel="noopener">Ouvrir</a>
      </div>
    `;
    card.querySelector(".copy").addEventListener("click", () => navigator.clipboard.writeText(login));
  }
  return card;
}

async function render() {
  const participants = await fetchStreamersList();
  // Inclure aussi les organisateurs dans la requête Helix
  const all = Array.from(new Set([...ORGANIZERS, ...participants]));
  const liveData = await fetchStreamData(all);
  const liveMap = new Map(liveData.map(s => [s.user_login.toLowerCase(), s]));

  // Organisateurs (centrés via CSS grid fixe 3 colonnes)
  const orgC = document.getElementById("organizers-list");
  orgC.innerHTML = "";
  ORGANIZERS.forEach(login => {
    const live = liveMap.get(login.toLowerCase()) || null;
    orgC.appendChild(createStreamerCard(login, live));
  });

  // Participants en live
  const liveC = document.getElementById("participants-live-list");
  liveC.innerHTML = "";
  participants
    .filter(p => !ORGANIZERS.map(o=>o.toLowerCase()).includes(p.toLowerCase()))
    .map(login => [login, liveMap.get(login.toLowerCase())])
    .filter(([, live]) => !!live)
    .sort((a,b)=> b[1].viewer_count - a[1].viewer_count)
    .forEach(([login, live]) => liveC.appendChild(createStreamerCard(login, live)));

  // Participants hors ligne
  const offC = document.getElementById("participants-off-list");
  offC.innerHTML = "";
  participants
    .filter(p => !ORGANIZERS.map(o=>o.toLowerCase()).includes(p.toLowerCase()))
    .filter(login => !liveMap.has(login.toLowerCase()))
    .sort((a,b)=> a.localeCompare(b, 'fr', {sensitivity:'base'}))
    .forEach(login => offC.appendChild(createStreamerCard(login, null)));
}

setInterval(render, REFRESH_MS);
render();
