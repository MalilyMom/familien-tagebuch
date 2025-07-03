let view = "list";
let editingDate = null;
let accessToken = null;

const clientId = "av2fxabt2oi4u1m";
const redirect = "https://malilymom.github.io/familien-tagebuch/";

const entries = JSON.parse(localStorage.getItem("entries") || "{}");
render();

function render() {
  const app = document.getElementById("app");
  if (view === "list") {
    app.innerHTML = `
      <h1>Familien Tagebuch</h1>
      <div class="entry-list">
        ${Object.keys(entries)
          .sort()
          .reverse()
          .map(date => {
            const {title, text} = entries[date];
            const preview = text.split('\\n').slice(0,2).join(' ');
            return `
              <div class="card">
                <div class="entry-date">${formatDate(date)}</div>
                <div class="entry-title">${title}</div>
                <div class="entry-preview">${preview}</div>
              </div>
            `;
          }).join('')}
      </div>
      <button style="position:fixed; bottom:90px; left:50%; transform:translateX(-50%);" onclick="backupDropbox()">☁️ Dropbox sichern</button>
      <button class="fab" onclick="newEntry()">+</button>
    `;
  } else if (view === "add") {
    const today = editingDate || new Date().toISOString().split('T')[0];
    app.innerHTML = `
      <h2>Neuer Eintrag</h2>
      <div class="card">
        <label>Datum:<br><input type="date" id="date" value="${today}"></label>
        <br>
        <label>Titel:<br><input type="text" id="title" maxlength="100"></label>
        <br>
        <label>Eintrag:<br><textarea id="text"></textarea></label>
        <br>
        <button onclick="saveEntry()">SPEICHERN</button>
        <button class="cancel" onclick="cancelEntry()">ABBRECHEN</button>
      </div>
    `;
  }
}

function formatDate(iso) {
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  return new Date(iso).toLocaleDateString('de-DE', options).toUpperCase();
}

function newEntry() {
  view = "add";
  editingDate = null;
  render();
}

function saveEntry() {
  const date = document.getElementById("date").value;
  const title = document.getElementById("title").value;
  const text = document.getElementById("text").value;
  entries[date] = {title, text};
  localStorage.setItem("entries", JSON.stringify(entries));
  view = "list";
  render();
}

function cancelEntry() {
  view = "list";
  render();
}

function backupDropbox() {
  const clientId = "...";
  const redirect = "...";
  if (!accessToken) {
    window.location.href = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirect}`;
    return;
  }
  // JSON Backup
  const jsonContent = JSON.stringify(entries, null, 2);
  uploadFile(jsonContent, "/tagebuch_backup.json");

  // Klartext Backup
  const textContent = Object.entries(entries).map(([date, {title, text}]) =>
    `${formatDate(date)}\n${title}\n\n${text}\n\n---\n`).join('');
  uploadFile(textContent, "/tagebuch_backup.txt");
}

function uploadFile(content, path) {
  fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path,
        mode: "overwrite"
      }),
      "Content-Type": "application/octet-stream"
    },
    body: content
  })
  .then(r => r.json())
  .then(() => alert(`Erfolgreich in Dropbox gespeichert: ${path}`))
  .catch(err => alert("Fehler: "+err.message));
}

if (window.location.hash.includes("access_token")) {
  accessToken = new URLSearchParams(window.location.hash.substring(1)).get("access_token");
  window.location.hash = "";
  render();
}
