const {
	app,
	BrowserWindow,
	ipcMain,
	remote
} = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
	let splashWin = new BrowserWindow({
		fullscreen: false,
		width: 300,
		height: 300,
		frame: false,
		toolbar: false,
		transparent: true,
		maximizable: false,
		resizable: false,
		minimizable: false,
		movable: false,
		icon: `file://${__dirname}/128.ico`,
		backgroundColor: "#80FFFFFF",
		// darkTheme:true
		// skipTaskbar: true
	});
	splashWin.loadURL(`file://${__dirname}/bg_000-font_fff.png`);

	// Create the browser window.
	win = new BrowserWindow({
		show: false,
		fullscreen: false,
		minWidth: 1000,
		width: 1000,
		height: 700,
		frame: true,
		toolbar: false,
		// transparent: true,
		maximizable: true,
		icon: `file://${__dirname}/128.ico`,
		// darkTheme:true
		// skipTaskbar: true
	});

	// and load the index.html of the app.
	win.loadURL(`file://${__dirname}/index.html`)

	// Open the DevTools.
	// win.webContents.openDevTools();
	// console.log("transparent", win.webContents.constructor.toString(), win.webContents.__proto__._init);
	win.webContents.browserWindowOptions.transparent = false;

	win.once('ready-to-show', () => {
		win.show();
		splashWin.close();
	});

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null
	});

	win.on("maximize", function() {
		console.log("WINDOW emit: maximize");
		// console.log(require('electron').remote, require('electron').remote.getCurrentWindow())
		win.webContents.send('maximize')
	});
	win.on("unmaximize", function() {
		console.log("WINDOW emit: unmaximize");
		win.webContents.send('unmaximize')
	});
	ipcMain.on("setMinimumSize", function(e, w, h) {
		console.log("setMinimumSize", w, h);
		if (!(w && h)) {
			var w_h = win.getMinimumSize();
			console.log(w_h)
			w || (w = w_h[0])
			h || (h = w_h[1])
		}
		win.setMinimumSize(w, h);
	});
	ipcMain.on("setPosition", function(e, x, y, is_ani) {
		console.log("setPosition", x, y, is_ani);
		if (x === "center") {
			win.center();
		} else {
			win.setPosition(x, y, is_ani);
		}
	});
	ipcMain.on("minimize", function(e) {
		console.log("minimize");
		win.minimize();
	});
	// let is_window_maximize = false;
	ipcMain.on("maximize", function(e) {
		console.log("maximize");
		// is_window_maximize = {
		// 	size:win.getSize()
		// }
		win.maximize();
	});
	ipcMain.on("unmaximize", function(e) {
		console.log("unmaximize");
		win.unmaximize();
	});
	ipcMain.on("close", function(e) {
		console.log("close");
		win.close();
	});
	ipcMain.on("setResizable", function(e, resizable) {
		win.setResizable(resizable);
	});
	ipcMain.on("setMaximizable", function(e, resizable) {
		win.setMaximizable(resizable);
	});
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
})


// app.setAsDefaultProtocolClient('http-zzz')

// app.on('open-url', function(event, url) {
// 	dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`)
// })