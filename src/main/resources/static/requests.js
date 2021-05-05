// Config
const HOST_SERVER = "http://localhost:8080"

/**
 * @param file image to crop
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

export function sendBlobDetectionRequest(file) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("backgroundColors", [])
    formData.append("distance", 2)
    formData.append("primaryOrder", 0)
    formData.append("secondaryOrder", 1)

    return fetch(HOST_SERVER + "/spritesheet", {
        method: "POST",
        body: formData
    })
}