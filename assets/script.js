let hideInput = false;
let removeSelected = false;
let choices = [];

window.onload = (ev => {
    document.getElementById("inputbox-text").hidden = hideInput;
    document.getElementById("inputbox-pictures").hidden = true;
    document.getElementById("hide-input").checked = hideInput;
    document.getElementById("rem-selected").checked = removeSelected;
    document.getElementById("mode").value = "Text";
    document.getElementById("spin").onclick = clickSpin
    document.getElementById("mode").addEventListener('change', () => {
        switch (document.getElementById("mode").value) {
            case "Text":
                document.getElementById("inputbox-text").hidden = hideInput;
                document.getElementById("inputbox-pictures").hidden = true;
                document.getElementById("hide-input-check").hidden = false;
                document.getElementById("hide-input").checked = hideInput;
                break;
            case "Pictures":
                document.getElementById("inputbox-text").hidden = true;
                document.getElementById("inputbox-pictures").hidden = false;
                document.getElementById("hide-input-check").hidden = true;
                break;
        }
    })
    document.getElementById("hide-input").addEventListener('change', () => {
        document.getElementById("inputbox-text").hidden = document.getElementById("hide-input").checked
        hideInput = document.getElementById("hide-input").checked
    })
    document.getElementById("rem-selected").addEventListener('change', () => {
        removeSelected = document.getElementById("rem-selected").checked
    })
    document.getElementById("text-loader").addEventListener('change', (ev) => {
        const file = ev.target.files[0];
        const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById("input").value = e.target.result;
                choices = document.getElementById("input").value.split("\n");
            };
            reader.onerror = (e) => {
                console.error('Error reading file:', e.target.error);
            };
            reader.readAsText(file);

    })
    document.getElementById("image-loader").addEventListener('change', (ev) => {
        const files = ev.target.files;
        Array.from(files).forEach(file => {
            var reader = new FileReader();
            reader.onload = (e) => {
                var img = new Image();
                img.src = reader.result;
                choices.push(img);
                console.log(choices)
            }
            reader.readAsDataURL(file);
        });
    })
})

clickSpin = function() {
    document.getElementById("spin").hidden = true
    let res = undefined;
    let source = undefined;
        switch (document.getElementById("mode").value) {
            case "Text":
                source = document.getElementById("choice").innerText;
                break;
            case "Pictures":
                source = document.getElementById("choice").src;
                break;
        }
    console.log(choices.length)
    if (choices.length === 0) {
        res = "No input found!";
        document.getElementById("spin").hidden = false
        source = res
    }
    else {
        let random = Math.floor(Math.random() * choices.length);
        let rapid = setInterval(() => {
            let randomRapid = Math.floor(Math.random() * choices.length);
            source = choices[randomRapid]
        }, 50)
        setTimeout(() => {
            clearInterval(rapid);
            res = choices[random];
            document.getElementById("spin").hidden = false
            source = res;
            if (removeSelected === true) {
                choices.filter(line => !line.includes(res))
                document.getElementById("input").value = change.join("\n")
            }
        }, 5000)
    }
}