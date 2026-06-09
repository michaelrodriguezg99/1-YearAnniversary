/* =====================================================================
   SCREEN MANAGER CORE (shared)
   Add a screen by appending to SCREENS. Remove one by commenting it out.
   Reorder by moving lines. Order lives ONLY here.
   Each module sets up listeners in its init() and signals "done" by
   calling nextScreen(). No module hard-codes what comes after it.
   ===================================================================== */
const SCREENS = [
  { id: "envelope-screen", init: initEnvelope },
  { id: "captcha-screen",  init: initCaptcha },
  // future modules (login, quiz, wrapped, scrapbook...) slot in HERE
  { id: "letter-screen",   init: initLetter, onShow: openLetterWindow },
];

let _screen = 0;
function showScreen(i) {
  SCREENS.forEach((s, idx) =>
    document.getElementById(s.id).classList.toggle("active", idx === i)
  );
  const s = SCREENS[i];
  if (s.onShow) s.onShow();
  window.scrollTo(0, 0);
}
function nextScreen() {
  if (_screen < SCREENS.length - 1) { _screen++; showScreen(_screen); }
}
document.addEventListener("DOMContentLoaded", () => {
  SCREENS.forEach(s => s.init && s.init());
  showScreen(0);
});

/* =====================================================================
   SCREEN 1 — ENVELOPE
   ===================================================================== */
function initEnvelope() {
  document.getElementById("envelope-screen").addEventListener("click", nextScreen);
}

/* =====================================================================
   SCREEN 2 — CAPTCHA MODULE
   ---------------------------------------------------------------------
   ✏️  EDIT ZONE — the only part you change.
   - Add as many of YOUR photos as you like (correct: true).
   - Add as many book-boyfriend decoys as you like, each with a roast.
   - Drop the image files next to index.html and use the filename in `src`.
     Until a real file exists, a labeled placeholder tile shows instead,
     so you can test the mechanic right now.
   ===================================================================== */
const CAPTCHA_POOL = [
  // ----- YOU (the ONLY correct answers) -----
  { src: "me1.jpg", label: "Michael", correct: true },
  { src: "me2.jpg", label: "Michael", correct: true },
  { src: "me3.jpg", label: "Michael", correct: true },

  // ----- Book boyfriends / decoys (each picked => its own funny error) -----
  // REPLACE these with Alondra's actual favorites + your own captions.
  { src: "rhysand.jpg", label: "Rhysand",
    caption: "Rhysand? He lives in a book, mi amor. I live in your kitchen eating your snacks." },
  { src: "xaden.jpg", label: "Xaden",
    caption: "Xaden can't even text back — he's fictional. I reply in 4 seconds. Try again 😌" },
];

const CAPTCHA_VISIBLE     = 9;  // tiles shown at once
const CAPTCHA_CORRECT_MIN = 1;  // guarantee at least this many of YOUR photos appear

const CAPTCHA_NUDGES = [
  "Pick at least one. He's right there 👀",
  "Still nothing? He's getting insecure.",
  "Bestie. Select the boyfriend.",
];

function initCaptcha() {
  const grid   = document.getElementById("cap-grid");
  const msgEl  = document.getElementById("cap-msg");
  const verify = document.getElementById("cap-verify");
  const win    = document.querySelector("#captcha-screen .win");
  let nudgeIdx = 0;

  const shuffle = a => a.slice().sort(() => Math.random() - 0.5);
  const hue = str => { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

  function pickVisible() {
    const correct = CAPTCHA_POOL.filter(p => p.correct);
    const decoys  = CAPTCHA_POOL.filter(p => !p.correct);
    const sc = shuffle(correct), sd = shuffle(decoys);
    const need = Math.min(CAPTCHA_CORRECT_MIN, sc.length);
    let chosen = sc.slice(0, need);
    const rest = shuffle([...sd, ...sc.slice(need)]);
    while (chosen.length < CAPTCHA_VISIBLE && rest.length) chosen.push(rest.shift());
    if (!chosen.some(p => p.correct))
      console.warn("CAPTCHA: no correct photo visible — add at least one {correct:true}.");
    return shuffle(chosen).slice(0, CAPTCHA_VISIBLE);
  }

  function render() {
    msgEl.textContent = ""; msgEl.className = "cap-msg";
    grid.innerHTML = "";
    pickVisible().forEach(item => {
      const tile = document.createElement("button");
      tile.className = "cap-tile";
      tile.dataset.correct = item.correct ? "true" : "false";
      if (item.caption) tile.dataset.caption = item.caption;
      const h = hue(item.label || "x");
      tile.innerHTML = `
        <img alt="">
        <div class="tile-ph" style="background:hsl(${h} 45% 62%)">
          <span class="ico">${item.correct ? "💛" : "📖"}</span>
          <span>${item.label || ""}</span>
        </div>`;
      const img = tile.querySelector("img");
      img.onload = () => tile.classList.add("has-img");
      if (item.src) img.src = item.src;
      tile.addEventListener("click", () => tile.classList.toggle("selected"));
      grid.appendChild(tile);
    });
  }

  function fail(text) {
    msgEl.textContent = text; msgEl.className = "cap-msg bad";
    win.classList.remove("shake"); void win.offsetWidth; win.classList.add("shake");
    grid.querySelectorAll(".selected").forEach(t => t.classList.remove("selected"));
  }

  verify.addEventListener("click", () => {
    const tiles    = [...grid.querySelectorAll(".cap-tile")];
    const selected = tiles.filter(t => t.classList.contains("selected"));

    if (!selected.length) {
      fail(CAPTCHA_NUDGES[Math.min(nudgeIdx++, CAPTCHA_NUDGES.length - 1)]);
      return;
    }
    const wrong = selected.find(t => t.dataset.correct !== "true");
    if (wrong) {
      fail(wrong.dataset.caption || "That one exists only in your imagination. Try again.");
      return;
    }
    msgEl.textContent = "✅ Verified. Suspiciously good taste. Continuing…";
    msgEl.className = "cap-msg ok";
    verify.disabled = true;
    setTimeout(nextScreen, 1200);
  });

  render();
}

/* =====================================================================
   SCREEN 3 — LETTER (renewal finale)
   Your original logic, unchanged — just wrapped in init/onShow and
   scoped to #letter-screen so it can't collide with other modules.
   ===================================================================== */
function openLetterWindow() {
  const win = document.querySelector("#letter-screen .letter-window");
  win.classList.remove("open");          // reset in case of re-entry
  setTimeout(() => win.classList.add("open"), 50);
}

function initLetter() {
  const screen    = document.getElementById("letter-screen");
  const noBtn     = screen.querySelector(".no-btn");
  const yesBtn    = screen.querySelector(".yes-btn");
  const title     = screen.querySelector("#letter-title");
  const catImg    = screen.querySelector("#letter-cat");
  const buttons   = screen.querySelector("#letter-buttons");
  const finalText = screen.querySelector("#final-text");

  // "grow" -> No grows Yes | "sad" -> heartbroken Cameo | "runaway" -> No dodges
  let phase = "grow";
  let yesScale = 1;

  yesBtn.style.position = "relative";
  yesBtn.style.transformOrigin = "center center";
  yesBtn.style.transition = "transform 0.3s ease";

  function resetYesBtn() {
    yesScale = 1;
    yesBtn.style.position = "relative";
    yesBtn.style.top = "";
    yesBtn.style.left = "";
    yesBtn.style.transform = "";
  }

  function startSadRound() {
    phase = "sad";
    resetYesBtn();
    catImg.src = "cameo_heartbroken.gif";
    title.textContent = "Hiciste a Cameo triste por dudar... ¿De verdad quieres ponerlo triste?";
    yesBtn.style.display = "none";
  }

  function startRunawayRound() {
    phase = "runaway";
    catImg.src = "candy_heart.gif";
    title.textContent = "¿Entonces... sí? 🥺";
    yesBtn.style.display = "";
    noBtn.style.transform = "";
  }

  function showFinal() {
    title.textContent = "Yippeeee!";
    catImg.src = "cameo_and_candy_dancing.gif";
    screen.querySelector(".letter-window").classList.add("final");
    buttons.style.display = "none";
    finalText.style.display = "block";
  }

  noBtn.addEventListener("click", () => {
    if (phase === "grow") {
      yesScale += 2;
      if (yesBtn.style.position !== "fixed") {
        yesBtn.style.position = "fixed";
        yesBtn.style.top = "50%";
        yesBtn.style.left = "50%";
      }
      yesBtn.style.transform = `translate(-50%, -50%) scale(${yesScale})`;
    } else if (phase === "sad") {
      startRunawayRound();
    }
  });

  noBtn.addEventListener("mouseover", () => {
    if (phase !== "runaway") return;
    const min = 150, max = 250;
    const distance = Math.random() * (max - min) + min;
    const angle = Math.random() * Math.PI * 2;
    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;
    noBtn.style.transition = "transform 0.3s ease";
    noBtn.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });

  yesBtn.addEventListener("click", () => {
    if (phase === "grow") { startSadRound(); return; }
    if (phase === "runaway") { showFinal(); }
  });
}
