import {Marquee, SpriteData, SpritesheetData, Blob, initUploadFileForm} from "./models.js";
import {sendCropRequest, sendBlobDetectionRequest} from "./requests.js"

// DOMs
const spritesheetForm = document.getElementById("spritesheetForm")
const spriteForm = document.getElementById("spriteForm")

const cropCanvas = document.getElementById("cropCanvas")
const spriteCanvas = document.getElementById("spriteCanvas")

// Data
const spritesheets = []
let spritesheetIndex = 0

const sprites = []
let spriteIndex = 0;

// States
let mouseDown = false;

// SPRITESHEET CROPPING

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

cropCanvas.onmousedown = (e) => {
    mouseDown = true;
    getSpritesheet().marquees.push(new Marquee(e.offsetX, e.offsetY))
}

cropCanvas.onmousemove = (e) => {
    if (mouseDown) {
        getSpritesheet().marquees[getSpritesheet().marquees.length-1].drag(e.offsetX, e.offsetY)
    }
    drawCropCanvas()
}

cropCanvas.onmouseup = (e) => {
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

document.getElementById("cropButton").onclick = () => {
    const spritesheet = getSpritesheet();
    const image = spritesheet.image;

    spritesheet.marquees.forEach(m => {
        fetch(spritesheet.image.src).then(response => response.blob()).then(file => {
            sendCropRequest(file, m.x, m.y, m.width, m.height)
                .then(response => response.blob())
                .then(file => {
                    const image = new Image
                    image.src = URL.createObjectURL(file)

                    const name = spritesheet.name + " #" + spritesheet.spriteCount++;

                    addSprite(image, file, name);
                })
        })
    })
}

// BLOB DETECTION

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
    getCurrentSprite().blobs.forEach(b => {
        ctx.beginPath();
        ctx.strokeStyle = "red"
        ctx.rect(b.x, b.y, b.width, b.height);
        ctx.stroke();
    })
}

spriteCanvas.onmouseenter = (e) => {

}

spriteCanvas.onmousedown = (e) => {

}

spriteCanvas.onmousemove = (e) => {

}

spriteCanvas.onmouseup = (e) => {
    mouseDown = false;
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
            sprites.push(new SpriteData(image, data.map(rect => new Blob(rect))))

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
            sprites.push(new SpriteData(image, data.map(rect => new Blob(rect))))

            spriteIndex = index;

            const option = document.createElement("option")

            option.text = file.name

            spriteForm.querySelector("select").add(option)

            drawSpriteCanvas()
        });
}

initUploadFileForm(spriteForm, i => {
    spriteIndex = i;
    drawSpriteCanvas();
}, addSpriteFromFile)

function setCanvasImage(ctx, image, rect = []) {
    image.onload = () => {
        ctx.drawImage(image, 0, 0)
    }
}