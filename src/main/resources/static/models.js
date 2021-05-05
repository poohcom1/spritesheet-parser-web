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
 *
 * @param {HTMLImageElement} image
 * @param {Marquee[]} marquees
 * @returns {{image, marquees}}
 * @constructor
 */
export function SpritesheetData(image, marquees = [])  {
    return {image: image, marquees: marquees}
}

export function SpriteData(image, blobs=[]) {
    return {image: image, blobs: blobs}
}

/**
 * @callback imageAddedCallback
 * @param {HTMLImageElement} image
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
        let imageUrl = URL.createObjectURL(inputElement.files[0])

        const image = new Image
        image.src = imageUrl

        let option = document.createElement("option")

        option.text = inputElement.files[0].name

        selectElement.add(option)

        image.onload = () => {
            selectElement.selectedIndex = selectElement.length-1

            onImageAdded(image, selectElement.length-1)
        }
    }
}