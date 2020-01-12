const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const isDev = require("electron-is-dev");

let mainWindow;

function createWindow() {
  console.log("createWindow Called!!!");

  var subpy = require("child_process").spawn("../venv/Scripts/python", [
    "../manage.py",
    "runserver"
  ]);

  var rq = require("request-promise");
  var mainAddr = "http://localhost:3000/";

  var openWindow = function() {
    console.log("openWindow Called!!!");

    mainWindow = new BrowserWindow({ width: 800, height: 600 });
    // mainWindow.loadURL("http://localhost:3000");

    mainWindow.loadURL(
      isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "../build/index.html")}`
    );
    // mainWindow.on("closed", () => (mainWindow = null));

    mainWindow.on("closed", function() {
      mainWindow = null;
      subpy.kill("SIGINT");
      //
      //    var subpy2 = require('child_process').spawn('TASKKILL', ['/F', '/IM', 'python.exe', '/T']);
    });
  };

  var startUp = function() {
    console.log("startUp Called!!!");
    rq(mainAddr)
      .then(function(htmlString) {
        console.log("Django iniciado!");
        openWindow();
      })
      .catch(function(err) {
        console.log(err, "error");
        startUp();
      });
  };
  startUp();
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
