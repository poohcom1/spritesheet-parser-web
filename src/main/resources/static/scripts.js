import {BlobRect, convertToBlob, initUploadFileForm, Marquee, SpriteData, SpritesheetData} from "./models.js";
import {sendBlobDetectionRequest, sendCropRequest} from "./requests.js"
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

const cropCanvas = document.getElementById("cropCanvas")
const spriteCanvasImage = document.getElementById("spriteCanvas")
const playerCanvas = document.getElementById("playerCanvas")

const mergeBlobButton = document.getElementById("mergeButton")
const deleteBlobButton = document.getElementById("deleteBlobButton")
const removePointsButton = document.getElementById("removePointsButton")

const showNumberCheckbox = document.getElementById("showNumbers")

const playButton = document.getElementById("playButton")
const nextButton = document.getElementById("nextFrame")

const downloadButton = document.getElementById("downloadSpriteButton")

// Parameters
let fps = 12;

const BLOB_COLOR = "rgba(255, 0, 0, 0.5)"
const SELECTED_BLOB_COLOR = "rgba(255, 0, 0, 0.5)"

const POINT_COLOR = "rgba(0, 0, 255, 0.5)"

const EDITED_BLOB_COLOR = "rgba(0,255,0, 1.0)"
const SELECTED_EDITED_BLOB_COLOR = "rgba(0,255,0,0.5)"

const TEXT_COLOR = "rgba(0, 0, 0, 1.0)"
const TEXT_BACKGROUND = "rgba(255, 0, 0, 0.25)"

const TEXT_SIZE = 20;

const MERGE_KEYS = ['e', 'm'];
const DELETE_KEYS = ['d'];
const REMOVE_KEYS = ['r'];

// Data
const spritesheets = []
let spritesheetIndex = 0

const sprites = []
let spriteIndex = 0;

// States
let mouseDown = false;

let dimensions = {width: 0, height: 0} // Dimensions of current sprite for the sprite player canvas

let showBlobs = true;
let showNumbers = false;

let focusedElement = null;

/**
 * @type {{string: boolean}}
 */
let keys = {}

// =============================== GENERAL EVENTS ======================================
onmouseup = () => {
    mouseDown = false
    selectMarquee = new Marquee(0, 0)
    drawCropCanvas();
    drawSpriteCanvas();
}

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


onmouseup = (e) =>  {if (focusedElement)
    focusedElement.onmouseup(e)
}
onmousemove = (e) => {if (focusedElement)
    focusedElement.onmousemove(e)
}
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

    return {x: x, y: y}
}

// ================================ SPRITESHEET CROPPING ================================

function drawCropCanvas() {
    if (spritesheets.length === 0) return;

    const spritesheetData = spritesheets[spritesheetIndex]

    const ctx = cropCanvas.getContext('2d')
    cropCanvas.width = spritesheetData.image.width;
    cropCanvas.height = spritesheetData.image.height;

    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height)

    ctx.drawImage(spritesheetData.image, 0, 0)

    spritesheetData.marquees.forEach(m => {
        ctx.beginPath()
        ctx.rect(m.x, m.y, m.width, m.height)
        ctx.stroke()
    })
}

// Crop canvas setup
cropCanvas.onmouseenter = (e) => {
    if (mouseDown) {
        focusedElement = cropCanvas;
    }
}

cropCanvas.onmousedown = (e) => {
    focusedElement = cropCanvas;

    if (!getSpritesheet()) return;
    mouseDown = true;
    getSpritesheet().marquees.push(new Marquee(e.offsetX, e.offsetY))
}

cropCanvas.onmousemove = (e) => {
    if (!getSpritesheet()) return;
    if (mouseDown) {
        getSpritesheet().marquees[getSpritesheet().marquees.length-1].drag(e.offsetX, e.offsetY)
    }
    drawCropCanvas()
}

cropCanvas.onmouseup = (e) => {
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

initUploadFileForm(spritesheetForm, i => {
    spritesheetIndex = i;
    drawCropCanvas();
}, addSpritesheetFromFile)

// On crop
document.getElementById("cropButton").onclick = () => {
    const spritesheet = getSpritesheet();

    spritesheet.marquees.forEach(marquee => {
        const image = new Image
        image.src = cropImage(spritesheet.image, marquee);
        // Name image with index
        const name = spritesheet.name + " #" + spritesheet.spriteCount++;

        fetch(image.src).then(response => response.blob()).then(file => addSprite(image, file, name))

        // Add to sprites
        ;
    })

    // Remove all crop marquee
    spritesheet.marquees.splice(0, spritesheet.marquees.length)
    // Update the marquee removal
    drawCropCanvas();
}

// ================================ BLOB DETECTION ================================

let selectMarquee = new Marquee(0, 0);

let selectedBlobs = []
let selectedPoints = []


// BLOB CANVAS ACTIONS
spriteCanvasImage.onmouseenter = (e) => {
    if (!getCurrentSprite()) return;
    if (mouseDown) {
        focusedElement = spriteCanvasImage;
    } else {
        selectMarquee = null
    }
}

spriteCanvasImage.onmousedown = (e) => {
    focusedElement = spriteCanvasImage;

    if (!getCurrentSprite()) return;

    const mousePos = getCanvasPos(e, spriteCanvasImage);

    mouseDown = true;
    selectedBlobs = []
    selectedPoints = []
    selectMarquee = new Marquee(mousePos.x, mousePos.y)

    console.log("mouse down")

    getCurrentSprite().blobs.forEach(b => {
        if (rectContainsPoint(b, {x: mousePos.x, y: mousePos.y})) selectedBlobs.push(b);
    })
}

spriteCanvasImage.onmousemove = (e) => {
    if (!getCurrentSprite()) return;
    if (mouseDown) {
        let mousePos = getCanvasPos(e, spriteCanvasImage);

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

spriteCanvasImage.onmouseup = (e) => {
    if (!getCurrentSprite()) return;
    mouseDown = false;
    selectMarquee = new Marquee(0, 0)

    //mergeBlobsInlist(getCurrentSprite().blobs, selectedBlobs)

    drawSpriteCanvas()
}

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

const PADDING = 0;

function drawSpriteCanvas() {
    if (sprites.length === 0) return;

    const ctx = spriteCanvasImage.getContext("2d");

    ctx.save();

    spriteCanvasImage.width = getCurrentSprite().image.width;
    spriteCanvasImage.height = getCurrentSprite().image.height;

    ctx.drawImage(getCurrentSprite().image, PADDING, PADDING)

    // Blobs
    getCurrentSprite().blobs.forEach(b => {
        ctx.beginPath();
        ctx.strokeStyle = b.edited ? EDITED_BLOB_COLOR : BLOB_COLOR;
        ctx.rect(b.x-0.5, b.y-0.5, b.width+2, b.height+2);
        ctx.closePath();
        ctx.stroke();

        if (showNumbers) {
            ctx.font = `${TEXT_SIZE}px Arial`;
            const text = "" + (getCurrentSprite().blobs.indexOf(b) + 1);
            const size = ctx.measureText(text);
            ctx.fillStyle = TEXT_BACKGROUND
            ctx.fillRect(b.x + (b.width - size.width)/2 + 1,b.y + (b.height - TEXT_SIZE)/2 + 1, size.width+1, TEXT_SIZE+1)
            ctx.fillStyle = TEXT_COLOR
            ctx.fillText(text, b.x + (b.width - size.width)/2, b.y + (b.height + TEXT_SIZE)/2)
        }
    })


    // Selected blobs
    selectedBlobs.forEach(b => {
        ctx.fillStyle = b.edited ? SELECTED_EDITED_BLOB_COLOR : SELECTED_BLOB_COLOR;
        ctx.fillRect(b.x, b.y, b.width+1, b.height+1)
    })

    selectedPoints.forEach(p => {
        ctx.fillStyle = POINT_COLOR;
        ctx.fillRect(p.x, p.y, 1, 1)
    })

    // Draw marquee
    if (selectMarquee) {
        const m = new Path2D();
        m.rect(selectMarquee.x, selectMarquee.y, selectMarquee.width, selectMarquee.height)
        m.rect(selectMarquee.x+1, selectMarquee.y+1, selectMarquee.width-2, selectMarquee.height-2)
        ctx.clip(m, "evenodd");
        ctx.globalCompositeOperation = "exclusion"
        ctx.fillStyle = "white"
        ctx.fillRect(selectMarquee.x, selectMarquee.y, selectMarquee.width, selectMarquee.height)
    }
}

/**
 * @param image
 * @param file
 * @param {string} name
 */
function addSprite(image, file, name) {
    sendBlobDetectionRequest(file)
        .then(response => response.json())
        .then(data => {
            sprites.push(new SpriteData(image, data.map(rect => convertToBlob(rect))))

            const option = document.createElement("option")

            option.text = name

            spriteForm.querySelector("select").add(option)

            drawSpriteCanvas()
        });
}


function addSpriteFromFile(image, file, index) {
    sendBlobDetectionRequest(file)
        .then(response => response.json())
        .then(data => {
            sprites.push(new SpriteData(image, data.map(rect => convertToBlob(rect))))

            spriteIndex = index;

            drawSpriteCanvas()
        });
}

initUploadFileForm(spriteForm, i => {
    spriteIndex = i;
    dimensions = getMaxDimensions(getCurrentSprite().blobs)
    spriteCanvasImage.width = dimensions.width;
    spriteCanvasImage.height = dimensions.height;
    drawSpriteCanvas();
}, addSpriteFromFile)

document.getElementById("resetBlobs").onclick = () => {
    getCurrentSprite().reset();
    selectedBlobs = []
    selectedPoints = []
    drawSpriteCanvas();
}


// ========================================== SPRITE PLAYER ==============================================
let _frame = 0;
let isPlaying = true;

function animateSprite() {
    if (isPlaying) {
        drawPlayerCanvas()
    }
}

function drawPlayerCanvas() {
    const sprite = getCurrentSprite();
    if (!(sprite && sprite.blobs.length > 0)) return;

    if (_frame >= sprite.blobs.length) {
        _frame = 0;
    }
    const image = sprite.image;
    const blob = sprite.blobs[_frame];

    if (!blob) return; // in case of overwrites during blob merging

    const ctx = playerCanvas.getContext("2d")

    ctx.clearRect(0, 0, playerCanvas.width, playerCanvas.height)
    ctx.drawImage(image, blob.x, blob.y, blob.width, blob.height, 0, 0, blob.width, blob.height)

    document.getElementById("frame").innerText = _frame;

    _frame++;
}

setInterval(animateSprite, (1/fps) * 1000)

playButton.onclick = () => {
    isPlaying = !isPlaying
}

nextButton.onclick = () => {
    drawPlayerCanvas()
}

// ================================== DOWNLOAD =====================================
downloadButton.onclick = () => {
    const a = document.createElement("a");
    a.href = cropSprite(getCurrentSprite().image, getCurrentSprite().blobs[0], getMaxDimensions(getCurrentSprite().blobs));
    a.download = "test.png"
    a.click()
}