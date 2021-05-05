// const form = document.getElementById("imagechooser")
//
// const image = document.getElementById("image")
//
// image.style.display = "none"
//
// const HOST_SERVER = ""
//
// alert("no!")
//
//
// function sendPostRequest(file) {
//
//     const formData = new FormData()
//     formData.append("file", file)
//     formData.append("backgroundColors", [])
//     formData.append("distance", 2)
//     formData.append("primaryOrder", 0)
//     formData.append("secondaryOrder", 1)
//
//     return fetch(HOST_SERVER + "/spritesheet", {
//         method: "POST",
//         body: formData
//     })
// }
//
// form.onsubmit = (e) => {
//     e.preventDefault();
//
//     let fileInput = document.getElementById("img")
//
//     const imageUrl = URL.createObjectURL(fileInput.files[0])
//
//     image.src = imageUrl
//     image.style.display = "block"
//
//
//     sendPostRequest(fileInput.files[0]).then((response) => response.json()).then(text => console.log(text))
// }