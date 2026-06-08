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
// "grow"    -> No grows the Yes button (round 1)
// "runaway" -> No dodges the mouse (round 2)
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
 
// --- NO button, ROUND 1: grow Yes on click ---
noBtn.addEventListener("click", () => {
    if (phase !== "grow") return;          // only active in round 1
    yesScale += 2;
    if (yesBtn.style.position !== "fixed") {
        yesBtn.style.position = "fixed";
        yesBtn.style.top = "50%";
        yesBtn.style.left = "50%";
    }
    yesBtn.style.transform = `translate(-50%, -50%) scale(${yesScale})`;
});
 
// --- NO button, ROUND 2: run away on hover ---
noBtn.addEventListener("mouseover", () => {
    if (phase !== "runaway") return;        // only active in round 2
    const min = 150;
    const max = 250;
    const distance = Math.random() * (max - min) + min;
    const angle = Math.random() * Math.PI * 2;
    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;
    noBtn.style.transition = "transform 0.3s ease";
    noBtn.style.transform = `translate(${moveX}px, ${moveY}px)`;
});
 
// --- YES button ---
yesBtn.addEventListener("click", () => {
    if (phase === "grow") {
        // First "Yes": don't celebrate yet. Reset and switch to the runaway round.
        phase = "runaway";
        resetYesBtn();
        noBtn.style.transform = "";          // make sure No starts centered
        title.textContent = "¿Esperaa... estas SEGURA?";
        return;
    }
 
    // Round 2 "Yes": the real ending
    title.textContent = "Yippeeee!";
    catImg.src = "cat_dance.gif";
    document.querySelector(".letter-window").classList.add("final");
    buttons.style.display = "none";
    finalText.style.display = "block";
});
