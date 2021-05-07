// Config
const HOST_SERVER = "http://localhost:8080"

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
 * @param {File} file
 * @param distance
 * @return {Promise<Response>}
 */
export function sendBlobDetectionRequest(file, distance=2) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("backgroundColors", [])
    formData.append("distance", distance)
    formData.append("primaryOrder", 0)
    formData.append("secondaryOrder", 1)

    return fetch(HOST_SERVER + "/spritesheet", {
        method: "POST",
        body: formData
    })
}