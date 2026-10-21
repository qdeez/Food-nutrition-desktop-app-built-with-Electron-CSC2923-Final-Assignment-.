const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    title: "NutritionPlan",
    webPreferences: {
      contextIsolation: true 
    }
  });
  win.loadFile("index.html"); 
}

app.whenReady().then(createWindow);


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});