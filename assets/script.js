let removeSelected;

window.onload = (ev => {
    document.getElementById("spin").onclick = clickSpin
    document.getElementById("hide-input").addEventListener('change', () => {
        document.getElementById("input").hidden = document.getElementById("hide-input").checked
    })
    document.getElementById("rem-selected").addEventListener('change', () => {
        removeSelected = document.getElementById("rem-selected").checked
    })
})

clickSpin = function() {
    document.getElementById("spin").hidden = true
    let res = undefined;
    let choices = document.getElementById("input").value.split("\n");
    console.log(choices.length)
    if (choices.length === 1 && choices[0] === "") {
        res = "No input found!";
        document.getElementById("spin").hidden = false
        document.getElementById("choice").innerText = res
    }
    else {
        let random = Math.floor(Math.random() * choices.length);
        let rapid = setInterval(() => {
            let randomRapid = Math.floor(Math.random() * choices.length);
            document.getElementById("choice").innerText = choices[randomRapid]
        }, 50)
        setTimeout(() => {
            clearInterval(rapid);
            res = choices[random];
            document.getElementById("spin").hidden = false
            document.getElementById("choice").innerText = res
            if (removeSelected === true) {
                let change = choices.filter(line => !line.includes(res))
                document.getElementById("input").value = change.join("\n")
            }
        }, 5000)
    }
}