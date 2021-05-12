export class Marquee {
    #anchorX
    #anchorY
    #subX
    #subY

    constructor(anchorX, anchorY) {
        this.#anchorX = anchorX;
        this.#anchorY = anchorY
    }

    drag(x, y) {
        this.#subX = x;
        this.#subY = y;
    }

    get x() {
        return Math.min(this.#anchorX, this.#subX)
    }

    get y() {
        return Math.min(this.#anchorY, this.#subY)
    }

    get width() {
        return Math.abs(this.#anchorX - this.#subX)
    }

    get height() {
        return Math.abs(this.#anchorY - this.#subY)
    }
}


/**
 * @param {HTMLImageElement} image
 * @param {string} name
 * @param {Marquee[]} marquees
 * @constructor
 */
export function SpritesheetData(image, name, marquees = [])  {
    this.image = image;
    this.name = name;
    this.marquees = marquees;
    this.spriteCount = 0;
}

/**
 * @param {HTMLImageElement} image
 * @param {BlobRect[]} blobs
 * @constructor
 */
export function SpriteData(image, blobs= []) {
    blobs = blobs.filter(b => b.points.length !== 0)

    this.image = image;
    this.blobs = blobs;
    const originalBlobs = JSON.parse(JSON.stringify(blobs))

    this.reset = () => {
        this.blobs = JSON.parse(JSON.stringify(originalBlobs))
    }
}



/**
 * @param blob
 */
export function convertToBlob(blob) {
    return new BlobRect(blob.x, blob.y, blob.width, blob.height, blob.points, blob.row, blob.col)
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {Point[]} points
 * @param {number} row
 * @param {number} col
 * @param {boolean} edited
 * @constructor
 */
export function BlobRect(x, y, width, height, points, row, col, edited = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.row = row
    this.col = col;

    this.points = points

    this.edited = edited;

    // Sprite drawing
    this.xPadding = 0;
    this.yPadding = 0;
}

/**
 * @callback imageAddedCallback
 * @param {HTMLImageElement} image
 * @param {File} file
 * @param {number} index
 */
/**
 * @callback fileSelectCallback
 * @param {number} index
 */
/**
 * @param {HTMLFormElement} formElement
 * @param {fileSelectCallback} onSelect
 * @param {imageAddedCallback} onImageAdded
 */
export function initUploadFileForm(formElement, onSelect, onImageAdded) {
    const inputElement = formElement.querySelector("input")
    const selectElement = formElement.querySelector("select")

    selectElement.onchange = () => {
        onSelect(selectElement.selectedIndex)
    }

    inputElement.onchange = () => {
        console.log("Image added from file")

        let imageUrl = URL.createObjectURL(inputElement.files[0])

        const image = new Image
        image.src = imageUrl

        image.onload = () => {
            let option = document.createElement("option")

            option.text = inputElement.files[0].name

            selectElement.add(option)

            selectElement.selectedIndex = selectElement.length-1

            onImageAdded(image, inputElement.files[0], selectElement.length-1)
        }
    }
}