

const button = document.getElementById("textSubmit");

const result = document.getElementById("result")

const text = document.getElementById("text")

function sendData() {
    fetch("http://localhost:8080/fizzbuzz/", {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin]
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: document.getElementById("text").value
    }) // body data type must match "Content-Type" header})
        .then(response => response.text())
        .then(text => result.innerHTML = text)
}

button.onclick = sendData;


