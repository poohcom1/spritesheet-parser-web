// Config
// noinspection JSCheckFunctionSignatures

const HOST_SERVER = location.host === "localhost:63342" ? "http://localhost:8080" : "";

/**
 * @param {File} file image to crop
 * @param x origin x
 * @param y origin y
 * @param w width
 * @param h height
 * @returns {Promise<Response>}
 */
export function sendCropRequest(file, x, y, w, h) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("x", x)
    formData.append("y", y)
    formData.append("w", w)
    formData.append("h", h)

    return fetch(HOST_SERVER + "/crop", {
        method: "POST",
        body: formData
    })
}

/**
 * @typedef BlobData
 * @property {number} id
 * @property {DetectedBlob[]} blobs
 * @property {number} threshold
 */

/**
 * @param {File} file
 * @param distance
 * @param count
 * @param deltaThreshold
 * @param backgroundColors
 * @return {Promise<BlobData>}
 */
export function sendBlobDetectionRequest(file, distance=2, count=0, deltaThreshold=1, backgroundColors=[]) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("backgroundColors", backgroundColors)
    formData.append("distance", distance)
    formData.append("count", count);
    formData.append("deltaThreshold", deltaThreshold)
    formData.append("primaryOrder", 0)
    formData.append("secondaryOrder", 1)


    return fetch(HOST_SERVER + "/spritesheet", {
        method: "POST",
        body: formData
    }).then((response) => response.json())
}