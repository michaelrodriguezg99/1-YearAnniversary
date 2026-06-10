// ✏️ Fill these in. I can't reproduce song lyrics, so paste the `line` yourself.
const DUET = {
  line: `Baby, qué afrenta'
Tú quieres con do' y no sé si va' a aguantar (Ey)`,
  song:   "Party",
  artist: "Rauw Alejandro & Bad Bunny",
};
/* =====================================================================
   GIF DURATION (shared) — so reaction-gif popups stay up until the gif
   actually finishes a loop, instead of a fixed timer cutting it short.
   Reads the file's frame delays directly; caches the result per file.
   If the gif can't be fetched (e.g. opened as a local file:// in some
   browsers), the caller keeps its fallback duration.
   ===================================================================== */
const GIF_MIN_MS = 1800;    // never flash by faster than this
const GIF_MAX_MS = 12000;   // safety cap for very long gifs
const _gifDurCache = {};
 
function _parseGifMs(buf) {
  const b = new Uint8Array(buf);
  if (b.length < 13 || b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) return 0; // "GIF"
  let ms = 0, i = 13;
  if (b[10] & 0x80) i += 3 * (1 << ((b[10] & 7) + 1));          // skip global color table
  while (i < b.length) {
    const k = b[i];
    if (k === 0x21) {                       // extension block
      if (b[i + 1] === 0xF9) {              // graphic control ext -> frame delay
        let d = (b[i + 4] | (b[i + 5] << 8)); // delay stored in 1/100 s (centiseconds)
        if (d < 2) d = 10;                   // browsers render 0/1-delay frames at ~100ms
        ms += d * 10;
      }
      i += 2;
      while (i < b.length && b[i] !== 0) i += b[i] + 1;          // skip sub-blocks
      i++;
    } else if (k === 0x2C) {                // image descriptor
      const lp = b[i + 9];
      i += 10;
      if (lp & 0x80) i += 3 * (1 << ((lp & 7) + 1));            // skip local color table
      i++;                                   // LZW min code size
      while (i < b.length && b[i] !== 0) i += b[i] + 1;
      i++;
    } else if (k === 0x3B) break;           // trailer
    else i++;
  }
  return ms;
}
 
// Measures `src` and calls onMeasured(ms) with a sensible "show this long"
// duration. Plays at least one full loop (more if the loop is very short),
// capped by GIF_MAX_MS. Never calls back if the file can't be fetched.
function measureGif(src, onMeasured) {
  if (_gifDurCache[src] != null) { onMeasured(_gifDurCache[src]); return; }
  fetch(src)
    .then(r => r.arrayBuffer())
    .then(buf => {
      const loop = _parseGifMs(buf);
      let total = 2600;
      if (loop > 0) {
        const loops = Math.max(1, Math.ceil(GIF_MIN_MS / loop)); // whole loops only
        total = Math.min(loops * loop, GIF_MAX_MS) + 150;
      }
      _gifDurCache[src] = total;
      onMeasured(total);
    })
    .catch(() => { /* leave the caller's fallback timer in place */ });
}
 
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
  { id: "quiz-screen",     init: initQuiz },
  // future modules (wrapped, scrapbook...) slot in HERE
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
  { src: "me1.jpeg", label: "Michael", correct: true },
  { src: "me2.jpeg", label: "Michael", correct: true },
  { src: "me3.jpeg", label: "Michael", correct: true },
 
  // ----- Book boyfriends / celebrity crushes / decoys (each picked => its own funny error) -----
  // Any entry with  effect: "thunder"  joins the lightning storm when
  // two different thunder picks are selected together.
  // Any entry with  gif: "file.gif"  pops that gif up when the tile is picked.
  { src: "MikeBefore.jpg", label: "Mike",
    caption: "NOW he's your boyfriend?!?! 😭 That's me BEFORE I met you. Rude." },
  { src: "rhysand.jpg", label: "Rhysand",
    caption: "Rhysand? He lives in a book, mi amor. I live in your kitchen eating your snacks." },
  { src: "xaden.jpg", label: "Xaden", effect: "thunder",
    caption: "Xaden Riorson?? He'd literally let you fall to prove a point. I'd catch you AND carry your bag. ⚡" },
  { src: "violet.jpg", label: "Violet", effect: "thunder",
    caption: "Violet Sorrengail — elite taste, but she's (a) taken by Xaden and (b) made of paper. Pick me ⚡" },
  { src: "BadBunny.jpg", label: "BadBunny", gif: "BadBunny.gif",
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
  { src: "Cherry.jpg", label: "Cherry", effect: "thunder", gif: "Cherry.gif",
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
  { src: "HitachiinTwins.jpg", label: "HitachiinTwins", effect: "thunder", gif: "HitachiinTwins.gif",
    caption: "The Hitachiin twins are a 2-for-1 cartoon deal. You already have your favorite duo: us 👯⚡" },
  { src: "Tamaki.jpg", label: "Tamaki", effect: "thunder",
    caption: "Tamaki would spin you through a rose garden, then trip over himself. Charming, but fictional 🌹⚡" },
  { src: "Kovu.jpg", label: "Kovu", gif: "Kovu.gif",
    caption: "Rawr — he's feisty today and doesn't seem to want you. But I do 🙂🦁" },
  { src: "Neytiri.jpg", label: "Neytiri",
    caption: "Neytiri is a 10-foot blue warrior who'll put an arrow in you for standing too close. I just hand you the remote 🏹💙" },
  { src: "JakeSully.jpg", label: "JakeSully",
    caption: "Jake Sully had to download into a whole new body to get the girl. I'm already in the right one, mi amor 💙" },
  { src: "Varang.jpg", label: "Varang",
    caption: "Varang runs an entire fire clan and would torch the place to make a point. I just light candles for date night 🔥💙" },
  { src: "Lola.jpg", label: "Lola", swim: true,
    caption: "Lola swims off the second the money dries up. I'm broke AND loyal — way better deal 🐟" },
  { src: "LenaLuthor.jpg", label: "LenaLuthor",
    caption: "Lena Luthor: genius billionaire with a last name that screams trust issues. I'm a simple man with zero evil lairs 🦸" },
  { src: "LoveQuinn.jpg", label: "LoveQuinn",
    caption: "Love Quinn is devoted… to a concerning, body-count kind of degree. I'm devoted AND legally free 🔪❤️" },
  { src: "RheaRipley.jpg", label: "RheaRipley", gif: "RheaRipley.gif",
    caption: "Rhea Ripley would suplex me for looking at you wrong. Massive respect — but she's on TV, I'm on your couch 💪" },
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
    img.classList.remove("cropped-allie");
    if (src.includes("AllieAndDean.gif")) {
      img.classList.add("cropped-allie");
    }
    // hide the previous gif's last frame until the new one has loaded
    img.style.visibility = "hidden";
    img.onload = () => { img.style.visibility = "visible"; };
    img.removeAttribute("src");
    img.src = src;
    gifPop.classList.add("show");
    // start with a fallback, then extend to the gif's real length once measured
    clearTimeout(gifTimer);
    gifTimer = setTimeout(() => gifPop.classList.remove("show"), 2600);
    measureGif(src, (ms) => {
      clearTimeout(gifTimer);
      gifTimer = setTimeout(() => gifPop.classList.remove("show"), ms);
    });
  }
 
  // ----- Swim-across effect (an image glides over the screen with a bob) -----
  let swimLayer = document.querySelector(".swim-layer");
  if (!swimLayer) {
    swimLayer = document.createElement("div");
    swimLayer.className = "swim-layer";
    document.body.appendChild(swimLayer);
  }
  function swimAcross(src) {
    const fish = document.createElement("img");
    fish.className = "swim-fish";
    fish.src = src;
    swimLayer.appendChild(fish);
    const vw = window.innerWidth;
    fish.style.top = (15 + Math.random() * 45) + "vh";   // random lane each time
    const anim = fish.animate([
      { transform: `translateX(${vw + 240}px) rotate(-87deg)` },
      { transform: `translateX(${vw * 0.6}px) translateY(-18px) rotate(-94deg)`, offset: 0.35 },
      { transform: `translateX(${vw * 0.35}px) translateY(16px) rotate(-86deg)`, offset: 0.65 },
      { transform: `translateX(-280px) translateY(0) rotate(-93deg)` }
    ], { duration: 3400, easing: "linear" });
    anim.onfinish = () => fish.remove();
  }
 
  // ----- Lyric flash (e.g. the Rauw × Bad Bunny duet line) -----
  let lyricBox = document.querySelector(".lyric-pop");
  if (!lyricBox) {
    lyricBox = document.createElement("div");
    lyricBox.className = "lyric-pop";
    lyricBox.innerHTML = '<div class="lyric-card"><span class="lyric-note">🎵</span>' +
      '<span class="lyric-text"></span><span class="lyric-meta"></span></div>';
    document.body.appendChild(lyricBox);
  }
  let lyricTimer;
  function showLyric(duet) {
    lyricBox.querySelector(".lyric-text").textContent = duet.line || "";
    lyricBox.querySelector(".lyric-meta").textContent =
      [duet.song, duet.artist].filter(Boolean).join(" — ");
    lyricBox.classList.add("show");
    clearTimeout(lyricTimer);
    lyricTimer = setTimeout(() => lyricBox.classList.remove("show"), 4200);
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
      tile.title = prettify(item.label || "");
      tile.dataset.correct = item.correct ? "true" : "false";
      if (item.caption) tile.dataset.caption = item.caption;
      if (item.effect)  tile.dataset.effect  = item.effect;
      if (item.label)   tile.dataset.label   = item.label;
      if (item.gif)     tile.dataset.gif      = item.gif;
      if (item.swim)    tile.dataset.swim     = (item.swim === true ? item.src : item.swim);
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
        if (on && tile.dataset.gif)  showGif(tile.dataset.gif);
        if (on && tile.dataset.swim) swimAcross(tile.dataset.swim);
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
    // Allie + Dean (and ONLY those two) selected => their couple gif
    const picked = selected.map(t => t.dataset.label);
    if (picked.length === 2 && picked.includes("Allie") && picked.includes("Dean")) {
      showGif("AllieAndDean.gif");
      fail("Allie AND Dean? They're endgame with each OTHER (read The Score 😉). Hands off — pick me 💛");
      return;
    }
    // Rauw Alejandro + Bad Bunny (and ONLY those two) => flash the duet line
    if (picked.length === 2 && picked.includes("RauwAlejandro") && picked.includes("BadBunny")) {
      showLyric(DUET);
      fail("A whole duet?? 🎶 Iconic taste — but they don't know your name. I do 🎤");
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
 
// Wrong-date errors escalate in drama; the LAST one is the final warning.
// One more wrong answer AFTER the warning resets (reloads) the whole page.
const LOGIN_ERRORS = [
  "ERROR 404 — boyfriend feelings not found. Try again 💔",
  "ERROR 403 — wrong again. The system is… mildly concerned 😕",
  "ERROR 401 — seriously? Do you even remember me 🥲",
  "ERROR 500 — CRITICAL: the relationship server is sweating. This is THE date 😰",
  "⚠️ FINAL WARNING — one more wrong answer and I wipe this ENTIRE thing and start over 💣",
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
  const win    = document.querySelector("#login-screen .win");
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
      // already got the FINAL WARNING and STILL wrong -> wipe the page
      if (tries >= LOGIN_ERRORS.length) {
        show("💥 SYSTEM WIPED. Starting over…", "bad");
        passEl.disabled = true; btn.disabled = true;
        win.classList.add("shake");
        setTimeout(() => location.reload(), 1500);
        return;
      }
      show(LOGIN_ERRORS[tries], "bad");
      win.classList.remove("shake"); void win.offsetWidth; win.classList.add("shake");
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
   SCREEN 4 — QUIZ MODULE  (photo multiple-choice, pick one, random order)
   ---------------------------------------------------------------------
   ✏️  EDIT ZONE — set the photos + the correct answers.
   - Each question shows its options in RANDOM order.
   - Mark the right answer(s) with  correct: true.
   - Use  src: "file.jpg"  for a photo, or  emoji: "🍒"  for an emoji tile.
   - Until a photo file exists, the option shows its label so you can test.
   Special flags:
   - vanish: true        -> picking it makes that tile disappear (Q: the door)
   - deny: {...} on a Q   -> the correct pick is denied a few times, then admits
   ===================================================================== */
const QUIZ = [
  // Q1 — favorite Spider-Man  (TODO: set which one is correct + photo files)
  {
    prompt: "Who is my favorite Spider-Man?",
    right: "Obviously. Iconic taste 🕷️",
    wrong: "Nope — wrong Spidey. Swing again 🕸️",
    options: [
      { src: "Toby.jpg",   label: "Toby" },
      { src: "Andrew.jpg", label: "Andrew", correct: true },
      { src: "Tom.jpg",    label: "Tom" },
      { src: "Miles.jpg",  label: "Miles" },
    ],
  },
 
  // Q2 — first date (correct = Calle Cerra; TODO: photos + the 3 decoy spots)
  {
    prompt: "Where was our first date?",
    right: "The bowling alley 🎳 Where it all started ❤️",
    wrong: "Nope — that's not where it began 😌",
    options: [
      { src: "Bowling.jpg",   label: "Bowling", correct: true },
      { src: "SkyDiving.jpg", label: "SkyDiving" },
      { src: "Drinking.jpg",  label: "Drinking" },
      { src: "Picnic.jpg",    label: "Picnic" },
    ],
  },
 
  // Q3 — the fruit inside joke  (TODO: which berry is correct?)
  {
    prompt: "Pick the right one 😏 (you know which)",
    right: "Hahaha yes. That one 🍒",
    wrong: "Wrong berry, amor 🫐",
    options: [
      { emoji: "🍒", label: "Cherry", correct: true },
      { emoji: "🍓", label: "Strawberry" },
      { emoji: "🫐", label: "Blueberry" },
      { emoji: "🍇", label: "Raspberry" },
    ],
  },
 
  // Q4 — the item Mike hides  (TODO: the item + photos + decoys)
  {
    prompt: "What does Mike hide for you to always find?",
    right: "Always. Every time 🥹",
    wrong: "Nope — keep looking 👀",
    options: [
      { src: "Photo.jpg",      label: "Photo", correct: true },
      { src: "Coin.jpg",       label: "Coin" },
      { src: "Flower.jpg",     label: "Flower" },
      { src: "LoveLetter.jpg", label: "LoveLetter" },
    ],
  },
 
  // Q5 — the door (her photo vanishes if picked; the 3 of YOU remain)
  {
    prompt: "Who should open the door… always?",
    right: "Correct. I've always got the door 💪",
    wrong: "Try again 😏",
    options: [
      { src: "me1.jpeg", label: "Michael", correct: true },
      { src: "me2.jpeg", label: "Michael", correct: true },
      { src: "me3.jpeg", label: "Michael", correct: true },
      { src: "her.jpeg", label: "You", vanish: true,
        vanishGif: "CardTrick.gif",
        vanishMsg: "✨ Poof! Nice try — door duty is mine 🎩" },
    ],
  },
 
  // Q6 — "Te quiero" first (pick HIM 3 times; then he dramatically admits it)
  {
    prompt: 'Who said "Te quiero" first?',
    wrong: "Wrong — and you KNOW that's wrong 👀",
    deny: {
      msgs: [
        "Pfft. No. Definitely wasn't me 😏",
        "Still wasn't me. You positive? 😼",
      ],
      gif: "MikeFine.gif",   // TODO: a gif of you reacting
      finalMsg: "…UGHHH. FINE. It was me. Happy now?? 🙄💕",
    },
    options: [
      { src: "me1.jpeg", label: "Michael", correct: true },
      { src: "her.jpeg", label: "You" },
      { emoji: "🐱", label: "Cameo" },
      { emoji: "🤝", label: "It was mutual" },
    ],
  },
];
 
function initQuiz() {
  const counterEl = document.getElementById("quiz-counter");
  const promptEl  = document.getElementById("quiz-prompt");
  const grid      = document.getElementById("quiz-grid");
  const msgEl     = document.getElementById("quiz-msg");
  const win       = document.querySelector("#quiz-screen .win");
 
  // reuse the shared reaction-gif overlay (created by the captcha module) or make one
  let gifPop = document.querySelector(".gif-pop");
  if (!gifPop) {
    gifPop = document.createElement("div");
    gifPop.className = "gif-pop";
    gifPop.innerHTML = '<img alt="">';
    document.body.appendChild(gifPop);
  }
  function popGif(src, minMs) {
    const img = gifPop.querySelector("img");
    img.classList.remove("cropped-allie");
    img.style.visibility = "hidden";
    img.onload = () => { img.style.visibility = "visible"; };
    img.removeAttribute("src");
    img.src = src;
    gifPop.classList.add("show");
    let gTimer = setTimeout(() => gifPop.classList.remove("show"), minMs || 2600);
    measureGif(src, (ms) => {
      const dur = Math.max(ms, minMs || 0); // passed value acts as a floor
      clearTimeout(gTimer);
      gTimer = setTimeout(() => gifPop.classList.remove("show"), dur);
    });
  }
 
  const shuffle  = a => a.slice().sort(() => Math.random() - 0.5);
  const prettify = s => (s || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();
  const setMsg   = (text, cls) => { msgEl.textContent = text; msgEl.className = "quiz-msg " + (cls || ""); };
  const shake    = () => { win.classList.remove("shake"); void win.offsetWidth; win.classList.add("shake"); };
 
  let qIndex = 0;
  let denyCount = 0;
 
  function advance() {
    qIndex++;
    denyCount = 0;
    if (qIndex >= QUIZ.length) { nextScreen(); return; }
    render();
  }
 
  function render() {
    const q = QUIZ[qIndex];
    counterEl.textContent = `Question ${qIndex + 1} of ${QUIZ.length}`;
    promptEl.textContent = q.prompt;
    setMsg("", "");
    grid.innerHTML = "";
    shuffle(q.options).forEach(opt => {
      const tile = document.createElement("button");
      tile.className = "quiz-tile";
      if (opt.emoji) {
        tile.innerHTML = `<span class="quiz-emoji">${opt.emoji}</span><span class="quiz-elabel">${opt.label || ""}</span>`;
      } else {
        tile.innerHTML = `<img alt=""><span class="quiz-ph">${prettify(opt.label)}</span>`;
        const img = tile.querySelector("img");
        img.onload = () => tile.classList.add("has-img");
        if (opt.src) img.src = opt.src;
      }
      tile.addEventListener("click", () => handlePick(q, opt, tile));
      grid.appendChild(tile);
    });
  }
 
  function handlePick(q, opt, tile) {
    // vanishing option (the door question): spiral away, then a card-trick gif
    if (opt.vanish) {
      setMsg(opt.vanishMsg || "Nope 💨", "bad");
      const a = tile.animate([
        { transform: "rotate(0deg) scale(1)",  opacity: 1 },
        { transform: "rotate(720deg) scale(0)", opacity: 0 }
      ], { duration: 1400, easing: "ease-in", fill: "forwards" });
      a.onfinish = () => {
        tile.remove();
        if (opt.vanishGif) popGif(opt.vanishGif, 2800);
      };
      return;
    }
    // denial question: the correct pick is denied a few times, then admitted
    if (q.deny && opt.correct) {
      const msgs = q.deny.msgs || [];
      if (denyCount < msgs.length) {
        setMsg(msgs[denyCount], "bad");
        shake();
        denyCount++;
        return;
      }
      if (q.deny.gif) popGif(q.deny.gif, 2600);
      setMsg(q.deny.finalMsg || "Fine. It was me.", "ok");
      [...grid.children].forEach(t => t.disabled = true);
      setTimeout(advance, 2600);
      return;
    }
    // standard correct
    if (opt.correct) {
      setMsg(q.right || "Correct! 💖", "ok");
      [...grid.children].forEach(t => t.disabled = true);
      setTimeout(advance, 1100);
      return;
    }
    // wrong
    setMsg(q.wrong || "Nope, try again 😌", "bad");
    shake();
  }
 
  render();
}
 
/* =====================================================================
   SCREEN 5 — LETTER (renewal finale)
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
