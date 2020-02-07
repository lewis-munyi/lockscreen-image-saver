// Import modules
const { app, BrowserWindow, Menu, ipcMain, shell, Tray } = require("electron");
// Enable live reload for all the files inside your project directory
// require("electron-reload")(__dirname);
const path = require("path");
const os = require("os");
const fs = require("fs");
const Jimp = require("jimp");
const wallpaper = require("wallpaper");
const AutoLaunch = require("auto-launch");

// Global variables
const username = os.userInfo().username; //gets the username of the os's logged in user
const spotlightFolder = `C:/Users/${username}/AppData/Local/Packages/Microsoft.Windows.ContentDeliveryManager_cw5n1h2txyewy/LocalState/Assets`;

const createImagesFolder = () => {
	let defaultImagesFolderPath = (app.getPath("pictures") + "/Spotlight Images").replace(/\\/g, "/");
	//replaces "frontlaces" with backslashes ^^^
	//check if default folder already exists
	if (!fs.existsSync(defaultImagesFolderPath)) {
		//make images folder if it does not exist
		fs.mkdirSync(defaultImagesFolderPath, "0o765");
		return defaultImagesFolderPath;
	} else {
		//return default folder if it already exists
		return defaultImagesFolderPath;
	}
};

const appImgsFolder = createImagesFolder();

const startupArgs = process.argv || [];

const readAnonymFile = imagePath => {
	return new Promise((resolve, reject) => {
		const filename = path.basename(imagePath);
		Jimp.read(imagePath, function(err, img) {
			if (err) {
				resolve({
					error: "file is not an img.",
					file: filename,
					status: "reject"
				});
			} else if (img) {
				resolve({
					image: img,
					file: filename,
					status: "resolve"
				});
			} else {
				//this will virtually never happen
				reject("function failed");
			}
		});
	});
};

const updateImagesFolder = async (appImgsFolder, spotlightFolder) => {
	//below vars store an array of filenames in the respective folders
	let spotlightFolderFiles = fs.readdirSync(spotlightFolder);
	let imgsFolderFiles = fs.readdirSync(appImgsFolder);

	let promises = []; //will store an array of promises for a Promise.all func
	spotlightFolderFiles.forEach(file => {
		promises.push(readAnonymFile(`${spotlightFolder}/${file}`));
	});

	await Promise.all(promises)
		.then(results => {
			//results is an array with both non image files marked with status 'reject' and image files
			//images filters results for only image files... however even icons are img files
			var images = results.filter(result => result.status === "resolve");

			images.forEach(imgFile => {
				let filename = imgFile.file;
				let imgObj = imgFile.image;
				let w = imgObj.bitmap.width; // the width of the image
				let h = imgObj.bitmap.height; //height of image
				//check if image is rectangular and width is big enuf to be wallpaper
				if (h < w && w > 1000 && imgsFolderFiles.indexOf(`${filename}.jpg`) == -1) {
					imgObj.write(`${appImgsFolder}/${filename}.jpg`, function() {
						// save file to images folder and log if successfull
					});
				}
			});
		})
		.catch(error => {
			console.log(error);
		});
};

function createWindow() {
	/**Start */
	if (startupArgs.indexOf("--hidden") == -1) {
		//this is a normal user-initiated startup
		// Create the browser window.
		mainWindow = new BrowserWindow({
			width: 1200,
			height: 800,
			webPreferences: {
				preload: path.join(__dirname, "preload.js"),
				nodeIntegration: false
			}
		});

		// and load the index.html of the app.
		// and load the index.html of the app.
		mainWindow.loadFile(path.join(__dirname, "src/gallery.html"));

		// uncomment next line to Open the DevTools.
		// mainWindow.webContents.openDevTools();

		// Emitted when the window is closed.
		mainWindow.on("closed", () => {
			mainWindow = null;
		});

		//removes default main menu for the app
		Menu.setApplicationMenu(null);
	} else {
		//auto-launcher started the app;
		//this is a silent startup, notice we don't load any url here
		const iconName = "spotlight.png"; //<--remember to add an icon with this name in you apps root directory
		const iconPath = path.join(__dirname, iconName);
		const appIcon = new Tray(iconPath);
		appIcon.setToolTip(`Getting Windows Spotlight Images. This won't take long...`);

		updateImagesFolder(appImgsFolder, spotlightFolder).then(
			setTimeout(function() {
				app.quit();
			}, 10000)
		);
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Autostart app on login
const appAutoLauncher = new AutoLaunch({
	name: "Windows Spotlight Saver",
	path: app.getPath("exe"),
	isHidden: true
});

appAutoLauncher
	.isEnabled()
	.then(function(isEnabled) {
		if (isEnabled) {
			return;
		}
		appAutoLauncher.enable();
	})
	.catch(function(err) {
		console.log(err);
	});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("synchronous-message", (event, arg) => {
	console.log(arg); // prints "ping"
	event.returnValue = arg + "pong";
});

ipcMain.on("refresh-image-list", event => {
	updateImagesFolder(appImgsFolder, spotlightFolder);
	//get the filenames in the images folder after it has been updated above
	var imgsFolderFiles = fs.readdirSync(appImgsFolder);
	//payload defines a message we can send to the ui window
	var payload = {
		imgsFolder: appImgsFolder,
		imgsFolderFiles: imgsFolderFiles
	};
	event.returnValue = payload;
});

ipcMain.on("open-folder", event => {
	shell.openItem(appImgsFolder);
});

ipcMain.on("delete-image", (event, url) => {
	fs.unlink(url, error => {
		if (error) event.returnValue = "Error deleting image";
		event.returnValue = "Deleted.";
	});
});

ipcMain.on("set-wallpaper", async (event, url) => {
	try {
		// await wallpaper.set("unicorn.jpg");
		await wallpaper.set(url);
		event.returnValue = "Wallpaper set successfully";
	} catch (e) {
		event.returnValue = "Error setting wallpaper";
	}
});
