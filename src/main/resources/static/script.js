const HOST_SERVER = ""

const form = document.getElementById("imagechooser")

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");


form.onsubmit = (e) => {
    e.preventDefault();

    let fileInput = document.getElementById("imageInput")

    const imageUrl = URL.createObjectURL(fileInput.files[0])

    const image = new Image
    image.src = imageUrl
    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        setCanvasImage(image)
    }

    sendPostRequest(fileInput.files[0])
        .then((response) => response.json())
        .then(data => {
            console.log(data)
           
            data.forEach(rect => {
                ctx.beginPath();
                ctx.rect(rect.x, rect.y, rect.width, rect.height);
                ctx.stroke()
            })
        })
}

function sendPostRequest(file) {
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

function setCanvasImage(image, rect = []) {
    ctx.drawImage(image, 0, 0)
}