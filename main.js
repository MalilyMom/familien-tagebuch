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
            const preview = text.split('\\n').slice(0,5).join(' ');
            return `
              <div class="card" onclick="editEntry('${date}')">
                <div class="entry-date">${formatDate(date)}</div>
                <div class="entry-title">${title}</div>
                <div class="entry-preview">${preview}</div>
              </div>
            `;
          }).join('')}
      </div>
      <button style="position:fixed; bottom:90px; left:calc(50% - 50px); transform:translateX(-50%);" onclick="backupDropbox()">sichern</button>
      <button class="fab" onclick="newEntry()">+</button>
    `;
  } else if (view === "add") {
    const today = editingDate || new Date().toISOString().split('T')[0];
    const existingTitle = editingDate ? entries[editingDate].title : "";
    const existingText = editingDate ? entries[editingDate].text : "";
    app.innerHTML = `
      <h2>${editingDate ? "Eintrag bearbeiten" : "Neuer Eintrag"}</h2>
      <div class="card">
        <label>Datum:<br><input type="date" id="date" value="${today}"></label>
        <br>
        <label>Titel:<br><input type="text" id="title" maxlength="100" value="${existingTitle}"></label>
        <br>
        <label>Eintrag:<br><textarea id="text">${existingText}</textarea></label>
        <br>
        <div class="button-group">
          <button onclick="saveEntry()">SPEICHERN</button>
          <button class="cancel" onclick="cancelEntry()">ABBRECHEN</button>
          ${editingDate ? '<button class="delete" onclick="deleteEntry()">LÖSCHEN</button>' : ''}
        </div>
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

function editEntry(date) {
  editingDate = date;
  view = "add";
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

function deleteEntry() {
  if (editingDate && confirm("Eintrag wirklich löschen?")) {
    delete entries[editingDate];
    localStorage.setItem("entries", JSON.stringify(entries));
    view = "list";
    render();
  }
}

function backupDropbox() {
  if (!accessToken) {
    window.location.href = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirect}`;
    return;
  }
  const jsonContent = JSON.stringify(entries, null, 2);
  uploadFile(jsonContent, "/tagebuch_backup.json");
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
  .then(() => alert(`Erfolgreich gesichert: ${path}`))
  .catch(err => alert("Fehler: "+err.message));
}

if (window.location.hash.includes("access_token")) {
  accessToken = new URLSearchParams(window.location.hash.substring(1)).get("access_token");
  window.location.hash = "";
  render();
}
