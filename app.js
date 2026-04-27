const express = require("express");
const path = require("path");
const app = express();
const morgan = require("morgan");
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(morgan("tiny"));

app.get("/", function (req, res) {
  res.render("index", { title: "Flickerdocs", page: "editor" });
});

app.get("/about", function (req, res) {
  res.render("about", { title: "About — Flickerdocs", page: "about" });
});

app.get("/how-it-works", function (req, res) {
  res.render("how-it-works", {
    title: "How it works — Flickerdocs",
    page: "how-it-works",
  });
});

app.get("/playground", function (req, res) {
  res.render("playground", {
    title: "Playground — Flickerdocs",
    page: "playground",
  });
});

var srv = app.listen(port, function () {
  console.log("Listening on " + port);
});

app.use(
  "/peerjs",
  require("peer").ExpressPeerServer(srv, {
    debug: true,
  })
);
