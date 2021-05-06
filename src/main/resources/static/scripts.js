import {BlobRect, convertToBlob, initUploadFileForm, Marquee, SpriteData, SpritesheetData} from "./models.js";
import {sendBlobDetectionRequest, sendCropRequest} from "./requests.js"
import {getMaxDimensions, mergeBlobsInlist, rectContainsPoint, rectIntersects} from "./utils.js";

// DOMs
const spritesheetForm = document.getElementById("spritesheetForm")
const spriteForm = document.getElementById("spriteForm")

const cropCanvas = document.getElementById("cropCanvas")
const spriteCanvas = document.getElementById("spriteCanvas")
const playerCanvas = document.getElementById("playerCanvas")

const mergeBlobButton = document.getElementById("mergeButton")
const deleteBlobButton = document.getElementById("deleteBlobButton")
const removePointsButton = document.getElementById("removePointsButton")

// Parameters
let fps = 12;

// Data
const spritesheets = []
let spritesheetIndex = 0

const sprites = []
let spriteIndex = 0;

// States
let mouseDown = false;

let dimensions = {width: 0, height: 0} // Dimensions of current sprite for the sprite player canvas

// =============================== GENERAL EVENTS ======================================

onmouseup = () => {
    mouseDown = false
    selectMarquee = new Marquee(0, 0)
    drawCropCanvas();
    drawSpriteCanvas();
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

cropCanvas.onmousedown = (e) => {
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

    spritesheet.marquees.forEach(m => {
        // Convert url to file
        fetch(spritesheet.image.src).then(response => response.blob()).then(file => {
            // POST Request to crop all images in marquees
            sendCropRequest(file, m.x, m.y, m.width, m.height)
                .then(response => response.blob())
                .then(file => {
                    const image = new Image
                    image.src = URL.createObjectURL(file)

                    // Name image with index
                    const name = spritesheet.name + " #" + spritesheet.spriteCount++;

                    // Add to sprites
                    addSprite(image, file, name);
                })
        })
    })

    spritesheet.marquees.splice(0, spritesheet.marquees.length)
    // Update the marquee removal
    drawCropCanvas();
}

// ================================ BLOB DETECTION ================================

let selectMarquee = new Marquee(0, 0);

let selectedBlobs = []
let selectedPoints = []


// BLOB CANVAS ACTIONS
spriteCanvas.onmouseenter = (e) => {
    if (!getCurrentSprite()) return;
    if (e.buttons !== 1) {
        selectMarquee = null
        mouseDown = false
    }
    if (e.buttons === 1) {
        mouseDown = true;
        selectMarquee = new Marquee(e.offsetX, e.offsetY)
    }
}

spriteCanvas.onmousedown = (e) => {
    if (!getCurrentSprite()) return;
    mouseDown = true;
    selectedBlobs = []
    selectedPoints = []
    selectMarquee = new Marquee(e.offsetX, e.offsetY)

    getCurrentSprite().blobs.forEach(b => {
        if (rectContainsPoint(b, {x: e.offsetX, y: e.offsetY})) selectedBlobs.push(b);
    })
}

spriteCanvas.onmousemove = (e) => {
    if (!getCurrentSprite()) return;
    if (mouseDown) {
        selectMarquee.drag(e.offsetX, e.offsetY)

        selectedBlobs = []
        selectedPoints = []

        getCurrentSprite().blobs.forEach(b => {
            // Mouse in blob OR BlobRect in marquee
            if (rectContainsPoint(b, {x: e.offsetX, y: e.offsetY}) || rectIntersects(selectMarquee, b)) {
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

spriteCanvas.onmouseup = (e) => {
    if (!getCurrentSprite()) return;
    mouseDown = false;

    //mergeBlobsInlist(getCurrentSprite().blobs, selectedBlobs)

    drawSpriteCanvas()
}

// BLOB CANVAS BUTTONS
mergeBlobButton.onclick = () => {
    mergeBlobsInlist(getCurrentSprite().blobs, selectedBlobs);
    selectedBlobs = [];
    selectedPoints = []
    drawSpriteCanvas();
}

// FUNCTIONS

/**
 * @returns {SpriteData}
 */
function getCurrentSprite() {
    return sprites[spriteIndex];
}

function drawSpriteCanvas() {
    if (sprites.length === 0) return;

    const ctx = spriteCanvas.getContext("2d");

    spriteCanvas.width = getCurrentSprite().image.width;
    spriteCanvas.height = getCurrentSprite().image.height;

    ctx.drawImage(getCurrentSprite().image, 0, 0)

    // Blobs
    ctx.beginPath();
    getCurrentSprite().blobs.forEach(b => {

        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"
        ctx.rect(b.x-0.5, b.y-0.5, b.width+2, b.height+2);
    })
    ctx.stroke();

    // Selected blobs
    selectedBlobs.forEach(b => {
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
        ctx.fillRect(b.x, b.y, b.width+1, b.height+1)


    })

    selectedPoints.forEach(p => {
        ctx.fillStyle = ctx.fillStyle = "rgb(0, 0, 255, 0.5)";
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
    spriteCanvas.width = dimensions.width;
    spriteCanvas.height = dimensions.height;
    drawSpriteCanvas();
}, addSpriteFromFile)

document.getElementById("resetBlobs").onclick = () => {
    getCurrentSprite().reset();
    drawSpriteCanvas();
}

// ========================================== SPRITE PLAYER ==============================================
let _frame = 0;
let isPlaying = true;

function animateSprite() {
    if (isPlaying) {
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
}

setInterval(animateSprite, (1/fps) * 1000)