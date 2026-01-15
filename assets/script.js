let hideInput = false;
let removeSelected = false;
let choices = []; // array of {type: 'text'|'image', text?, src?, name?}

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
        if (!file) return;
        const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById("input").value = e.target.result;
                // convert text lines into choice objects
                choices = document.getElementById("input").value.split("\n").map(line => ({type: 'text', text: line}));
            };
            reader.onerror = (e) => {
                console.error('Error reading file:', e.target.error);
            };
            reader.readAsText(file);

    })

    document.getElementById("image-loader").addEventListener('change', (ev) => {
        const files = ev.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            var reader = new FileReader();
            reader.onload = (e) => {
                // store as image choice
                choices.push({type: 'image', src: e.target.result, name: file.name});
                console.log('image added', file.name);
            }
            reader.readAsDataURL(file);
        });
    })
})

function renderChoice(choice) {
    const choiceEl = document.getElementById("choice");
    choiceEl.innerHTML = '';
    if (choice === undefined || choice === null) {
        choiceEl.innerText = '???';
        return;
    }
    if (typeof choice === 'string') {
        choiceEl.innerText = choice;
        return;
    }
    if (choice.type === 'text') {
        choiceEl.innerText = choice.text;
        return;
    }
    if (choice.type === 'image') {
        const img = document.createElement('img');
        img.src = choice.src;
        img.alt = choice.name || '';
        img.loading = 'eager';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.margin = 'auto';
        choiceEl.appendChild(img);
        return;
    }
}

clickSpin = function() {
    document.getElementById("spin").hidden = true
    let res = undefined;

    if (choices.length === 0) {
        res = {type: 'text', text: 'No input found!'};
        document.getElementById("spin").hidden = false
        renderChoice(res);
        return;
    }

    let random = Math.floor(Math.random() * choices.length);
    // rapid preview
    let rapid = setInterval(() => {
        let randomRapid = Math.floor(Math.random() * choices.length);
        renderChoice(choices[randomRapid]);
    }, 50)
    setTimeout(() => {
        clearInterval(rapid);
        res = choices[random];
        document.getElementById("spin").hidden = false
        renderChoice(res);

        if (removeSelected === true) {
            // remove the selected item from choices
            choices.splice(random, 1);
            // if text mode, update textarea content to reflect removal
            const inputEl = document.getElementById("input");
            if (inputEl) {
                const textChoices = choices.filter(c => c.type === 'text').map(c => c.text);
                inputEl.value = textChoices.join("\n");
            }
        }
    }, 5000)
}