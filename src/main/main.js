const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("node:path");
const { createStore } = require("./store");

app.setName("GureevDoc");

let mainWindow;
let store;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: "#EDEEE9",
    title: "GureevDoc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

function registerIpc() {
  const invoke = (channel, handler) => {
    ipcMain.handle(channel, async (_event, payload) => handler(payload));
  };

  invoke("objects:list", () => store.listObjects());
  invoke("objects:get", ({ id }) => store.getObjectDetails(id));
  invoke("objects:create", (payload) => store.createObject(payload));
  invoke("objects:update", (payload) => store.updateObject(payload));
  invoke("objects:delete", ({ id }) => store.deleteObject(id));

  invoke("contracts:create", (payload) => store.createContract(payload));
  invoke("contracts:update", (payload) => store.updateContract(payload));
  invoke("contracts:delete", ({ id }) => store.deleteContract(id));

  invoke("annexes:create", (payload) => store.createAnnex(payload));
  invoke("annexes:update", (payload) => store.updateAnnex(payload));
  invoke("annexes:delete", ({ id }) => store.deleteAnnex(id));

  invoke("secondary:create", (payload) => store.createSecondaryDocument(payload));
  invoke("secondary:update", (payload) => store.updateSecondaryDocument(payload));
  invoke("secondary:delete", ({ id }) => store.deleteSecondaryDocument(id));

  invoke("registry:list", () => store.listRegistryDocuments());

  invoke("backup:export", async () => {
    const date = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Экспорт данных GureevDoc",
      defaultPath: `GureevDoc-export-${date}.zip`,
      filters: [
        { name: "ZIP архив", extensions: ["zip"] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }

    return store.exportAllData(result.filePath);
  });

  invoke("backup:import", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Импорт данных GureevDoc",
      properties: ["openFile"],
      filters: [
        { name: "ZIP архив", extensions: ["zip"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }

    return store.importAllData(result.filePaths[0]);
  });

  invoke("files:select", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Выберите документ",
      properties: ["openFile"],
      filters: [
        { name: "Документы", extensions: ["pdf", "png", "jpg", "jpeg", "tif", "tiff", "doc", "docx", "xls", "xlsx"] },
        { name: "Все файлы", extensions: ["*"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    return {
      sourceFilePath: filePath,
      originalFilename: path.basename(filePath),
    };
  });

  invoke("files:open", async ({ filePath }) => {
    if (!filePath) return { ok: false, message: "Файл не указан" };
    const message = await shell.openPath(filePath);
    return { ok: message.length === 0, message };
  });
}

app.whenReady().then(() => {
  store = createStore(app.getPath("userData"));
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
