const CLIENT_ID = "HIER_DEIN_DROPBOX_APP_KEY";
const REDIRECT_URI = window.location.origin;

let accessToken = null;
const entries = JSON.parse(localStorage.getItem("entries") || "{}");

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function render() {
  document.getElementById("root").innerHTML = `
    <h1>🌿 Mein Familien-Tagebuch</h1>
    <div class="card">
      <label>Datum:
        <input type="date" id="date" value="${formatDate(new Date())}">
      </label>
      <label>Titel:
        <input type="text" id="title">
      </label>
      <label>Eintrag:
        <textarea id="text"></textarea>
      </label>
      <div style="margin-top:10px;">
        <button onclick="saveEntry()">💾 Speichern</button>
        <button onclick="exportEntries()">📄 Exportieren</button>
        <button onclick="uploadDropbox()">☁️ In Dropbox sichern</button>
      </div>
    </div>
    <div id="entries" style="margin-top:20px;"></div>
  `;
  listEntries();
}

function saveEntry() {
  const date = document.getElementById("date").value;
  const title = document.getElementById("title").value;
  const text = document.getElementById("text").value;
  entries[date] = { title, text };
  localStorage.setItem("entries", JSON.stringify(entries));
  alert("Gespeichert!");
  render();
}

function listEntries() {
  const container = document.getElementById("entries");
  container.innerHTML = "";
  Object.keys(entries)
    .sort()
    .reverse()
    .forEach(date => {
      const { title, text } = entries[date];
      container.innerHTML += `
        <div class="card">
          <strong>${date} – ${title}</strong>
          <p style="white-space: pre-wrap;">${text}</p>
        </div>
      `;
    });
}

function exportEntries() {
  const text = Object.entries(entries).map(([date, {title, text}]) => 
    `## ${date} - ${title}\n${text}\n`
  ).join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "tagebuch.txt";
  link.click();
}

function uploadDropbox() {
  if (!accessToken) {
    window.location.href = `https://www.dropbox.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}`;
    return;
  }
  const content = JSON.stringify(entries, null, 2);
  fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: "/tagebuch_backup.json",
        mode: "overwrite"
      }),
      "Content-Type": "application/octet-stream"
    },
    body: content
  })
  .then(r => r.json())
  .then(() => alert("Erfolgreich in Dropbox gespeichert!"))
  .catch(err => alert("Fehler: "+err.message));
}

if (window.location.hash.includes("access_token")) {
  accessToken = new URLSearchParams(window.location.hash.substring(1)).get("access_token");
  window.location.hash = "";
}

render();
