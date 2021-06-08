import { rectIntersects } from "./utils.js";
import { errorToast } from "./scripts.js";

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
export function SpritesheetData(image, name, marquees = []) {
    this.image = image;
    this.name = name;
    this.marquees = marquees;
    this.spriteCount = 0;
}

export class SpriteData {

    #originalBlobs = [];

    /**
     * @param {HTMLImageElement} image
     * @param {File} file
     * @param {string} name
     */
    constructor(image, file, name) {
        this.image = image;
        this.file = file;
        this.name = name;

        this.blobs = [];

        this.loading = true;
        this.threshold = 2;
    }


    reset = () => {
        this.blobs = JSON.parse(JSON.stringify(this.#originalBlobs))
    }

    /**
     * @return {string}
     */
    getName = () => {
        try {
            const index = this.name.lastIndexOf(".");
            return this.name.substring(0, index !== -1 ? index : this.name.length);
        } catch (e) {
            return "undefined"
        }
    }

    resetBlobs = (blobs) => {
        this.blobs = blobs;
        this.#originalBlobs = JSON.parse(JSON.stringify(blobs));
    }

    /** @param {BlobRect[]} newBlobs */
    updateBlobs = (newBlobs) => {

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

        this.#originalBlobs = JSON.parse(JSON.stringify(newBlobs));
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
 * @param {number} index Index to switch to. An index of -1 will result in no change
 * @return {number} The index that is switched to
 */
/**
 * @param {HTMLFormElement} formElement
 * @param {fileSelectCallback} onSelect
 * @param {imageAddedCallback} onImageAdded
 */
export function initUploadFileForm(formElement, onSelect, onImageAdded) {
    const inputElement = formElement.querySelector("input");
    const selectElement = formElement.querySelector("select");
    const dropElement = formElement.querySelector(".drop-image");
    const spinner = formElement.querySelector(".spinner-border");

    dropElement.ondragover = (e) => {
        e.preventDefault()
        dropElement.classList.add("drop-enter")
    };
    dropElement.ondragleave = () => dropElement.classList.remove("drop-enter");

    dropElement.ondrop = (e) => {
        e.preventDefault();
        dropElement.classList.remove("drop-enter");
        spinner.removeAttribute("hidden");

        const imageTypes = [ 'image/png', 'image/gif', 'image/bmp', 'image/jpg' ];
        if (e.dataTransfer && e.dataTransfer.files[0]) {

            const fileType = e.dataTransfer.files[0].type;
            if (imageTypes.includes(fileType)) {
                console.log(e.dataTransfer.files[0])

                handleFile(e.dataTransfer.files[0], e.dataTransfer.files[0].name)
            } else {
                spinner.setAttribute("hidden", "true")
                errorToast("Dropped file is not an image!")
            }
        } else {
            let data = e.dataTransfer.getData("text");

            fetch(data)
                .then(res => res.blob())
                .then(blob => {
                    handleFile(blob, data)

                })
                .catch(() => {
                    fetch("https://poohcom1-cors-anywhere.herokuapp.com/" + data)
                        .then(res => res.blob())
                        .then(blob => {
                            console.log(blob)
                            if (blob.type === "text/html" || blob.type === "") {
                                console.log("ERROR")
                                throw new Error;
                            }

                            blob.name = data;

                            handleFile(blob, data)
                        })
                        .catch((err) => {
                            console.log(err)
                            spinner.setAttribute("hidden", "true");

                            errorToast("Invalid format!")
                        })
                })
        }
    }

    formElement.onclick = (e) => {
        if (selectElement.length === 1) {
            e.stopPropagation();

            inputElement.click();
        }
    }

    formElement.ondblclick = () => inputElement.click();


    selectElement.onchange = () => {
        // If the last element (upload file) element is select, don't trigger image switch
        if (selectElement.selectedIndex === selectElement.length - 1) {
            inputElement.click();
            selectElement.selectedIndex = onSelect(-1);
            return;
        }

        onSelect(selectElement.selectedIndex);
    }

    inputElement.onchange = () => {
        if (inputElement.value.length === 0) {
            return;
        }

        handleFile(inputElement.files[0], inputElement.files[0].name);
    }

    const handleFile = (file, name) => {
        spinner.setAttribute("hidden", "true")
        console.log("Image added from file")

        let imageUrl = URL.createObjectURL(file)

        const image = new Image
        image.src = imageUrl

        image.onload = () => {
            let option = document.createElement("option")

            // Look for duplicates, including ones with numbers attached
            const reg = new RegExp(`\\b${name}\\b ?(\\(\\d\\))?`)

            let count = 0;

            for (let i = 0; i < selectElement.options.length; i++) {
                if (reg.test(selectElement.options[i].text)) {
                    count++;
                }
            }

            // Attach duplicate count
            if (count > 0) {
                name += ` (${ count + 1 })`;
            }

            option.text = name;

            // Insert before last element (preserved for upload option)
            selectElement.insertBefore(option, selectElement[selectElement.length - 1]);
            // Set shown option
            selectElement.selectedIndex = selectElement.length - 2;

            onImageAdded(image, file, selectElement.selectedIndex);

            inputElement.value = ''
        }
    }
}