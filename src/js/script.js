const reload = () => {
	location.reload();
};

const refreshImages = (imagesFolder, imgsFolderFiles) => {
	var imgsHTML = "";
	if (imgsFolderFiles.length > 0) {
		// if images folder has files
		//loop through each of the files
		imgsFolderFiles.forEach(imageFile => {
			//make a div tag that renders the images as the div background image
			imgsHTML += `<div class="gallery-img" style="background-image: url('${imagesFolder}/${imageFile}'); background-size: 100% 100%;" onmouseout="hideWallpaperBtn(this)" onmouseover="showWallpaperBtn(this)">
                  <button class="btn info" onclick="setAsWallpaper('${imagesFolder}/${imageFile}')">Set as Desktop Wallpaper</button>
                </div>`;
		});
	} else {
		// show a message if the user does not have any pics ... usually because Windows Spotlight is not activated
		imgsHTML += ` < div class = "center msg" id = "msg_area" >
            <p> No Windows Spotlight Images were found on your computer. </p> 
            <p> go to personalization settings and check if Spotlight is enabled under lock screen tab and < a href = "#" onclick = "refreshImages()" > refresh < /a></p>
            </div>`;
	}

	var imgsArea = document.getElementById("imgs-area");
	if (imgsHTML != "") {
		imgsArea.innerHTML = imgsHTML;
	}
};
const refreshImagesList = async () => {
	$("#grid").empty();
	await toast("Refreshing ...");
	const payload = await window.refreshImageList();
	if (payload.imgsFolderFiles.length > 0) {
		for (let [key, image] of payload.imgsFolderFiles.entries()) {
			let imageHTML = `<div class="col-md-4 pt-5"><div class="card bg-transparent border border-secondary text-white"><img class="card-img" src="${
				payload.imgsFolder
			}/${image}" alt="Image ${key + 1}" /> <div class="card-img-overlay"> <h5 class="card-title">${key + 1}.</h5> </div> <div class="card-footer d-flex justify-content-around"> <a href="${
				payload.imgsFolder
			}/${image}" data-fancybox="images"><h5 class="text-white-50" data-tooltip="View"><i class="fa fa-picture-o"></i></h5></a><h5 class="text-white-50" data-url="${
				payload.imgsFolder
			}/${image}" onclick="setWallpaper(this)" data-tooltip="Set as wallpaper"><i class="fa fa-desktop"></i></h5><h5 class="text-danger" data-url="${
				payload.imgsFolder
			}/${image}" onclick="deleteImage(this)" data-tooltip="Delete"><i class="fa fa-trash-o"></i></h5></div></div> </div>`;

			$("#grid").append(imageHTML);
		}
	}
};

const toast = async message => {
	$("#snackbar")
		.html(message)
		.addClass("show");

	setTimeout(() => {
		$("#snackbar")
			.html("")
			.removeClass("show");
	}, 3000);
};

const deleteImage = async identifier => {
	await toast("Deleting ...");
	toast(await window.deletePicture($(identifier).data("url")));
};

const setWallpaper = async identifier => {
	await toast("Setting wallpaper...");
	toast(await window.setWallpaperImage($(identifier).data("url")));
};
// Hamburger menu
$(document).ready(function() {
	// Users can skip the loading process if they want.
	$(".skip").click(function() {
		$(".overlay, body").addClass("loaded");
	});
	// Will wait for everything on the page to load.
	$(window).bind("load", function() {
		$(".overlayz, body").addClass("loaded");
		setTimeout(function() {
			$(".overlayz").css({ display: "none" });
		}, 2000);
	});

	// Will remove overlay after 1min for users cannnot load properly.
	setTimeout(function() {
		$(".overlayz, body").addClass("loaded");
		toast("Error loading view");
	}, 60000);

	let trigger = $(".hamburger"),
		overlay = $(".overlay"),
		isClosed = false;

	trigger.click(function() {
		hamburger_cross();
	});

	function hamburger_cross() {
		if (isClosed == true) {
			overlay.hide();
			trigger.removeClass("is-open");
			trigger.addClass("is-closed");
			isClosed = false;
		} else {
			overlay.show();
			trigger.removeClass("is-closed");
			trigger.addClass("is-open");
			isClosed = true;
		}
	}

	$('[data-toggle="offcanvas"]').click(function() {
		$("#wrapper").toggleClass("toggled");
	});

	// Refresh image gallery
	$("#refresh").click(async function() {
		$(this).addClass("fa-spin");
		refreshImagesList();
		setTimeout(() => {
			$(this).removeClass("fa-spin");
		}, 3000);
	});

	$("#imagesFolder").click(event => {
		event.preventDefault();
		toast("Opening folder ...");
		window.openFolder();
	});
	$("#username").html(window.loadUser());
});
