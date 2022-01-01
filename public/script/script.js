var isDesktop = null;
var qrCode = null;
var html5QrcodeScanner = null;
var id = null;

if (window.innerWidth > 800) {
  isDesktop = true;
  document.querySelector(".desktop-button").style.color = "red";
} else {
  isDesktop = false;
  document.querySelector(".mobile-button").style.color = "red";
}

if (isDesktop) {
  if (window.location.pathname != "/") window.location.href = "/";
  initDesktop();
} else {
  initMobile();
}

function initDesktop() {
  dynamicallyLoadScript("/socket.io/socket.io.js", "socket-loader");
  dynamicallyLoadScript("/script/qrcode.min.js", "qrcode-loader");

  var script = document.querySelector(".socket-loader");
  script.addEventListener("load", function () {
    startSocket();
  });
}

function initMobile() {
  id = window.location.pathname.split("/")[2];
  if (!id) {
    document.querySelector(".center").innerHTML = "No id";
    return;
  }
  dynamicallyLoadScript("https://unpkg.com/html5-qrcode", "qrscanner-loader");

  var script = document.querySelector(".qrscanner-loader");
  script.addEventListener("load", function () {
    html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  });
}

function startSocket() {
  const socket = io();

  socket.on("connect", () => {
    console.log(socket.id); // ojIckSD2jqNzOqIrAGzL
    generateQR(socket.id);
  });

  socket.on("epcLink", function (msg) {
    showNewQr(msg);
  });
}

function showNewQr(msg) {
  document.querySelector(".link").innerHTML = "";
  document.querySelector(".qrcode").innerHTML = "";
  const imgDiv = document.createElement("img");
  imgDiv.src = msg;
  document.querySelector(".qrcode").appendChild(imgDiv);
}

function generateQR(socketId) {
  const link = "https://revolutupn.herokuapp.com/id/" + socketId;
  document.querySelector(".link").innerHTML = link;
  document.querySelector(".qrcode").innerHTML = "";
  qrCode = new QRCode(document.querySelector(".qrcode"), link);
}

function dynamicallyLoadScript(url, className) {
  var script = document.createElement("script");
  script.src = url;
  script.className = className;
  document.head.appendChild(script);
}

function onScanSuccess(decodedText, decodedResult) {
  // handle the scanned code as you like, for example:
  console.log(`Code matched = ${decodedText}`, decodedResult);

  html5QrcodeScanner
    .clear()
    .then((_) => {
      // the UI should be cleared here
    })
    .catch((error) => {
      // Could not stop scanning for reasons specified in `error`.
      // This conditions should ideally not happen.
    });
  sendToServer(decodedText);
}

function sendToServer(decodedText) {
  fetch("/id/" + id, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify(decodedText),
  })
    .then((response) => response.json())
    .then((data) => {
      document.querySelector(".center").innerHTML = data.message;
    });

  //return response.json();
}

function onScanFailure(error) {
  // handle scan failure, usually better to ignore and keep scanning.
  // for example:
  console.warn(`Code scan error = ${error}`);
}
