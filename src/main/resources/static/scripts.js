import {convertToBlob, convertToBlobArray, initUploadFileForm, Marquee, SpriteData, SpritesheetData} from "./models.js";
import {sendBlobDetectionRequest} from "./requests.js"
import {
    cropImage,
    cropSprite,
    getMaxDimensions,
    mergeBlobsInlist,
    rectContainsPoint,
    rectIntersects,
    removePoints
} from "./utils.js";

// DOMs
const spritesheetForm = document.getElementById("spritesheetForm")
const spriteForm = document.getElementById("spriteForm")

/**
 * @typedef {HTMLCanvasElement & Object} HTMLCanvasElement
 * @property {number} scale
 * @property {Function} draw
 */

/**
 * @type {{PLAYER: HTMLCanvasElement, SPRITE: HTMLCanvasElement, CROP: HTMLCanvasElement}}
 */
const CANVASES = {
    CROP: document.getElementById("cropCanvas"),
    SPRITE: document.getElementById("spriteCanvas"),
    PLAYER: document.getElementById("playerCanvas"),
}

const DEFAULT_WIDTH = CANVASES.CROP.width;
const DEFAULT_HEIGHT = CANVASES.CROP.height;

Object.keys(CANVASES).forEach(k => CANVASES[k].scale = 1.0)

const alertToast = document.getElementById("alertToast");


// Blob buttons
const thresholdUp = document.getElementById("thresholdUp")
const thresholdDown = document.getElementById("thresholdDown")

const mergeBlobButton = document.getElementById("mergeButton")
const deleteBlobButton = document.getElementById("deleteBlobButton")
const removePointsButton = document.getElementById("removePointsButton")

const showNumberCheckbox = document.getElementById("showNumbers")

const playButton = document.getElementById("playButton")
const playIcon = document.getElementById("playIcon")
const nextButton = document.getElementById("nextFrame")
const previousButton = document.getElementById("previousFrame")
const loopButton = document.getElementById("loop")

const downloadButton = document.getElementById("downloadSpriteButton")

// Parameters
let fps = 12;

const BLOB_COLOR = "rgba(255, 0, 0, 0.5)"
const SELECTED_BLOB_COLOR = "rgba(255, 0, 0, 0.5)"

const POINT_COLOR = "rgba(0, 0, 255, 0.5)"

const EDITED_BLOB_COLOR = "rgba(0,255,0, 1.0)"
const SELECTED_EDITED_BLOB_COLOR = "rgba(0,255,0,0.5)"

const TEXT_COLOR = "rgba(255, 255, 255, 1.0)"
const TEXT_BACKGROUND = "rgba(255, 0, 0, 0.25)"

const TEXT_SIZE = 20;

const ZOOM_AMOUNT = 2;

const MERGE_KEYS = ['e', 'm'];
const DELETE_KEYS = ['d'];
const REMOVE_KEYS = ['r'];

const ZOOM_PAN_KEYS = ['Control'];
const MULTIPLE_MARQUEE_KEYS = ["Shift"]

// Data
/** @type SpritesheetData[] */
const spritesheets = []
let spritesheetIndex = 0

/** @type SpriteData[] */
const sprites = []
let spriteIndex = 0;

// States
let mouseDown = false;

let dimensions = {width: 0, height: 0} // Dimensions of current sprite for the sprite player canvas

let showBlobs = true;
let showNumbers = false;

/** @type HTMLCanvasElement */
let focusedCanvas = CANVASES.CROP;
let onCanvas = false;

/** @type {{string: boolean}} */
let keys = {}

// =============================== GENERAL EVENTS ======================================
onkeydown = (e) => {
    keys = {}
    keys[e.key] = true;

    if (MERGE_KEYS.includes(e.key)) {
        mergeBlobButton.click();
    }
    if (DELETE_KEYS.includes(e.key)) {
        deleteBlobButton.click();
    }
    if (REMOVE_KEYS.includes(e.key)) {
        removePointsButton.click();
    }
}

onkeyup = (e) => {
    keys[e.key] = false;
}

onmouseup = (e) => {
    mouseDown = false
    selectMarquee = new Marquee(0, 0)
    drawCropCanvas();
    drawSpriteCanvas();
    focusedCanvas.onmouseup(e)
}

onmousemove = (e) => {
    focusedCanvas.onmousemove(e)
}

addEventListener("mousewheel", (e) => {
    if (onCanvas) {
        if (keys[ZOOM_PAN_KEYS]) {
            if (e.deltaY < 0) {
                e.preventDefault();
                focusedCanvas.scale *= ZOOM_AMOUNT;
                focusedCanvas.draw();
            } else if (e.deltaY > 0) {
                e.preventDefault();
                focusedCanvas.scale /= ZOOM_AMOUNT;
                focusedCanvas.draw();
            }
        }
    }
}, {passive: false})

/**
 * @param {MouseEvent} e
 * @param {HTMLCanvasElement} canvas
 * @return {Point}
 */
function getCanvasPos(e, canvas) {
    const bounds = canvas.getBoundingClientRect();

    let x = e.clientX - bounds.left;
    let y = e.clientY - bounds.top;

    if (e.pageX < bounds.left + window.scrollX) {
        x = 0;
    }
    if (e.pageX > bounds.right + window.scrollX) {
        x = bounds.width;
    }

    if (e.pageY < bounds.top + window.scrollY) {
        y = 0;
    }
    if (e.pageY > bounds.bottom + window.scrollY) {
        y = bounds.height;
    }

    return {x: x / focusedCanvas.scale, y: y / focusedCanvas.scale}
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param width
 * @param height
 */
function scaleCanvas(canvas, width, height) {
    const ctx = canvas.getContext('2d')

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";


    canvas.width = width;
    canvas.height = height;

    canvas.style.width = width * canvas.scale + "px";
    canvas.style.height = height * canvas.scale + "px";
}

// ================================ SPRITESHEET CROPPING ================================

function drawCropCanvas() {
    if (spritesheets.length === 0) return;

    const spritesheetData = spritesheets[spritesheetIndex]

    const ctx = CANVASES.CROP.getContext('2d')

    scaleCanvas(CANVASES.CROP, spritesheetData.image.width, spritesheetData.image.height);

    ctx.clearRect(0, 0, CANVASES.CROP.width, CANVASES.CROP.height)

    ctx.drawImage(spritesheetData.image, 0, 0)

    spritesheetData.marquees.forEach(m => {
        ctx.beginPath()
        ctx.lineWidth = 1;
        ctx.rect(0.5 + m.x, 0.5 + m.y, m.width, m.height)
        ctx.stroke()
    })
}

CANVASES.CROP.draw = drawCropCanvas;

// Crop canvas setup
CANVASES.CROP.parentElement.onmouseenter = () => {
    focusedCanvas = CANVASES.CROP;
    onCanvas = true;
}

CANVASES.CROP.onmouseleave = () => onCanvas = false;

CANVASES.CROP.onmousedown = (e) => {
    focusedCanvas = CANVASES.CROP;

    if (!getSpritesheet()) return;

    if (e.buttons === 1) {
        if (!keys[MULTIPLE_MARQUEE_KEYS]) {
            getSpritesheet().marquees = []
        }

        mouseDown = true;
        const mousePos = getCanvasPos(e, CANVASES.CROP)
        getSpritesheet().marquees.push(new Marquee(mousePos.x, mousePos.y))
    }
}

CANVASES.CROP.onmousemove = (e) => {
    if (!getSpritesheet()) return;
    if (mouseDown) {
        const mousePos = getCanvasPos(e, CANVASES.CROP)
        getSpritesheet().marquees[getSpritesheet().marquees.length - 1].drag(mousePos.x, mousePos.y)
    }
    drawCropCanvas()
}

CANVASES.CROP.onmouseup = () => {
    if (!getSpritesheet()) return;
    mouseDown = false;
}

/**
 * @returns {SpritesheetData}
 */
function getSpritesheet() {
    return spritesheets[spritesheetIndex];
}

const addSpritesheetFromFile = (image, file, index) => {
    spritesheets.push(new SpritesheetData(image, file.name))

    spritesheetIndex = index;

    drawCropCanvas()
}

/** @param i
 *  @return {number} */
const selectSpritesheet = (i) => {
    spritesheetIndex = i === -1 ? spritesheetIndex : i;
    drawCropCanvas();
    return spritesheetIndex;
}

initUploadFileForm(spritesheetForm, selectSpritesheet, addSpritesheetFromFile)

// On crop
document.getElementById("cropButton").onclick = () => {
    const spritesheet = getSpritesheet();

    spritesheet.marquees.forEach(marquee => {
        const image = new Image
        image.src = cropImage(spritesheet.image, marquee);
        // Name image with index
        const name = spritesheet.name + " #" + spritesheet.spriteCount++;

        fetch(image.src).then(response => response.blob()).then(file => addSpriteFromCrop(image, file, name))
    })

    if (spritesheet.marquees.length > 0) document.getElementById("spriteSection").scrollIntoView();

    // Remove all crop marquee
    spritesheet.marquees.splice(0, spritesheet.marquees.length)

    // Update the marquee removal
    drawCropCanvas();
}

// ================================================= BLOB DETECTION ====================================================

let selectMarquee = new Marquee(0, 0);

let selectedBlobs = []
let selectedPoints = []


// BLOB CANVAS ACTIONS
CANVASES.SPRITE.parentElement.onmouseenter = () => {
    if (!getCurrentSprite()) return;


    focusedCanvas = CANVASES.SPRITE;
    onCanvas = true;

    if (!mouseDown) {
        selectMarquee = null
    }
}

CANVASES.SPRITE.onmouseleave = () => onCanvas = false;

CANVASES.SPRITE.onmousedown = (e) => {
    focusedCanvas = CANVASES.SPRITE;

    if (!getCurrentSprite()) return;

    const mousePos = getCanvasPos(e, CANVASES.SPRITE);

    if (e.buttons === 1) {
        mouseDown = true;
        selectedBlobs = []
        selectedPoints = []
        selectMarquee = new Marquee(mousePos.x, mousePos.y)

        getCurrentSprite().blobs.forEach(b => {
            if (rectContainsPoint(b, {x: mousePos.x, y: mousePos.y})) selectedBlobs.push(b);
        })
    }
}

CANVASES.SPRITE.onmousemove = (e) => {
    if (!getCurrentSprite()) return;
    if (mouseDown) {
        let mousePos = getCanvasPos(e, CANVASES.SPRITE);

        selectMarquee.drag(mousePos.x, mousePos.y)

        selectedBlobs = []
        selectedPoints = []

        getCurrentSprite().blobs.forEach(b => {
            // Mouse in blob OR BlobRect in marquee
            if (rectContainsPoint(b, {x: mousePos.x, y: mousePos.y}) || rectIntersects(selectMarquee, b)) {
                selectedBlobs.push(b);

                // For points in marquee
                b.points.forEach(p => {
                    if (rectContainsPoint(selectMarquee, p))
                        selectedPoints.push(p)
                })
            }
        })

        drawSpriteCanvas()
    }
}

CANVASES.SPRITE.onmouseup = () => {
    if (!getCurrentSprite()) return;
    mouseDown = false;
    selectMarquee = new Marquee(0, 0)

    //mergeBlobsInlist(getCurrentSprite().blobs, selectedBlobs)

    drawSpriteCanvas()
}

// BLOB DETECTION BUTTONS
function changeDistanceThreshold(deltaThreshold) {
    // Prevent decreasing threshold below 2 px
    if (getCurrentSprite().threshold <= 2 && deltaThreshold < 0) return;
    // Prevent increasing threshold when there are 2 or less blobs
    if (getCurrentSprite().blobs.length <= 2 && deltaThreshold > 0) return;

    const sprite = getCurrentSprite()

    sprite.threshold += deltaThreshold;
    sprite.loading = true;
    drawSpriteCanvas();

    sendBlobDetectionRequest(sprite.file, sprite.threshold, sprite.blobs.length, 1)
        .then(data => {
            sprite.updateBlobs(convertToBlobArray(data.blobs))
            sprite.threshold = data.threshold;
            sprite.loading = false;
            drawSpriteCanvas();
        })
        .catch(err => {
            sprite.loading = false;
            drawSpriteCanvas();

            const bsToast = new bootstrap.Toast(alertToast, {animation: true, delay: 1000});

            alertToast.querySelector(".toast-header").innerHTML = "Error: " + sprite.getName();
            alertToast.querySelector(".toast-body").innerHTML = err;

            bsToast.show();
            setTimeout(() => bsToast.hide(), 1000);
        })
}


thresholdUp.onclick = () => changeDistanceThreshold(1);

thresholdDown.onclick = () => changeDistanceThreshold(-1);


// BLOB CANVAS BUTTONS
mergeBlobButton.onclick = () => {
    mergeBlobsInlist(getCurrentSprite().blobs, selectedBlobs);
    selectedBlobs = [];
    selectedPoints = [];
    drawSpriteCanvas();
}

deleteBlobButton.onclick = () => {
    getCurrentSprite().blobs = getCurrentSprite().blobs.filter(b => !selectedBlobs.includes(b))
    selectedBlobs = [];
    selectedPoints = [];
    drawSpriteCanvas();
}

removePointsButton.onclick = () => {
    selectedBlobs.forEach(b => {
        const pointCount = removePoints(b, selectedPoints);
        if (pointCount === 0) getCurrentSprite().blobs.splice(getCurrentSprite().blobs.indexOf(b), 1)
    })
    selectedBlobs = [];
    selectedPoints = [];
    drawSpriteCanvas();
}

showNumberCheckbox.onchange = () => {
    showNumbers = showNumberCheckbox.checked;
    drawSpriteCanvas();
}

// FUNCTIONS

/**
 * @returns {SpriteData}
 */
function getCurrentSprite() {
    return sprites[spriteIndex];
}

/**
 * Draws the sprite canvas based on current state
 */


function drawSpriteCanvas() {
    const ctx = CANVASES.SPRITE.getContext("2d");

    if (sprites.length === 0) {
        CANVASES.SPRITE.width = DEFAULT_WIDTH;
        CANVASES.SPRITE.height = DEFAULT_HEIGHT;
        ctx.clearRect(0, 0, CANVASES.SPRITE.width, CANVASES.SPRITE.height);
        return;
    }

    scaleCanvas(CANVASES.SPRITE, getCurrentSprite().image.width, getCurrentSprite().image.height)

    ctx.save();

    if (sprites.length === 0) {
        ctx.clearRect(0, 0, CANVASES.SPRITE.width, CANVASES.SPRITE.height);
        console.log("EMPTY")
        return;
    }

    ctx.drawImage(getCurrentSprite().image, 0, 0)

    // Loading
    if (getCurrentSprite().loading) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(0, 0, CANVASES.SPRITE.width, CANVASES.SPRITE.height)

        ctx.textAlign = "center";
        ctx.font = "30px Arial"
        ctx.fillStyle = "white"
        ctx.fillText("Detecting Blobs", DEFAULT_WIDTH / 2, CANVASES.SPRITE.parentElement.offsetHeight / 2)
    }

    // Blobs
    if (showBlobs)
        getCurrentSprite().blobs.forEach(b => {
            ctx.beginPath();
            ctx.strokeStyle = b.edited ? EDITED_BLOB_COLOR : BLOB_COLOR;
            ctx.rect(b.x - 0.5, b.y - 0.5, b.width + 2, b.height + 2);
            ctx.closePath();
            ctx.stroke();

            if (showNumbers) {
                ctx.font = `${TEXT_SIZE}px Arial`;
                const text = "" + (getCurrentSprite().blobs.indexOf(b) + 1);
                const size = ctx.measureText(text);
                ctx.fillStyle = TEXT_BACKGROUND
                //ctx.fillRect(b.x + (b.width - size.width) / 2 + 1, b.y + (b.height - TEXT_SIZE) / 2 + 1, size.width + 1, TEXT_SIZE + 1)
                ctx.fillStyle = TEXT_COLOR

                ctx.fillText(text, b.x + (b.width - size.width) / 2, b.y + (b.height + TEXT_SIZE) / 2)
            }
        })

    // Selected blobs

    selectedBlobs.forEach(b => {
        ctx.fillStyle = b.edited ? SELECTED_EDITED_BLOB_COLOR : SELECTED_BLOB_COLOR;
        ctx.fillRect(b.x, b.y, b.width + 1, b.height + 1)
    })

    ctx.fillStyle = POINT_COLOR;
    selectedPoints.forEach(p => {
        ctx.fillRect(p.x, p.y, 1, 1)
    })


    // Draw marquee
    if (selectMarquee) {
        const m = new Path2D();
        const x = selectMarquee.x;
        const y = selectMarquee.y;
        const w = selectMarquee.width;
        const h = selectMarquee.height;

        m.rect(x, y, w, h)
        m.rect(x + 1, y + 1, w - 2, h - 2)
        ctx.clip(m, "evenodd");
        ctx.globalCompositeOperation = "exclusion"
        ctx.fillStyle = "white"
        ctx.fillRect(x, y, w, h)
    }
}

CANVASES.SPRITE.draw = drawSpriteCanvas;

function onFileBlobDetectionError(err, sprite, index) {
    sprites.splice(index, 1);
    spriteForm.querySelector("select").remove(index);

    console.log(sprites.length)
    drawSpriteCanvas();

    const bsToast = new bootstrap.Toast(alertToast, {animation: true, delay: 5000});

    alertToast.querySelector(".toast-header").innerHTML = sprite.getName();
    alertToast.querySelector(".toast-body").innerHTML = err;

    bsToast.show();
}

/**
 * @param image
 * @param file
 * @param {string} name
 */
function addSpriteFromCrop(image, file, name) {
    const sprite = new SpriteData(image, file, name);
    sprites.push(sprite);

    const option = document.createElement("option")
    option.text = name;

    const selectElement = spriteForm.querySelector("select")
    // Insert before last element
    selectElement.insertBefore(option, selectElement[selectElement.length - 1]);

    const index = selectSprite(selectElement.length - 2);

    selectElement.selectedIndex = index

    drawSpriteCanvas()

    sendBlobDetectionRequest(file)
        .then(data => {
            sprite.resetBlobs(data.blobs.map(rect => convertToBlob(rect)))
            sprite.loading = false;

            drawSpriteCanvas()
        })
        .catch(err => onFileBlobDetectionError(err, sprite, index));
}


function addSpriteFromFile(image, file, index) {
    const sprite = new SpriteData(image, file, file.name);
    sprites.push(sprite);

    spriteIndex = index;

    drawSpriteCanvas()

    sendBlobDetectionRequest(file)
        .then(data => {
            sprite.resetBlobs(data.blobs.map(rect => convertToBlob(rect)))
            sprite.loading = false;

            drawSpriteCanvas()
        })
        .catch(err => onFileBlobDetectionError(err, sprite, index));
}

/** @param i
 *  @return {number} */
const selectSprite = (i) => {
    spriteIndex = i === -1 ? spriteIndex : i;

    selectMarquee = new Marquee(0, 0);
    selectedBlobs = [];
    selectedPoints = [];

    dimensions = getMaxDimensions(getCurrentSprite().blobs)

    CANVASES.SPRITE.width = dimensions.width;
    CANVASES.SPRITE.height = dimensions.height;

    drawSpriteCanvas();

    return spriteIndex;
}

initUploadFileForm(spriteForm, selectSprite, addSpriteFromFile)


document.getElementById("resetBlobs").onclick = () => {
    getCurrentSprite().reset();

    selectedBlobs = []
    selectedPoints = []
    drawSpriteCanvas();
}


// ========================================== SPRITE PLAYER ==============================================
let _frame = 0;
let isPlaying = true;
let loop = true;

function animateSprite() {
    if (isPlaying) {
        drawPlayerCanvas()
    }
}

function drawPlayerCanvas() {
    const sprite = getCurrentSprite();
    if (!(sprite && sprite.blobs.length > 0)) return;

    if (_frame >= sprite.blobs.length) {
        if (loop) {
            _frame = 0;
        }else {
            _frame = sprite.blobs.length-1;
            isPlaying = false;
            pause();
            return;
        }
    }

    const image = sprite.image;
    const blob = sprite.blobs[_frame];

    if (!blob) return; // in case of overwrites during blob merging

    const ctx = CANVASES.PLAYER.getContext("2d")

    ctx.scale(CANVASES.PLAYER.scale, CANVASES.PLAYER.scale);

    ctx.clearRect(0, 0, CANVASES.PLAYER.width, CANVASES.PLAYER.height)
    ctx.drawImage(image, blob.x, blob.y, blob.width, blob.height, 0, 0, blob.width, blob.height)

    document.getElementById("frame").innerText = _frame;

    _frame++;
}

CANVASES.PLAYER.draw = drawPlayerCanvas;

setInterval(animateSprite, (1 / fps) * 1000)

playButton.onclick = () => {
    if (!loop) {
        _frame = 0;
    }
    isPlaying = !isPlaying
    if (isPlaying) {
        play();
    } else {
        pause();
    }
}

function play() {
    playIcon.classList.remove("fa-play")
    playIcon.classList.add("fa-pause")
}

function pause() {
    playIcon.classList.remove("fa-pause")
    playIcon.classList.add("fa-play")
}

nextButton.onclick = () => {
    if (!getCurrentSprite()) return;

    drawPlayerCanvas()
}

previousButton.onclick = () => {
    if (!getCurrentSprite()) return;

    _frame -= 2;
    if (_frame <= 0) {
        _frame = getCurrentSprite().blobs.length + _frame;
    }
    drawPlayerCanvas()
}

loopButton.onchange = () => loop = loopButton.checked;


// ================================== DOWNLOAD =====================================
downloadButton.onclick = () => {
    const zip = JSZip();


    const fetches = []

    for (let i = 0; i < getCurrentSprite().blobs.length; i++) {
        const url = cropSprite(getCurrentSprite().image, getCurrentSprite().blobs[i], getMaxDimensions(getCurrentSprite().blobs))
        fetches.push(fetch(url));
    }

    // Convert url to data
    Promise.all(fetches).then(responses =>
        // Convert data to blob
        /**
         * @param responses
         * @return {Promise<Blob[]>}
         */
        Promise.all(responses.map(res => res.blob())).then(blobs => {
            blobs.forEach((blob, i) => {
                const blobPart = [];
                blobPart.push(blob);
                zip.file(getCurrentSprite().getName() + "_" + i.toString().padStart(2, '0') + ".png", new File(blobPart, "f.png"));
            });

            zip.generateAsync({type: "base64"}).then(function (base64) {
                const link = document.createElement('a');
                link.href = "data:application/zip;base64," + base64;
                link.download = getCurrentSprite().getName() + ".zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
        })
    )
}