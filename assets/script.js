let hideInput = false;
let removeSelected = false;
let choices = []; // array of {type: 'text'|'image', text?, src?, name?}
let pendingImageLoads = 0;
let spinning = false;
let currentRotation = 0;

const SVG_NS = 'http://www.w3.org/2000/svg';
const SPIN_DURATION_MS = 5000;
const WHEEL_COLORS = ['#e23b3b', '#f2a93b', '#f2e13b', '#7ed13b', '#3bb8e2', '#5c6bf2', '#b23bf2', '#f23ba0'];

function parseTextToChoices(rawText) {
    return rawText
        .split(/\r\n|\r|\n/)
        .filter(line => line.trim().length > 0)
        .map(line => ({type: 'text', text: line}));
}

function setControlsDisabled(disabled) {
    document.getElementById("mode").disabled = disabled;
    document.getElementById("text-loader").disabled = disabled;
    document.getElementById("image-loader").disabled = disabled;
}

function updateSpinAvailability() {
    document.getElementById("spin").disabled = pendingImageLoads > 0;
}

// --- Wheel drawing ---

function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
}

function describeSlicePath(cx, cy, r, startAngle, endAngle) {
    const p1 = polarToCartesian(cx, cy, r, startAngle);
    const p2 = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
}

// Rough average glyph width for this font family/weight, as a fraction of font-size.
const AVG_CHAR_WIDTH_RATIO = 0.56;

function estimateTextWidth(text, fontSize) {
    return text.length * fontSize * AVG_CHAR_WIDTH_RATIO;
}

// Shrinks the font (down to a floor) so the full label fits the available radial
// width; only truncates with an ellipsis if it still doesn't fit at the floor size.
function fitLabel(text, baseFontSize, maxWidth) {
    const minFontSize = 7;
    let fontSize = baseFontSize;
    while (fontSize > minFontSize && estimateTextWidth(text, fontSize) > maxWidth) {
        fontSize -= 0.5;
    }
    let displayText = text;
    if (estimateTextWidth(displayText, fontSize) > maxWidth) {
        while (displayText.length > 1 && estimateTextWidth(displayText + '…', fontSize) > maxWidth) {
            displayText = displayText.slice(0, -1);
        }
        displayText += '…';
    }
    return {fontSize, text: displayText};
}

function appendWheelLabel(svg, cx, cy, r, mid, displayText, fontSize) {
    const pos = polarToCartesian(cx, cy, r * 0.62, mid);
    let rotation = mid - 90;
    const normalized = ((rotation % 360) + 360) % 360;
    if (normalized > 90 && normalized < 270) rotation += 180;

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', pos.x);
    text.setAttribute('y', pos.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('transform', `rotate(${rotation} ${pos.x} ${pos.y})`);
    text.setAttribute('class', 'wheel-label');
    text.setAttribute('font-size', fontSize);
    text.textContent = displayText;
    svg.appendChild(text);
}

function buildWheel(choicesArr) {
    const svg = document.getElementById('wheel');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const cx = 200, cy = 200, r = 190;

    if (choicesArr.length === 0) {
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', '#edd28f');
        circle.setAttribute('stroke', '#000');
        circle.setAttribute('stroke-width', 2);
        svg.appendChild(circle);
        return;
    }

    const n = choicesArr.length;
    const sliceAngle = 360 / n;
    const baseFontSize = Math.max(9, Math.min(22, 240 / n));
    const hubRadius = 14;
    const labelRadius = r * 0.62;
    // Room the label has to extend outward/inward from its anchor before hitting the hub or the rim.
    const maxLabelWidth = 2 * Math.min(labelRadius - hubRadius - 10, r - 10 - labelRadius);

    choicesArr.forEach((choice, i) => {
        const start = i * sliceAngle;
        const end = start + sliceAngle;
        const mid = start + sliceAngle / 2;
        const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', describeSlicePath(cx, cy, r, start, end));
        path.setAttribute('fill', color);
        path.setAttribute('stroke', '#000');
        path.setAttribute('stroke-width', 2);
        path.setAttribute('class', 'wheel-slice');
        path.setAttribute('data-index', i);
        svg.appendChild(path);

        if (hideInput) {
            appendWheelLabel(svg, cx, cy, r, mid, '???', baseFontSize);
            return;
        }

        if (choice.type === 'image') {
            const imgR = Math.min(38, r * 0.24);
            const pos = polarToCartesian(cx, cy, r * 0.62, mid);
            const clipId = `wheel-clip-${i}`;

            const clip = document.createElementNS(SVG_NS, 'clipPath');
            clip.setAttribute('id', clipId);
            const clipCircle = document.createElementNS(SVG_NS, 'circle');
            clipCircle.setAttribute('cx', pos.x);
            clipCircle.setAttribute('cy', pos.y);
            clipCircle.setAttribute('r', imgR);
            clip.appendChild(clipCircle);
            svg.appendChild(clip);

            const img = document.createElementNS(SVG_NS, 'image');
            img.setAttribute('href', choice.src);
            img.setAttribute('x', pos.x - imgR);
            img.setAttribute('y', pos.y - imgR);
            img.setAttribute('width', imgR * 2);
            img.setAttribute('height', imgR * 2);
            img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            img.setAttribute('clip-path', `url(#${clipId})`);
            svg.appendChild(img);

            const ring = document.createElementNS(SVG_NS, 'circle');
            ring.setAttribute('cx', pos.x);
            ring.setAttribute('cy', pos.y);
            ring.setAttribute('r', imgR);
            ring.setAttribute('fill', 'none');
            ring.setAttribute('stroke', '#000');
            ring.setAttribute('stroke-width', 2);
            svg.appendChild(ring);
        } else {
            const fitted = fitLabel(choice.text, baseFontSize, maxLabelWidth);
            appendWheelLabel(svg, cx, cy, r, mid, fitted.text, fitted.fontSize);
        }
    });

    const hub = document.createElementNS(SVG_NS, 'circle');
    hub.setAttribute('cx', cx);
    hub.setAttribute('cy', cy);
    hub.setAttribute('r', 14);
    hub.setAttribute('fill', '#000');
    svg.appendChild(hub);
}

function clearWinnerHighlight() {
    document.querySelectorAll('.wheel-slice.winner').forEach(el => el.classList.remove('winner'));
}

function highlightSlice(index) {
    const slice = document.querySelector(`.wheel-slice[data-index="${index}"]`);
    if (slice) slice.classList.add('winner');
}

function resetWheelRotation() {
    const wheelEl = document.getElementById('wheel');
    wheelEl.style.transition = 'none';
    currentRotation = 0;
    wheelEl.style.transform = 'rotate(0deg)';
    void wheelEl.offsetWidth; // force reflow so the transition:none takes effect
    wheelEl.style.transition = '';
}

function setChoices(newChoices) {
    choices = newChoices;
    clearWinnerHighlight();
    buildWheel(choices);
    resetWheelRotation();
}

// --- Result readout ---

function renderResult(choice) {
    const resultEl = document.getElementById("result");
    resultEl.innerHTML = '';
    if (choice === undefined || choice === null) {
        resultEl.innerText = '???';
        return;
    }
    if (choice.type === 'text') {
        resultEl.innerText = choice.text;
        return;
    }
    if (choice.type === 'image') {
        const img = document.createElement('img');
        img.src = choice.src;
        img.alt = choice.name || '';
        resultEl.appendChild(img);
        return;
    }
}

window.onload = (ev => {
    document.getElementById("inputbox-text").hidden = hideInput;
    document.getElementById("inputbox-pictures").hidden = true;
    document.getElementById("hide-input").checked = hideInput;
    document.getElementById("rem-selected").checked = removeSelected;
    document.getElementById("mode").value = "Text";
    document.getElementById("spin").onclick = clickSpin
    buildWheel(choices);

    document.getElementById("mode").addEventListener('change', () => {
        switch (document.getElementById("mode").value) {
            case "Text":
                document.getElementById("input").value = ""
                document.getElementById("text-loader").value = null
                document.getElementById("image-loader").value = null
                document.getElementById("inputbox-text").hidden = hideInput;
                document.getElementById("inputbox-pictures").hidden = true;
                break;
            case "Pictures":
                document.getElementById("input").value = ""
                document.getElementById("text-loader").value = null
                document.getElementById("image-loader").value = null
                document.getElementById("inputbox-text").hidden = true;
                document.getElementById("inputbox-pictures").hidden = hideInput;
                break;
        }
        pendingImageLoads = 0;
        updateSpinAvailability();
        renderResult(undefined);
        setChoices([]);
    })

    document.getElementById("hide-input").addEventListener('change', () => {
        hideInput = document.getElementById("hide-input").checked
        switch (document.getElementById("mode").value) {
            case "Text":
                document.getElementById("inputbox-text").hidden = document.getElementById("hide-input").checked
                break;
            case "Pictures":
                document.getElementById("inputbox-pictures").hidden = document.getElementById("hide-input").checked
                break;
        }
        buildWheel(choices);
    })
    document.getElementById("rem-selected").addEventListener('change', () => {
        removeSelected = document.getElementById("rem-selected").checked
    })

    document.getElementById("input").addEventListener('input', () => {
        setChoices(parseTextToChoices(document.getElementById("input").value));
    })

    document.getElementById("text-loader").addEventListener('change', (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById("input").value = e.target.result;
                setChoices(parseTextToChoices(e.target.result));
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
            pendingImageLoads++;
            updateSpinAvailability();
            var reader = new FileReader();
            reader.onload = (e) => {
                // store as image choice
                choices.push({type: 'image', src: e.target.result, name: file.name});
                buildWheel(choices);
                resetWheelRotation();
                console.log('image added', file.name);
                pendingImageLoads--;
                updateSpinAvailability();
            }
            reader.onerror = (e) => {
                console.error('Error reading file:', e.target.error);
                pendingImageLoads--;
                updateSpinAvailability();
            }
            reader.readAsDataURL(file);
        });
    })
})

// Spins the wheel so the pointer lands on a randomly chosen slice; returns that slice's index.
function spinWheelToRandom() {
    const wheelEl = document.getElementById('wheel');
    const index = Math.floor(Math.random() * choices.length);
    const sliceAngle = 360 / choices.length;
    const mid = index * sliceAngle + sliceAngle / 2;
    const extraSpins = 6;
    const base = Math.ceil((currentRotation + 1) / 360) * 360;
    const target = base + extraSpins * 360 + ((360 - mid) % 360);
    currentRotation = target;
    wheelEl.style.transform = `rotate(${target}deg)`;
    return index;
}

clickSpin = function() {
    if (spinning) return;
    document.getElementById("spin").hidden = true
    setControlsDisabled(true);

    if (choices.length === 0) {
        renderResult({type: 'text', text: 'No input found!'});
        document.getElementById("spin").hidden = false
        setControlsDisabled(false);
        return;
    }

    spinning = true;
    clearWinnerHighlight();
    const index = spinWheelToRandom();

    setTimeout(() => {
        spinning = false;
        document.getElementById("spin").hidden = false
        setControlsDisabled(false);
        const res = choices[index];
        highlightSlice(index);
        renderResult(res);

        if (removeSelected === true) {
            // remove the selected item from choices
            choices.splice(index, 1);
            // if text mode, update textarea content to reflect removal
            const inputEl = document.getElementById("input");
            if (inputEl) {
                const textChoices = choices.filter(c => c.type === 'text').map(c => c.text);
                inputEl.value = textChoices.join("\n");
            }
            buildWheel(choices);
            resetWheelRotation();
        }
    }, SPIN_DURATION_MS)
}
