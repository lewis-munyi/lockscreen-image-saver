// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer, electron } = require("electron");
const os = require("os");
window.addEventListener("DOMContentLoaded", () => {
	const replaceText = (selector, text) => {
		const element = document.getElementById(selector);
		if (element) element.innerText = text;
	};

	for (const type of ["chrome", "node", "electron"]) {
		replaceText(`${type}-version`, process.versions[type]);
	}
});

window.refreshImageList = function() {
	return ipcRenderer.sendSync("refresh-image-list");
};

window.openFolder = () => {
	ipcRenderer.sendSync("open-folder");
};

window.deletePicture = url => {
	return ipcRenderer.sendSync("delete-image", url);
};

window.setWallpaperImage = url => {
	return ipcRenderer.sendSync("set-wallpaper", url);
};

window.loadUser = () => {
	return os.userInfo().username;
};
