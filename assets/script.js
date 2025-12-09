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
    let res = undefined;
    let choices = document.getElementById("input").value.split("\n");
    console.log(choices.length)
    if (choices.length === 1 && choices[0] === "") res = "No input found!";
    else {
        let random = Math.floor(Math.random() * choices.length)
        res = choices[random];
        if (removeSelected === true) {
            let change = choices.filter(line => !line.includes(res))
            document.getElementById("input").value = change.join("\n")
        }
    }
    document.getElementById("choice").innerText = res
}