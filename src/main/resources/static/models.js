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
 * @param {Blob[]} blobs
 * @constructor
 */
export function SpriteData(image, blobs= []) {
    this.image = image;
    this.blobs = blobs;
}

/**
 * @param blob
 * @constructor
 */
export function Blob(blob) {
    this.x = blob.x;
    this.y = blob.y;
    this.width = blob.width;
    this.height = blob.height;

    this.row = blob.row
    this.col = blob.col;

    this.xPadding = 0;
    this.yPadding = 0;

    this.selected = false;
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

        let option = document.createElement("option")

        option.text = inputElement.files[0].name

        selectElement.add(option)

        image.onload = () => {
            selectElement.selectedIndex = selectElement.length-1

            onImageAdded(image, inputElement.files[0], selectElement.length-1)
        }
    }
}