import {Marquee, SpriteData, SpritesheetData, initUploadFileForm} from "./models.js";
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

function getSpritesheet() {
    return spritesheets[spritesheetIndex];
}

const setSpritesheetForm = (image, index) => {
    spritesheets.push(SpritesheetData(image))

    spritesheetIndex = index;

    cropCanvas.onmouseenter = (e) => {
        console.log(e.button)
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

    drawCropCanvas()
}

initUploadFileForm(spritesheetForm, i => {
    spritesheetIndex = i;
    drawCropCanvas();
}, setSpritesheetForm)

document.getElementById("cropButton").onclick = () => {
    const image = getSpritesheet().image;

    getSpritesheet().marquees.forEach(m => {
        fetch(getSpritesheet().image.src).then(response => response.blob()).then(file => {
            sendCropRequest(file, m.x, m.y, m.width, m.height)
                .then(response => response.blob())
                .then(blob => {
                    const image = new Image
                    image.src = URL.createObjectURL(blob)

                    addSprite(image)
                })
        })
    })
}

// BLOB DETECTION
function addSprite(image) {
    sendBlobDetectionRequest(image)
        .then(response => response.json())
        .then(data => {
            sprites.push(new SpriteData(image, data))
        })
}

function drawBlobCanvas() {
    const sprite = sprites[spriteIndex]

    const ctx = spriteCanvas.getContext('2d')
    cropCanvas.width = sprite.image.width;
    cropCanvas.height = sprite.image.height;

    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height)

    ctx.drawImage(sprite.image, 0, 0)


    sprite.blobs.forEach(b => {
        ctx.beginPath()
        ctx.rect(b.x, b.y, b.width, b.height)
        ctx.stroke()
    })
}

function setSpriteForm() {

}

// initUploadFileForm(spriteForm, image => {
//
// })

function setCanvasImage(ctx, image, rect = []) {
    image.onload = () => {
        ctx.drawImage(image, 0, 0)
    }
}