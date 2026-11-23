const form = document.querySelector("#info-form");
const result = document.querySelector("#result");
const completion = document.querySelector("#completion");
const progressBar = document.querySelector("#progress-bar");
const qrContainer = document.querySelector("#qrcode");

const fields = Array.from(form.querySelectorAll("input, textarea"));

function getData() {
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.consent;
  return data;
}

function updateProgress() {
  const fillable = fields.filter((field) => field.type !== "checkbox");
  const filled = fillable.filter((field) => field.value.trim()).length;
  const percent = Math.round((filled / fillable.length) * 100);
  completion.textContent = `${percent} %`;
  progressBar.style.width = `${percent}%`;
}

fields.forEach((field) => {
  field.addEventListener("input", updateProgress);
  field.addEventListener("change", updateProgress);
});

function encodeShareUrl(data) {
  const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  return `${window.location.href.split("#")[0]}#data=${base64}`;
}

function decodeSharedData() {
  const match = window.location.hash.match(/^#data=(.+)$/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(match[1]))));
  } catch {
    return null;
  }
}

function showSharedProfile(data) {
  if (!data) return;
  form.hidden = true;
  result.hidden = false;
  document.querySelector("#profile-name").textContent =
    `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Profil partagé";
  new QRCode(qrContainer, {
    text: window.location.href,
    width: 256,
    height: 256,
    colorDark: "#17233b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = getData();
  const shareUrl = encodeShareUrl(data);

  const submissions = JSON.parse(localStorage.getItem("infolink-submissions") || "[]");
  submissions.push({ ...data, createdAt: new Date().toISOString() });
  localStorage.setItem("infolink-submissions", JSON.stringify(submissions));

  form.hidden = true;
  result.hidden = false;
  document.querySelector("#profile-name").textContent =
    `${data.firstName || ""} ${data.lastName || ""}`.trim();

  qrContainer.innerHTML = "";
  new QRCode(qrContainer, {
    text: shareUrl,
    width: 256,
    height: 256,
    colorDark: "#17233b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
});

document.querySelector("#back-button").addEventListener("click", () => {
  result.hidden = true;
  form.hidden = false;
  window.location.hash = "";
});

document.querySelector("#download-qr").addEventListener("click", () => {
  const canvas = qrContainer.querySelector("canvas");
  const image = qrContainer.querySelector("img");
  if (canvas) {
    downloadBlob(canvas.toDataURL("image/png"), "infolink-qr-code.png");
  } else if (image) {
    downloadBlob(image.src, "infolink-qr-code.png");
  }
});

document.querySelector("#download-json").addEventListener("click", () => {
  const submissions = JSON.parse(localStorage.getItem("infolink-submissions") || "[]");
  const blob = new Blob([JSON.stringify(submissions, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, "infolink-donnees.json");
  URL.revokeObjectURL(url);
});

function downloadBlob(url, filename) {
  downloadUrl(url, filename);
}

function downloadUrl(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const sharedData = decodeSharedData();
if (sharedData) showSharedProfile(sharedData);
