import {rectContainsRect, rectIntersects} from "./utils.js";

export class Marquee {
    #anchorX
    #anchorY
    #subX
    #subY

    constructor(anchorX, anchorY) {
        this.#anchorX = Math.floor(anchorX);
        this.#anchorY = Math.floor(anchorY)
    }

    drag(x, y) {
        this.#subX = Math.floor(x);
        this.#subY = Math.floor(y);
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
 * @param {File} file
 * @param {BlobRect[]} blobs
 * @constructor
 */
export function SpriteData(image, file, blobs= []) {
    blobs = blobs.filter(b => b.points.length !== 0)

    this.image = image;
    this.file = file;

    this.blobs = blobs;
    let originalBlobs = JSON.parse(JSON.stringify(blobs))

    this.threshold = 2;

    this.reset = () => {
        this.blobs = JSON.parse(JSON.stringify(originalBlobs))
    }

    /** @param {BlobRect[]} newBlobs */
    this.updateBlobs = (newBlobs) => {

        const editedBlobs = this.blobs.filter(blob => blob.edited)


        this.blobs = [];

        for (let i = 0; i < newBlobs.length; i++) {
            let intersectsEditedBlob = false;

            for (let j = 0; j < editedBlobs.length; j++) {
                const editedBlob = editedBlobs[j];

                if (rectIntersects(newBlobs[i], editedBlob)) {
                    intersectsEditedBlob = true;

                    if (this.blobs.indexOf(editedBlob) === -1) {
                        this.blobs.push(editedBlob);
                    }
                    break;
                }
            }

            if (!intersectsEditedBlob) {
                this.blobs.push(newBlobs[i])
            }
        }

        originalBlobs = JSON.parse(JSON.stringify(newBlobs));
    }
}

/**
 * @typedef DetectedBlob
 * @property x
 * @property y
 * @property width
 * @property height
 * @property points
 * @property row
 * @property col
 */

/**
 * @param {DetectedBlob} blob
 * @return {BlobRect}
 */
export function convertToBlob(blob) {
    return new BlobRect(blob.x, blob.y, blob.width, blob.height, blob.points, blob.row, blob.col)
}

/**
 * @param {DetectedBlob[]} blobs
 * @return {BlobRect[]}
 */
export function convertToBlobArray(blobs) {
    return blobs.map(blob => convertToBlob(blob));
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
    const inputElement = formElement.querySelector("input");
    const selectElement = formElement.querySelector("select");

    formElement.onclick = (e) => {
        if (selectElement.length === 1) {
            e.stopPropagation();

            inputElement.click();
        }
    }

    formElement.ondblclick = () => inputElement.click();

    selectElement.onchange = () => {
        // If the last element (upload file) element is select, don't trigger image switch
        if (selectElement.selectedIndex === selectElement.length-1) {
            inputElement.click();
            return;
        }
        onSelect(selectElement.selectedIndex)
    }

    inputElement.onchange = () => {
        console.log("Image added from file")

        let imageUrl = URL.createObjectURL(inputElement.files[0])

        const image = new Image
        image.src = imageUrl

        image.onload = () => {
            let option = document.createElement("option")

            option.text = inputElement.files[0].name;


            // Insert before last element (preserved for upload option)
            selectElement.insertBefore(option, selectElement[selectElement.length-1]);

            selectElement.selectedIndex = selectElement.length-2;

            onImageAdded(image, inputElement.files[0], selectElement.selectedIndex);
        }
    }
}