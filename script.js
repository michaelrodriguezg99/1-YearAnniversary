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
  { id: "login-screen",    init: initLogin, onShow: focusLoginPass },
  // future modules (boot, quiz, wrapped, scrapbook...) slot in HERE
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
 
  // ----- Book boyfriends / celebrity crushes / decoys (each picked => its own funny error) -----
  // Any entry with  effect: "thunder"  joins the lightning storm when
  // two different thunder picks are selected together.
  // Any entry with  gif: "file.gif"  pops that gif up when the tile is picked.
  { src: "rhysand.jpg", label: "Rhysand",
    caption: "Rhysand? He lives in a book, mi amor. I live in your kitchen eating your snacks." },
  { src: "xaden.jpg", label: "Xaden", effect: "thunder",
    caption: "Xaden Riorson?? He'd literally let you fall to prove a point. I'd catch you AND carry your bag. ⚡" },
  { src: "violet.jpg", label: "Violet", effect: "thunder",
    caption: "Violet Sorrengail — elite taste, but she's (a) taken by Xaden and (b) made of paper. Pick me ⚡" },
  { src: "BadBunny.jpg", label: "BadBunny", gif: "cat_dance.gif",
    caption: "Bad Bunny is selling out stadiums, not showing up at your door. I bring snacks 🐰" },
  { src: "BabyMiko.jpg", label: "BabyMiko", effect: "thunder",
    caption: "Baby Miko lives in your phone. I live one room away and already made you food ⚡" },
  { src: "Garrett.jpg", label: "Garrett", effect: "thunder",
    caption: "Garrett Graham had to bribe a girl into a fake-dating deal just to get a date. I didn't need a deal — you said yes for real 🏒⚡" },
  { src: "Allie.jpg", label: "Allie", gif: "AllieHayes.gif",
    caption: "Allie Hayes is a drama-major sweetheart… who only exists in Elle Kennedy's head. I'm in your contacts 🎭" },
  { src: "Dean.jpg", label: "Dean", gif: "Dean.gif",
    caption: "Dean Di Laurentis — trust-fund charmer who flirts with anything that moves. I only flirt with you 😏⚡" },
      { src: "Hannah.jpg", label: "Hannah", gif: "Hannah.gif",
    caption: "Hannah Wells — mysterious and alluring, but I'm the one who's always here for you 😏⚡" },
  { src: "AlastorDemon.jpg", label: "AlastorDemon", effect: "thunder",
    caption: "Alastor is a literal demon who HATES being touched. I'm a softie who gives free hugs 📻⚡" },
  { src: "AlastorHuman.jpg", label: "AlastorHuman",
    caption: "Same Alastor, just pre-deal. Still fictional, still allergic to affection. I'm right here." },
  { src: "Cherry.jpg", label: "Cherry", effect: "thunder",
    caption: "Sweet pick, but Cherry isn't showing up with snacks and forehead kisses. I am ⚡" },
  { src: "RauwAlejandro.jpg", label: "RauwAlejandro", effect: "thunder",
    caption: "Rauw Alejandro doesn't know you exist, mi amor. I know your coffee order by heart ☕⚡" },
  { src: "TaylorSwift.jpg", label: "TaylorSwift",
    caption: "Taylor has millions of fans. You've got one whole boyfriend, fully yours. Renew me 💜" },
  { src: "Anthony.jpg", label: "Anthony", effect: "thunder",
    caption: "Anthony Bridgerton: brooding, emotionally constipated, and 200 years old. I actually talk to you ⚡" },
  { src: "Benedict.jpg", label: "Benedict", effect: "thunder",
    caption: "Benedict's a dreamy artist who won't commit. I committed — a whole year, renewing right now 🎨⚡" },
  { src: "Colin.jpg", label: "Colin",
    caption: "Colin took eight seasons to notice the girl right in front of him. I noticed you instantly 😌" },
  { src: "HitachiinTwins.jpg", label: "HitachiinTwins", effect: "thunder",
    caption: "The Hitachiin twins are a 2-for-1 cartoon deal. You already have your favorite duo: us 👯⚡" },
  { src: "Tamaki.jpg", label: "Tamaki", effect: "thunder",
    caption: "Tamaki would spin you through a rose garden, then trip over himself. Charming, but fictional 🌹⚡" },
];
 
const CAPTCHA_VISIBLE     = 9;     // tiles shown at once
const CAPTCHA_CORRECT_MIN = 1;     // guarantee at least this many of YOUR photos appear
const THUNDER_SOUND       = true;  // set false to mute the lightning rumble
 
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
 
  // ----- Lightning storm (overlay created once, reused) -----
  let flash = document.querySelector(".thunder-flash");
  if (!flash) {
    flash = document.createElement("div");
    flash.className = "thunder-flash";
    flash.innerHTML =
      '<svg class="thunder-bolt" viewBox="0 0 100 200" preserveAspectRatio="xMidYMin meet">' +
      '<path d="M52 0 L30 96 L48 96 L26 200 L74 86 L54 86 L70 0 Z"/></svg>';
    document.body.appendChild(flash);
  }
  const bolt = flash.querySelector(".thunder-bolt");
 
  let actx;
  function audioCtx() {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function rumble(dur) {            // long, rolling low rumble across the whole storm
    if (!THUNDER_SOUND) return;
    try {
      const ctx = audioCtx();
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const env = (1 - t) * (0.6 + 0.4 * Math.sin(t * 9));   // a couple of swells, fading out
        d[i] = (Math.random() * 2 - 1) * Math.max(env, 0);
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220;
      const g = ctx.createGain(); g.gain.value = 0.5;
      src.connect(lp); lp.connect(g); g.connect(ctx.destination);
      src.start();
    } catch (e) { /* audio unavailable — visuals still fire */ }
  }
  function crack() {               // sharp per-strike crack
    if (!THUNDER_SOUND) return;
    try {
      const ctx = audioCtx();
      const dur = 0.3, len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3);
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 700;
      const g = ctx.createGain(); g.gain.value = 0.3;
      src.connect(hp); hp.connect(g); g.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }
  function strike() {              // one bolt from a random angle + position
    const angle = Math.random() * 110 - 55;        // -55° .. 55°
    const left  = 8 + Math.random() * 84;          // anywhere across the screen
    const scale = 0.7 + Math.random() * 0.9;
    bolt.style.left = left + "%";
    bolt.style.transformOrigin = "top center";
    bolt.style.transform = `translateX(-50%) rotate(${angle}deg) scale(${scale})`;
    // animate in JS so the visual never depends on a cached/old stylesheet
    flash.animate(
      [ { opacity: 0 }, { opacity: 0.95, offset: 0.10 }, { opacity: 0.20, offset: 0.20 },
        { opacity: 0.85, offset: 0.35 }, { opacity: 0, offset: 0.55 }, { opacity: 0 } ],
      { duration: 550, easing: "ease" }
    );
    bolt.animate(
      [ { opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 0.25, offset: 0.18 },
        { opacity: 1, offset: 0.30 }, { opacity: 0, offset: 0.50 }, { opacity: 0 } ],
      { duration: 550, easing: "ease" }
    );
    crack();
  }
  function triggerThunder() {       // a 3.5–5s storm of strikes from different angles
    const total = 3500 + Math.random() * 1500;     // milliseconds
    const n = 6 + Math.floor(Math.random() * 4);    // 6–9 strikes
    strike();                                       // first strike immediately
    for (let k = 1; k < n; k++) setTimeout(strike, 200 + Math.random() * (total - 200));
    rumble(total / 1000);
  }
 
  // ----- Reaction GIF popup (overlay created once, reused) -----
  let gifPop = document.querySelector(".gif-pop");
  if (!gifPop) {
    gifPop = document.createElement("div");
    gifPop.className = "gif-pop";
    gifPop.innerHTML = '<img alt="">';
    document.body.appendChild(gifPop);
  }
  let gifTimer;
  function showGif(src) {
    const img = gifPop.querySelector("img");
    img.src = src;
  
    img.classList.remove("cropped-allie");

    if (src.includes("AllieAndDean.gif")) {
      img.classList.add("cropped-allie");
    }
  
    gifPop.classList.add("show");
    clearTimeout(gifTimer);
    gifTimer = setTimeout(() => gifPop.classList.remove("show"), 2600);
  }
  const shuffle = a => a.slice().sort(() => Math.random() - 0.5);
  const hue = str => { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  // turn "AlistorDemon" / "TaylorSwift" into "Alistor Demon" / "Taylor Swift"
  const prettify = s => (s || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
  const initials = s => {
    const w = prettify(s).split(/\s+/).filter(Boolean);
    return ((w[0] ? w[0][0] : "") + (w[1] ? w[1][0] : "")).toUpperCase() || "?";
  };
 
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
      if (item.effect)  tile.dataset.effect  = item.effect;
      if (item.label)   tile.dataset.label   = item.label;
      if (item.gif)     tile.dataset.gif      = item.gif;
      const h = hue(item.label || "x");
      tile.innerHTML = `
        <img alt="">
        <div class="tile-ph" style="--ph-h:${h}">
          <span class="ph-avatar">${initials(item.label)}</span>
          <span class="ph-name">${prettify(item.label)}</span>
        </div>`;
      const img = tile.querySelector("img");
      img.onload = () => tile.classList.add("has-img");
      if (item.src) img.src = item.src;
      tile.addEventListener("click", () => {
        const on = tile.classList.toggle("selected");
        if (on && tile.dataset.gif) showGif(tile.dataset.gif);
      });
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
    // both Xaden AND Violet (two different thunder characters) selected => storm
    const thunderPicked = new Set(
      selected.filter(t => t.dataset.effect === "thunder").map(t => t.dataset.label)
    );
    if (thunderPicked.size >= 2) {
      triggerThunder();
      fail("Xaden AND Violet?! You summoned a whole storm. Both fictional, both taken — by each other. Pick me ⚡⚡");
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
 
  // shuffle button: re-pick a fresh random set of 9 (clears selection + message)
  const refreshBtn = document.getElementById("cap-refresh");
  if (refreshBtn) refreshBtn.addEventListener("click", render);
 
  render();
}
 
/* =====================================================================
   SCREEN 3 — LOGIN MODULE
   ---------------------------------------------------------------------
   ✏️  EDIT ZONE:
   - LOGIN_USERS: accepted usernames (case-insensitive).
   - LOGIN_PASSWORDS: accepted passwords = your official date.
     All inputs are normalized (lowercased, spaces/punctuation removed),
     so "11/09/2025", "11-9-2025", "11092025" all match. Add/remove forms
     here to control exactly what counts as correct.
   ===================================================================== */
const LOGIN_USERS = ["caramelo", "caramelito"];
const LOGIN_PASSWORDS = [
  "11092025", "1192025",       // MM/DD/YYYY  (11/09 and 11/9)
  "09112025", "9112025",       // DD/MM/YYYY  (just in case she thinks day-first)
  "nov92025", "november92025", // word forms
  "11/9/2025", "11/9/2025", // DD/MM/YYYY  (just in case she thinks month-first)
  "11/09/2025", "11/09/2025", // DD/MM/YYYY  (just in case she thinks month-first with day 09)
  "09/11/2025", "09/11/2025",       // DD/MM/YYYY  (just in case she thinks day-first)
  "9/11/2025", "9/11/2025",       // DD/MM/YYYY  (just in case she thinks day-first with out 09)
];
 
// Silly wrong-password errors (shown in order, then sticks on the last one)
const LOGIN_ERRORS = [
  "ERROR 404 — boyfriend feelings not found. Try again 💔",
  "ERROR 403 — access denied: too cute to let in this easily 😌",
  "ERROR 418 — I'm a teapot, and that's still wrong ☕",
  "ERROR 401 — unauthorized. Think about the day everything changed 💕",
  "ERROR 429 — too many attempts. Just kidding, keep going mi vida.",
];
 
function focusLoginPass() {
  const el = document.getElementById("login-pass");
  if (el) el.focus();
}
 
function initLogin() {
  const userEl = document.getElementById("login-user");
  const passEl = document.getElementById("login-pass");
  const btn    = document.getElementById("login-btn");
  const msg    = document.getElementById("login-msg");
  const hint   = document.getElementById("login-hint");
  let tries = 0;
 
  const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const show = (text, cls) => { msg.textContent = text; msg.className = "login-msg " + cls; };
 
  function submit() {
    const u = norm(userEl.value);
    const p = norm(passEl.value);
 
    if (!p) {
      show("ERROR 400 — a relationship requires *some* effort. Type something 😌", "bad");
      return;
    }
    if (!LOGIN_USERS.includes(u)) {
      show("ERROR 404 — user not found. Your are my GF but only she knows her nickname 🤔", "bad");
      return;
    }
    if (!LOGIN_PASSWORDS.includes(p)) {
      show(LOGIN_ERRORS[Math.min(tries, LOGIN_ERRORS.length - 1)], "bad");
      tries++;
      if (tries === 2) hint.textContent = "💡 Hint: the day we made it official 💕 (MM/DD/YYYY)";
      return;
    }
    // success
    show("✅ ACCESS GRANTED — welcome back 💖", "ok");
    btn.disabled = true;
    passEl.disabled = true;
    userEl.disabled = true;
    setTimeout(nextScreen, 1300);
  }
 
  btn.addEventListener("click", submit);
  userEl.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  passEl.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
}
 
/* =====================================================================
   SCREEN 4 — LETTER (renewal finale)
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