// Elements
const envelope = document.getElementById("envelope-container");
const letter = document.getElementById("letter-container");
const noBtn = document.querySelector(".no-btn");
const yesBtn = document.querySelector(".btn[alt='Yes']");
const title = document.getElementById("letter-title");
const catImg = document.getElementById("letter-cat");
const buttons = document.getElementById("letter-buttons");
const finalText = document.getElementById("final-text");

// Click Envelope
envelope.addEventListener("click", () => {
    envelope.style.display = "none";
    letter.style.display = "flex";
    setTimeout(() => {
        document.querySelector(".letter-window").classList.add("open");
    }, 50);
});

// --- Phase tracking ---
// "grow"    -> Round 1: No grows the Yes button
// "sad"     -> Round 2: heartbroken Cameo, only the No button shows
// "runaway" -> Round 3: candy Cameo, No dodges the mouse
let phase = "grow";
let yesScale = 1;

yesBtn.style.position = "relative";
yesBtn.style.transformOrigin = "center center";
yesBtn.style.transition = "transform 0.3s ease";

// Put the Yes button back to its starting size / position
function resetYesBtn() {
    yesScale = 1;
    yesBtn.style.position = "relative";
    yesBtn.style.top = "";
    yesBtn.style.left = "";
    yesBtn.style.transform = "";
}

// ----- ROUND 2: sad Cameo, only the No button -----
function startSadRound() {
    phase = "sad";
    resetYesBtn();
    catImg.src = "cameo_heartbroken.gif";
    title.textContent = "Hiciste a Cameo triste por dudar... ¿De verdad quieres ponerlo triste?";
    yesBtn.style.display = "none";   // hide Yes, leave only No
}

// ----- ROUND 3: candy Cameo, runaway No button -----
function startRunawayRound() {
    phase = "runaway";
    catImg.src = "candy_heart.gif";
    title.textContent = "¿Entonces... sí? 🥺";   // ask again
    yesBtn.style.display = "";        // bring Yes back (reverts to CSS inline-block)
    noBtn.style.transform = "";       // No starts centered, then dodges on hover
}

// ----- Final celebration -----
function showFinal() {
    title.textContent = "Yippeeee!";
    catImg.src = "cameo_and_candy_dancing.gif";
    document.querySelector(".letter-window").classList.add("final");
    buttons.style.display = "none";
    finalText.style.display = "block";
}

// --- NO button click (handles Round 1 and Round 2) ---
noBtn.addEventListener("click", () => {
    if (phase === "grow") {
        // Round 1: each No press grows Yes
        yesScale += 2;
        if (yesBtn.style.position !== "fixed") {
            yesBtn.style.position = "fixed";
            yesBtn.style.top = "50%";
            yesBtn.style.left = "50%";
        }
        yesBtn.style.transform = `translate(-50%, -50%) scale(${yesScale})`;
    } else if (phase === "sad") {
        // Round 2: she chose NOT to make him sad -> start Round 3
        startRunawayRound();
    }
});

// --- NO button hover (Round 3 only): run away ---
noBtn.addEventListener("mouseover", () => {
    if (phase !== "runaway") return;
    const min = 150;
    const max = 250;
    const distance = Math.random() * (max - min) + min;
    const angle = Math.random() * Math.PI * 2;
    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;
    noBtn.style.transition = "transform 0.3s ease";
    noBtn.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// --- YES button click ---
yesBtn.addEventListener("click", () => {
    if (phase === "grow") {
        startSadRound();    // Round 1 Yes -> Round 2 (sad)
        return;
    }
    if (phase === "runaway") {
        showFinal();        // Round 3 Yes -> celebration
    }
});
