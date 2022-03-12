const { decode } = require("upnqr");
const cors = require("cors");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.text());

app.use(express.static(__dirname + "/public"));

app.get("/ping", (req, res) => {
  res.send("OK");
});

app.post("/id/:id", (req, res) => {
  const id = req.params.id;
  console.log("Post request to id: ", id);

  if (!io.sockets.adapter.rooms.get(req.params.id)) {
    console.log("400: Invalid ID", id);
    res.status(400).send({ error: true, message: "Neveljaven ID" });
    return;
  }

  try {
    upn = decode(req.body.replace('"', ""), "\\n");
    epcLink = parseUPN(upn);
  } catch (error) {
    console.log("400: UPNQR error", error);
    console.log("400: UPNQR body", req.body);
    res.status(400).send({ error: true, message: "Napaka UPNQR" });
    return;
  }

  console.log(upn);

  io.to(req.params.id).emit("epcLink", epcLink);

  res.send({ error: false, message: "Thanks for using RevolutUPN" });
});

io.on("connection", (socket) => {
  console.log("connected", socket.id);
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at ${port}`);
});

function parseUPN(upn) {
  const params = new URLSearchParams({
    bname: upn["ime_prejemnika"],
    iban: upn["IBAN_prejemnika"],
    euro: upn["znesek"],
    info: upn["referenca_prejemnika"],
  });
  return "https://epc-qr.eu/?" + params.toString();
}
