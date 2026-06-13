// ✏️ Fill these in. I can't reproduce song lyrics, so paste the `line` yourself.
const DUET = {
  line: `Baby, qué afrenta'
Tú quieres con do' y no sé si va' a aguantar (Ey)
Tanto asiento que hay
Y encima de mi bicho e' que te quiere' sentar
Te tengo el toto sentimental, uh
El panty moja'o
La nota en alta, no me ha baja'o
Dice que está soltera y todavía no se ha deja'o
Y que se atreve con Benito y con Rauw, jeje`,
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
const GIF_MIN_MS = 1800;    // floor so a very short gif doesn't just flash by
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
   FALLING-IMAGE "CONFETTI" (shared) — rains photos/icons down BEHIND the
   gif popup. Replace the filenames in CONFETTI_IMAGES with your own images
   (hearts, faces, little photos, whatever). Call rainImages() to trigger.
     rainImages();                         // uses CONFETTI_IMAGES defaults
     rainImages(["a.jpg","b.jpg"]);        // custom images for this burst
     rainImages(null, { count: 40, duration: 4000 });
   ===================================================================== */
const CONFETTI_IMAGES = ["confetti1.jpg", "confetti2.jpg", "confetti3.jpg"]; // <- swap these
 
function rainImages(images, opts) {
  opts = opts || {};
  const list = (images && images.length) ? images : CONFETTI_IMAGES;
  if (!list.length) return;
 
  // spawns the actual falling confetti
  function spawn() {
    const count = opts.count || 28;
    const base  = opts.duration || 3200; // ms for a piece to fall
    const layer = document.createElement("div");
    layer.className = "img-rain";
    if (opts.z != null) layer.style.zIndex = opts.z;
    document.body.appendChild(layer);
 
    let maxEnd = 0;
    for (let i = 0; i < count; i++) {
      const drop = document.createElement("div");
      drop.className = "drop";
      const img = document.createElement("img");
      img.src = list[i % list.length];
      const size    = 26 + Math.random() * 42;             // 26–68px
      const delay   = Math.random() * 800;                 // staggered entry
      const fall    = base * (0.8 + Math.random() * 0.6);  // varied fall speed
      const rot     = (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 540);
      const sway    = 10 + Math.random() * 16;             // px wiper amplitude
      const swayDur = 800 + Math.random() * 800;           // ms per swing
      drop.style.left = (Math.random() * 100) + "%";
      drop.style.setProperty("--dur", fall + "ms");
      drop.style.setProperty("--rot", rot + "deg");
      drop.style.animationDelay = delay + "ms";
      img.style.setProperty("--sz",   size + "px");
      img.style.setProperty("--sway", sway + "px");
      img.style.setProperty("--sway-dur", swayDur + "ms");
      img.style.animationDelay = "-" + (Math.random() * swayDur) + "ms"; // desync the wiper phase
      drop.appendChild(img);
      layer.appendChild(drop);
      maxEnd = Math.max(maxEnd, delay + fall);
    }
    setTimeout(() => layer.remove(), maxEnd + 250);
  }
 
  // no reveal: just rain (then optional gif). Used for multi-icon showers.
  if (opts.preview === false) {
    spawn();
    if (typeof opts.onPop === "function") opts.onPop();
    return;
  }
 
  // reveal: image appears, grows, POPS -> confetti -> (optional) gif after
  const grow = opts.previewMs || 1000;
  const prev = document.createElement("div");
  prev.className = "rain-preview";
  prev.style.setProperty("--grow", grow + "ms");
  const pimg = document.createElement("img");
  pimg.src = list[0];
  prev.appendChild(pimg);
  document.body.appendChild(prev);
 
  setTimeout(() => prev.classList.add("pop"), grow);        // start the pop
  setTimeout(() => {                                        // pop finished
    prev.remove();
    spawn();                                                // confetti bursts out
    if (typeof opts.onPop === "function") setTimeout(opts.onPop, 120); // gif AFTER
  }, grow + 340);
}
 
/* =====================================================================
   SOUND (shared) — play an audio file on tap. Works for any screen.
   HOW TO USE:
     1) Drop an audio file (.mp3 / .m4a / .ogg / .wav) next to index.html.
     2) Add  sound: "yourfile.mp3"  to a CAPTCHA_POOL entry (or call
        playSound("yourfile.mp3") from anywhere). It plays when tapped.
   Because it fires on a tap (a user gesture), browser autoplay rules are
   satisfied. A gif itself can't carry audio, so pair gif + sound on the
   same entry and they trigger together.
   ===================================================================== */
const _audioCache = {};
function playSound(src, volume) {
  if (!src) return;
  try {
    let a = _audioCache[src];
    if (!a) { a = new Audio(src); _audioCache[src] = a; }
    a.pause();
    a.currentTime = 0;
    a.volume = (volume == null ? 1 : volume);
    const p = a.play();
    if (p && p.catch) p.catch(() => {});   // ignore "interrupted"/blocked errors
  } catch (e) { /* audio unavailable */ }
}
// Stop a sound early (with a quick fade so it doesn't click). Used to make a
// clip last exactly as long as the animation it's paired with.
function stopSound(src) {
  const a = _audioCache[src];
  if (!a || a.paused) return;
  try {
    const v0 = a.volume, steps = 5; let i = 0;
    const iv = setInterval(() => {
      i++;
      a.volume = Math.max(0, v0 * (1 - i / steps));
      if (i >= steps) { clearInterval(iv); a.pause(); a.currentTime = 0; a.volume = v0; }
    }, 35);
  } catch (e) { /* ignore */ }
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
  { id: "wrapped-screen",  init: initWrapped, onShow: showWrapped },
  { id: "scrapbook-screen", init: initScrapbook, onShow: showScrapbook },
  { id: "terms-screen",    init: initTerms, onShow: showTerms },
  { id: "date-screen",     init: initDatePicker, onShow: showDatePicker },
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
  { src: "me1.jpeg", label: "Michael", correct: true, sound: "love_me.mp3" },
  { src: "me2.jpeg", label: "Michael", correct: true, sound: "love_me.mp3" },
  { src: "me3.jpeg", label: "Michael", correct: true, sound: "love_me.mp3" },
 
  // ----- Book boyfriends / celebrity crushes / decoys (each picked => its own funny error) -----
  // Any entry with  effect: "thunder"  joins the lightning storm when
  // two different thunder picks are selected together.
  // Any entry with  gif: "file.gif"  pops that gif up when the tile is picked.
  { src: "MikeBefore.jpg", label: "Mike",
    caption: "NOW he's your boyfriend?!?! 😭 That's me BEFORE I met you." },
  { src: "rhysand.jpg", label: "Rhysand", fx: "night",
    caption: "Rhysand? He is literaly head over heels for Feyre, so I don't see this working." },
  { src: "Feyre.jpg", label: "Feyre", fx: "magic",
    caption: "Feyre? She is literaly head over heels for Rhysand, so I don't see this working." },
  { src: "xaden.jpg", label: "Xaden", effect: "thunder", power: "shadow",
    caption: "Xaden Riorson?? He'd literally let you fall to prove a point. I'd catch you AND carry your bag." },
  { src: "violet.jpg", label: "Violet", effect: "thunder", power: "timestop",
    caption: "Violet Sorrengail — elite taste, but she's (a) taken by Xaden and (b) made of paper." },
  { src: "BadBunny.jpg", label: "BadBunny", gif: "BadBunny.gif", sound: "BadBunny.mp3",
    caption: "Yo no me quiero casaL. Lalalalalalala -Badbo" },
  { src: "BabyMiko.jpg", label: "BabyMiko", gif: "BabyMiko.gif", sound: "BabyMiko.mp3",
    caption: "Yo si te puedo tener de Tamagotchi 🕹️ (Si no me crees verificalo)" },
  { src: "Garrett.jpg", label: "Garrett", fx: "hockey",
    caption: "Garrett Graham had to bribe a girl into a fake-dating deal just to get a date. I didn't need a deal — you said yes for real 🏒" },
  { src: "Allie.jpg", label: "Allie", fx: "stage", gif: "AllieHayes.gif",
    caption: "Allie Hayes or JLO? 🤔" },
  { src: "Dean.jpg", label: "Dean", fx: "charm", gif: "Dean.gif",
    caption: "Quote: 1) Stupid Dean & his stipid awesome dick. -random bathroom girl 2) We don't actually need him -second random batroom girl" },
      { src: "Hannah.jpg", label: "Hannah", gif: "Hannah.gif", power: "music",
    caption: "I also have big boobs 👀" },
  { src: "AlastorDemon.jpg", label: "AlastorDemon", effect: "radio",
    caption: "Crazy even as a human 😭" },
  { src: "AlastorHuman.jpg", label: "AlastorHuman", effect: "blood",
    caption: "I'm not afraid of a little blood either 😈" },
  { src: "Cherry.jpg", label: "Cherry", fx: "cherry",
    caption: "Te estoy velando graciosa 👀, at least she's not a friend lol." },
  { src: "RauwAlejandro.jpg", label: "RauwAlejandro", worm: true,
    caption: "De verdad quieres que vaya a tu casa a hacerte el gusano ese?" },
  { src: "TaylorSwift.jpg", label: "TaylorSwift",
    caption: "Do you wanna get swifted? 💀" },
  { src: "Anthony.jpg", label: "Anthony", fx: "bees",
    caption: "Anthony Bridgerton: brooding, emotionally constipated." },
  { src: "Benedict.jpg", label: "Benedict", fx: "paint",
    caption: "His mistress?! Really?!" },
  { src: "Colin.jpg", label: "Colin", fx: "ink",
    caption: "Colin took eight seasons to notice the girl right in front of him. I noticed you instantly 😌" },
  { src: "HitachiinTwins.jpg", label: "HitachiinTwins", fx: "roses", gif: "HitachiinTwins.gif",
    caption: "I... have no words..." },
  { src: "Tamaki.jpg", label: "Tamaki", fx: "roses", gif: "Tamaki.gif",
    caption: "Even Tamaki knows who your daddy is 😏. Now pick him." },
  { src: "Kovu.jpg", label: "Kovu", fx: "pawdust", gif: "Kovu.gif",
    caption: "Rawr — he's feisty today and doesn't seem to want you. But I do 🙂🦁" },
  { src: "Neytiri.jpg", label: "Neytiri", fx: "pandora",
    caption: "Okay I heard you out, but stil. 😭" },
  { src: "JakeSully.jpg", label: "JakeSully", fx: "pandora",
    caption: "Okay I heard you out, but stil. 😭" },
  { src: "Varang.jpg", label: "Varang", fx: "fire",
    caption: "Bitch will literally burn you alive." },
  { src: "Lola.jpg", label: "Lola", swim: true,
    caption: "Lola swims off the second the money dries up. I'm broke AND loyal — way better deal 🐟" },
  { src: "LenaLuthor.jpg", label: "LenaLuthor", fx: "krypton",
    caption: "Lena Luthor: genius billionaire with a last name that screams trust and daddy issues." },
  { src: "LoveQuinn.jpg", label: "LoveQuinn", fx: "knives", gif: "Love.gif",
    caption: "Do you really wanna play with fire like that? 😭🔪" },
  { src: "RheaRipley.jpg", label: "RheaRipley", gif: "RheaRipley.gif",
    caption: "Rhea Ripley would suplex me for looking at you wrong. Massive respect — but id still win 😎" },
  { src: "Chicas.jpg", label: "Chicas", gif: "Chicas.gif",
    caption: "YOU 🫵 said no friends 😡 so no empieces ahora jaja" },
  { src: "Caitlyn.jpg", label: "Caitlyn", fx: "hextech", gif: "Caitlyn.gif",
    caption: "Not bad, but I can do better." },
  { src: "VI.jpg", label: "VI", fx: "impact", gif: "VI.gif",
    caption: "Will literally betray you for her sister everytime 😈" },
  { src: "MegaMind.jpg", label: "MegaMind", fx: "zap", gif: "MegaMind.gif",
    caption: "Big blue head, even bigger ego — and a robot doing all his work. I do my own scheming, all for you!" },
  { src: "Zuko.jpg", label: "Zuko", power: "zukofire", gif: "Zuko.gif",
    caption: "It is really is Zuko 🙃" },
  { src: "Cassian.jpg", label: "Cassian", power: "blades",
    caption: "Cassian — Lord of Bloodshed, 500+ years old, and STILL can't admit his feelings to Nesta. I sorted mine out in a year 😌🗡️" },
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
 
  // ----- Alastor (Radio Demon) powers + Blood overlays (created once) -----
  let alFx = document.querySelector(".alastor-fx");
  if (!alFx) {
    alFx = document.createElement("div");
    alFx.className = "alastor-fx";
    alFx.innerHTML = '<div class="al-vignette"></div><div class="al-static"></div><div class="al-symbols"></div>';
    document.body.appendChild(alFx);
  }
  let bloodFx = document.querySelector(".blood-fx");
  if (!bloodFx) {
    bloodFx = document.createElement("div");
    bloodFx.className = "blood-fx";
    document.body.appendChild(bloodFx);
  }
 
  // ----- Character "powers" engine (themed particle bursts + screen tint) -----
  // A lightweight, data-driven version of the Alastor effect: each book/anime/
  // animated character points at one preset below via  fx: "name"  in the pool.
  // Add a preset here and reference it — no new function needed per character.
  //   mode: "rain" (fall), "rise" (embers up), "burst" (out from center),
  //         "sideBurst" (streak across), "drift" (float + twinkle in place)
  const CHAR_FX = {
    night:   { emojis: ["🌙", "✨", "⭐", "🌟"],            mode: "drift",     tint: "rgba(22,18,64,0.45)",  count: 26 }, // Rhysand — Night Court
    magic:   { emojis: ["✨", "💫", "🌈", "🔮"],            mode: "burst",     tint: "rgba(86,42,128,0.30)", count: 30 }, // Feyre — all-court magic
    hockey:  { emojis: ["🏒", "🥅", "🧊"],                  mode: "sideBurst", tint: "rgba(120,170,210,0.25)", count: 22 }, // Garrett — hockey
    bees:    { emojis: ["🐝", "🌼", "🍯"],                  mode: "drift",     tint: "rgba(220,180,40,0.18)", count: 20 }, // Anthony — the bee
    paint:   { emojis: ["🎨", "🖌️", "🟣", "🔵", "🟡"],      mode: "burst",     tint: "rgba(60,40,90,0.20)",  count: 26 }, // Benedict — the artist
    ink:     { emojis: ["✍️", "📜", "💌", "🪶"],            mode: "rain",      tint: "rgba(70,60,90,0.20)",  count: 22 }, // Colin — the writer
    krypton: { emojis: ["☢️", "💚", "✨"],                  mode: "rise",      tint: "rgba(20,120,40,0.30)", count: 24 }, // Lena Luthor
    pandora: { emojis: ["🌿", "💠", "🍃", "✨"],            mode: "drift",     tint: "rgba(10,60,110,0.40)", count: 28 }, // Neytiri / Jake — Pandora
    fire:    { emojis: ["🔥", "🧡", "✨"],                  mode: "rise",      tint: "rgba(150,40,10,0.32)", count: 30 }, // Varang / Zuko — fire
    stage:   { emojis: ["🎭", "⭐", "✨", "🌟"],            mode: "rain",      tint: "rgba(120,60,140,0.22)", count: 24 }, // Allie — aspiring actress
    charm:   { emojis: ["💫", "💸", "😏", "💛"],            mode: "burst",     tint: "rgba(120,90,30,0.18)", count: 24 }, // Dean — rich playboy
    knives:  { emojis: ["🔪", "🍓", "💔"],                  mode: "rain",      tint: "rgba(120,20,30,0.28)", count: 22 }, // Love Quinn — "You"
    cherry:  { emojis: ["🍒", "❤️", "✨"],                  mode: "rain",      tint: "rgba(170,15,40,0.22)", count: 26 }, // Cherry
    roses:   { emojis: ["🌹", "✨", "💕"],                  mode: "rain",      tint: "rgba(190,60,90,0.18)", count: 26 }, // Tamaki / Twins — Host Club
    pawdust: { emojis: ["🐾", "🍂", "✨"],                  mode: "sideBurst", tint: "rgba(150,110,40,0.22)", count: 22 }, // Kovu — Pride Lands
    hextech: { emojis: ["🔷", "✨", "🎯"],                  mode: "rain",      tint: "rgba(30,90,150,0.28)", count: 24 }, // Caitlyn — Piltover
    impact:  { emojis: ["👊", "💥", "⭐"],                  mode: "burst",     tint: "rgba(150,40,90,0.25)", count: 24 }, // Vi — Zaun brawler
    zap:     { emojis: ["⚡", "🔵", "💠"],                  mode: "burst",     tint: "rgba(30,60,160,0.28)", count: 24 }, // Megamind — tech
  };
 
  let charFx = document.querySelector(".char-fx");
  if (!charFx) {
    charFx = document.createElement("div");
    charFx.className = "char-fx";
    document.body.appendChild(charFx);
  }
 
  function triggerCharFx(name) {
    const cfg = CHAR_FX[name];
    if (!cfg) return;
    if (cfg.tint) {
      charFx.style.setProperty("--tint", cfg.tint);
      charFx.classList.remove("show"); void charFx.offsetWidth; charFx.classList.add("show");
      setTimeout(() => charFx.classList.remove("show"), 2600);
    }
    const vw = window.innerWidth, vh = window.innerHeight;
    const count = cfg.count || 24;
    const emojis = cfg.emojis || ["✨"];
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "char-particle";
      s.textContent = emojis[i % emojis.length];
      s.style.fontSize = (20 + Math.random() * 26) + "px";
      charFx.appendChild(s);
 
      const delay = Math.random() * 700;
      let frames, dur;
 
      if (cfg.mode === "rain") {
        s.style.left = (Math.random() * 100) + "%"; s.style.top = "-8%";
        const dx = Math.random() * 40 - 20, rot = Math.random() * 720 - 360;
        frames = [
          { transform: "translate(0,0) rotate(0deg)", opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { transform: `translate(${dx}px, ${vh * 1.15}px) rotate(${rot}deg)`, opacity: 0.85 },
        ];
        dur = 2200 + Math.random() * 1400;
      } else if (cfg.mode === "rise") {
        s.style.left = (Math.random() * 100) + "%"; s.style.top = "100%";
        const dx = Math.random() * 80 - 40;
        frames = [
          { transform: "translate(0,0) scale(.7)", opacity: 0 },
          { opacity: 1, offset: 0.18 },
          { transform: `translate(${dx}px, ${-vh * 1.1}px) scale(1.1)`, opacity: 0 },
        ];
        dur = 1900 + Math.random() * 1200;
      } else if (cfg.mode === "sideBurst") {
        const fromLeft = Math.random() < 0.5;
        s.style.top = (10 + Math.random() * 80) + "%";
        s.style.left = fromLeft ? "-10%" : "110%";
        const end = fromLeft ? vw * 1.25 : -vw * 1.25;
        frames = [
          { transform: "translate(0,0) rotate(0deg)", opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { transform: `translate(${end}px, ${Math.random() * 80 - 40}px) rotate(${Math.random() * 1080 - 540}deg)`, opacity: 0.9 },
        ];
        dur = 1500 + Math.random() * 1000;
      } else if (cfg.mode === "drift") {
        s.style.left = (5 + Math.random() * 90) + "%";
        s.style.top = (8 + Math.random() * 84) + "%";
        const dx = Math.random() * 60 - 30, dy = Math.random() * 60 - 30;
        frames = [
          { transform: "translate(0,0) scale(.6)", opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { opacity: 1, offset: 0.7 },
          { transform: `translate(${dx}px, ${dy}px) scale(1.15)`, opacity: 0 },
        ];
        dur = 2200 + Math.random() * 800;
      } else { // "burst"
        s.style.left = "50%"; s.style.top = "50%";
        const ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * Math.min(vw, vh) * 0.5;
        frames = [
          { transform: "translate(-50%,-50%) scale(.4)", opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.1) rotate(${Math.random() * 360}deg)`, opacity: 0 },
        ];
        dur = 1400 + Math.random() * 900;
      }
 
      const anim = s.animate(frames, { duration: dur, delay, easing: "ease-out", fill: "forwards" });
      anim.onfinish = () => s.remove();
    }
  }
  // eldritch glyphs (pentagram, radio dial, broadcast waves) drawn as SVG
  const AL_GLYPHS = [
    '<svg viewBox="0 0 100 100"><polygon points="50,5 61,38 95,38 67,59 78,92 50,72 22,92 33,59 5,38 39,38"/></svg>',
    '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><circle cx="50" cy="50" r="26"/><line x1="50" y1="8" x2="50" y2="24"/><line x1="50" y1="50" x2="78" y2="36"/></svg>',
    '<svg viewBox="0 0 100 100"><path d="M50 50 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0"/><path d="M30 50 a20 20 0 0 1 40 0"/><path d="M18 50 a32 32 0 0 1 64 0"/><path d="M6 50 a44 44 0 0 1 88 0"/></svg>',
  ];
 
  function alStatic(dur) {           // synthesized red-radio static + tuning warble
    if (!THUNDER_SOUND) return;
    try {
      const ctx = audioCtx();
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * (1 - t) * 0.5; }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 0.7;
      const g = ctx.createGain(); g.gain.value = 0.16;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 2.4;
      const lfoG = ctx.createGain(); lfoG.gain.value = 700;
      lfo.connect(lfoG); lfoG.connect(bp.frequency);
      src.connect(bp); bp.connect(g); g.connect(ctx.destination);
      lfo.start(); src.start();
      lfo.stop(ctx.currentTime + dur);
    } catch (e) {}
  }
 
  function triggerAlastorPowers() {
    const symbols = alFx.querySelector(".al-symbols");
    symbols.innerHTML = "";
    alFx.classList.remove("show"); void alFx.offsetWidth; alFx.classList.add("show");
    const total = 3000;
    const n = 8;
    for (let k = 0; k < n; k++) {
      setTimeout(() => {
        const s = document.createElement("div");
        s.className = "al-glyph";
        s.innerHTML = AL_GLYPHS[Math.floor(Math.random() * AL_GLYPHS.length)];
        s.style.left = (5 + Math.random() * 90) + "%";
        s.style.top  = (8 + Math.random() * 84) + "%";
        s.style.setProperty("--gsz",  (44 + Math.random() * 80) + "px");
        s.style.setProperty("--grot", (Math.random() * 60 - 30) + "deg");
        symbols.appendChild(s);
        setTimeout(() => s.remove(), 1700);
      }, Math.random() * total);
    }
    alStatic(3.2);
    setTimeout(() => alFx.classList.remove("show"), 3400);
  }
 
  function triggerBlood() {
    bloodFx.innerHTML = "";
    bloodFx.classList.remove("show"); void bloodFx.offsetWidth; bloodFx.classList.add("show");
    for (let k = 0; k < 8; k++) {                 // drips running down from the top
      const drip = document.createElement("div");
      drip.className = "blood-drip";
      drip.style.left = (Math.random() * 96) + "%";
      drip.style.setProperty("--w", (6 + Math.random() * 14) + "px");
      drip.style.setProperty("--h", (28 + Math.random() * 46) + "vh");
      drip.style.animationDelay = (Math.random() * 700) + "ms";
      bloodFx.appendChild(drip);
    }
    for (let k = 0; k < 7; k++) {                 // splatters
      const sp = document.createElement("div");
      sp.className = "blood-splat";
      sp.style.left = (2 + Math.random() * 90) + "%";
      sp.style.top  = (5 + Math.random() * 82) + "%";
      sp.style.setProperty("--ss", (40 + Math.random() * 90) + "px");
      sp.style.animationDelay = (200 + Math.random() * 1300) + "ms";
      bloodFx.appendChild(sp);
    }
    setTimeout(() => bloodFx.classList.remove("show"), 4200);
  }
 
  // ----- Xaden: shadow tendrils creeping in from the edges (his signet) -----
  let shadowFx = document.querySelector(".shadow-fx");
  if (!shadowFx) {
    shadowFx = document.createElement("div");
    shadowFx.className = "shadow-fx";
    document.body.appendChild(shadowFx);
  }
  function triggerShadows() {
    shadowFx.innerHTML = "";
    shadowFx.classList.remove("show"); void shadowFx.offsetWidth; shadowFx.classList.add("show");
    const vw = window.innerWidth, vh = window.innerHeight;
    const edges = ["top", "bottom", "left", "right"];
    for (let k = 0; k < 14; k++) {
      const w = document.createElement("div");
      w.className = "shadow-wisp";
      const edge = edges[k % 4];
      const sz = 160 + Math.random() * 220;
      w.style.width = sz + "px"; w.style.height = sz + "px";
      let sx, sy, ex, ey;
      if (edge === "top")    { sx = Math.random() * vw; sy = -sz; ex = sx + (Math.random() * 200 - 100); ey = vh * (0.3 + Math.random() * 0.4); }
      if (edge === "bottom") { sx = Math.random() * vw; sy = vh + sz; ex = sx + (Math.random() * 200 - 100); ey = vh * (0.3 + Math.random() * 0.4); }
      if (edge === "left")   { sx = -sz; sy = Math.random() * vh; ex = vw * (0.3 + Math.random() * 0.4); ey = sy + (Math.random() * 200 - 100); }
      if (edge === "right")  { sx = vw + sz; sy = Math.random() * vh; ex = vw * (0.3 + Math.random() * 0.4); ey = sy + (Math.random() * 200 - 100); }
      w.style.left = "0"; w.style.top = "0";
      const anim = w.animate([
        { transform: `translate(${sx}px, ${sy}px) scale(.6)`, opacity: 0 },
        { opacity: .85, offset: 0.35 },
        { transform: `translate(${ex}px, ${ey}px) scale(1.5)`, opacity: .7, offset: 0.6 },
        { transform: `translate(${sx}px, ${sy}px) scale(.7)`, opacity: 0 },
      ], { duration: 2200 + Math.random() * 900, delay: Math.random() * 500, easing: "ease-in-out", fill: "forwards" });
      shadowFx.appendChild(w);
      anim.onfinish = () => w.remove();
    }
    // low, dark "whoosh" — filtered noise swelling in and out
    if (THUNDER_SOUND) {
      try {
        const ctx = audioCtx();
        const dur = 1.8, len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          const env = Math.sin(Math.PI * t);          // swell up then fade
          d[i] = (Math.random() * 2 - 1) * env * 0.5;
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
        const now = ctx.currentTime;
        lp.frequency.setValueAtTime(200, now);
        lp.frequency.linearRampToValueAtTime(900, now + 0.7);   // sweep = the "whoosh"
        lp.frequency.linearRampToValueAtTime(150, now + dur);
        const g = ctx.createGain(); g.gain.value = 0.32;
        src.connect(lp); lp.connect(g); g.connect(ctx.destination);
        src.start();
      } catch (e) {}
    }
    setTimeout(() => shadowFx.classList.remove("show"), 2800);
  }
 
  // ----- Violet: Andarna's gift — time grinds to a halt -----
  // Screen desaturates + a shockwave ring freezes, clocks pop and hold,
  // and a tone glides down in pitch like everything is slowing to a stop.
  let timeFx = document.querySelector(".time-fx");
  if (!timeFx) {
    timeFx = document.createElement("div");
    timeFx.className = "time-fx";
    timeFx.innerHTML = '<div class="time-rings"></div><div class="time-clocks"></div>';
    document.body.appendChild(timeFx);
  }
  function triggerTimeStop() {
    const rings  = timeFx.querySelector(".time-rings");
    const clocks = timeFx.querySelector(".time-clocks");
    rings.innerHTML = ""; clocks.innerHTML = "";
    timeFx.classList.remove("show"); void timeFx.offsetWidth; timeFx.classList.add("show");
    // expanding shockwave rings from center
    for (let k = 0; k < 3; k++) {
      const r = document.createElement("div");
      r.className = "time-ring";
      rings.appendChild(r);
      const anim = r.animate([
        { transform: "translate(-50%,-50%) scale(.1)", opacity: .9 },
        { transform: "translate(-50%,-50%) scale(2.4)", opacity: 0 },
      ], { duration: 1500, delay: k * 220, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      anim.onfinish = () => r.remove();
    }
    // clock glyphs that pop in and "freeze" mid-air
    const glyphs = ["⏰", "⏳", "🕰️", "⌛"];
    for (let i = 0; i < 9; i++) {
      const c = document.createElement("span");
      c.className = "time-clock";
      c.textContent = glyphs[i % glyphs.length];
      c.style.left = (8 + Math.random() * 84) + "%";
      c.style.top  = (10 + Math.random() * 78) + "%";
      c.style.fontSize = (24 + Math.random() * 24) + "px";
      const anim = c.animate([
        { transform: "scale(0) rotate(-30deg)", opacity: 0 },
        { transform: "scale(1.1) rotate(0deg)", opacity: 1, offset: 0.25 },
        { transform: "scale(1) rotate(0deg)",   opacity: 1, offset: 0.78 }, // held = frozen
        { transform: "scale(1) rotate(0deg)",   opacity: 0 },
      ], { duration: 2400, delay: Math.random() * 250, easing: "ease-out", fill: "forwards" });
      clocks.appendChild(c);
      anim.onfinish = () => c.remove();
    }
    // pitch-bend "slowing down" tone
    if (THUNDER_SOUND) {
      try {
        const ctx = audioCtx();
        const o = ctx.createOscillator(); o.type = "sine";
        const g = ctx.createGain(); g.gain.value = 0.0001;
        o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime;
        o.frequency.setValueAtTime(520, t);
        o.frequency.exponentialRampToValueAtTime(70, t + 1.1);   // glide down = time slowing
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        o.start(t); o.stop(t + 1.35);
      } catch (e) {}
    }
    setTimeout(() => timeFx.classList.remove("show"), 2600);
  }
 
  // ----- Cassian: Lord of Bloodshed — twin-blade slashes + red Siphon flash -----
  let slashFx = document.querySelector(".slash-fx");
  if (!slashFx) {
    slashFx = document.createElement("div");
    slashFx.className = "slash-fx";
    slashFx.innerHTML = '<div class="slash-flash"></div><div class="slash-lines"></div>';
    document.body.appendChild(slashFx);
  }
  function triggerCassian() {
    const lines = slashFx.querySelector(".slash-lines");
    lines.innerHTML = "";
    slashFx.classList.remove("show"); void slashFx.offsetWidth; slashFx.classList.add("show");
    const n = 7;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div");
      s.className = "slash";
      const angle = (Math.random() < 0.5 ? 1 : -1) * (28 + Math.random() * 24);
      s.style.top  = (8 + Math.random() * 74) + "%";
      s.style.left = (Math.random() * 30 - 15) + "%";
      s.style.setProperty("--ang", angle + "deg");
      lines.appendChild(s);
      const anim = s.animate([
        { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 0, transformOrigin: "left center" },
        { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.35 },
        { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 0 },
      ], { duration: 650 + Math.random() * 350, delay: i * 90 + Math.random() * 80, easing: "ease-out", fill: "forwards" });
      anim.onfinish = () => s.remove();
    }
    // sharp "shing" per slash if audio is on
    if (THUNDER_SOUND) {
      try {
        const ctx = audioCtx();
        for (let i = 0; i < 3; i++) {
          const dur = 0.18, len = Math.floor(ctx.sampleRate * dur);
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let j = 0; j < len; j++) { const t = j / len; d[j] = (Math.random() * 2 - 1) * Math.pow(1 - t, 4); }
          const src = ctx.createBufferSource(); src.buffer = buf;
          const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2600;
          const g = ctx.createGain(); g.gain.value = 0.18;
          src.connect(hp); hp.connect(g); g.connect(ctx.destination);
          src.start(ctx.currentTime + i * 0.12);
        }
      } catch (e) {}
    }
    setTimeout(() => slashFx.classList.remove("show"), 1600);
  }
 
  // ----- Hannah: she's a singer — sound-wave bars + floating notes + glow -----
  let musicFx = document.querySelector(".music-fx");
  if (!musicFx) {
    musicFx = document.createElement("div");
    musicFx.className = "music-fx";
    musicFx.innerHTML = '<div class="music-glow"></div><div class="music-eq"></div><div class="music-notes"></div>';
    document.body.appendChild(musicFx);
  }
  function triggerMusic() {
    const eq    = musicFx.querySelector(".music-eq");
    const notes = musicFx.querySelector(".music-notes");
    eq.innerHTML = ""; notes.innerHTML = "";
    musicFx.classList.remove("show"); void musicFx.offsetWidth; musicFx.classList.add("show");
    // equalizer bars across the bottom
    const bars = 22;
    for (let i = 0; i < bars; i++) {
      const b = document.createElement("div");
      b.className = "music-bar";
      b.style.setProperty("--d", (Math.random() * 0.4).toFixed(2) + "s");
      b.style.setProperty("--h", (30 + Math.random() * 70) + "%");
      eq.appendChild(b);
    }
    // notes floating up
    const glyphs = ["🎵", "🎶", "🎤", "💖"];
    for (let i = 0; i < 18; i++) {
      const note = document.createElement("span");
      note.className = "music-note";
      note.textContent = glyphs[i % glyphs.length];
      note.style.left = (Math.random() * 100) + "%";
      note.style.fontSize = (20 + Math.random() * 22) + "px";
      const dx = Math.random() * 80 - 40;
      const anim = note.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: `translate(${dx}px, ${-window.innerHeight * 0.95}px) rotate(${Math.random() * 80 - 40}deg)`, opacity: 0 },
      ], { duration: 2000 + Math.random() * 1200, delay: Math.random() * 700, easing: "ease-out", fill: "forwards" });
      notes.appendChild(note);
      anim.onfinish = () => note.remove();
    }
    setTimeout(() => musicFx.classList.remove("show"), 2800);
  }
 
  // ----- Zuko: bespoke firebending — flame wall + rising embers + heat flash -----
  let fireFx = document.querySelector(".fire-fx");
  if (!fireFx) {
    fireFx = document.createElement("div");
    fireFx.className = "fire-fx";
    fireFx.innerHTML = '<div class="fire-flash"></div><div class="fire-wall"></div><div class="fire-embers"></div>';
    document.body.appendChild(fireFx);
  }
  function triggerZukoFire() {
    const wall   = fireFx.querySelector(".fire-wall");
    const embers = fireFx.querySelector(".fire-embers");
    wall.innerHTML = ""; embers.innerHTML = "";
    fireFx.classList.remove("show"); void fireFx.offsetWidth; fireFx.classList.add("show");
    // a wall of flickering flame tongues rising from the bottom edge
    const tongues = 26;
    for (let i = 0; i < tongues; i++) {
      const f = document.createElement("div");
      f.className = "flame";
      f.style.left = (i / tongues * 100) + "%";
      f.style.setProperty("--fw", (40 + Math.random() * 60) + "px");
      f.style.setProperty("--fh", (120 + Math.random() * 220) + "px");
      f.style.setProperty("--fd", (0.5 + Math.random() * 0.5).toFixed(2) + "s");
      f.style.animationDelay = "-" + (Math.random() * 0.6).toFixed(2) + "s";
      wall.appendChild(f);
    }
    // embers/sparks drifting upward
    for (let i = 0; i < 34; i++) {
      const e = document.createElement("span");
      e.className = "ember";
      e.style.left = (Math.random() * 100) + "%";
      const sz = 4 + Math.random() * 8;
      e.style.width = sz + "px"; e.style.height = sz + "px";
      const dx = Math.random() * 120 - 60;
      const anim = e.animate([
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${-window.innerHeight * (0.6 + Math.random() * 0.5)}px) scale(.2)`, opacity: 0 },
      ], { duration: 1400 + Math.random() * 1400, delay: Math.random() * 900, easing: "ease-out", fill: "forwards" });
      embers.appendChild(e);
      anim.onfinish = () => e.remove();
    }
    // synthesized fire "whoosh" if audio is on
    if (THUNDER_SOUND) {
      try {
        const ctx = audioCtx();
        const dur = 1.1, len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.5) * 0.4; }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
        const g = ctx.createGain(); g.gain.value = 0.3;
        src.connect(lp); lp.connect(g); g.connect(ctx.destination);
        src.start();
      } catch (e) {}
    }
    setTimeout(() => fireFx.classList.remove("show"), 4200);          // match the blood effect's length
    setTimeout(() => { wall.innerHTML = ""; embers.innerHTML = ""; }, 4900); // stop the looping flames once hidden
  }
 
  // ----- Reaction GIF popup (overlay created once, reused) -----
  let gifPop = document.querySelector(".gif-pop");
  if (!gifPop) {
    gifPop = document.createElement("div");
    gifPop.className = "gif-pop";
    gifPop.innerHTML = '<img alt="">';
    document.body.appendChild(gifPop);
  }
  let gifTimer, gifSound = null;
  function hideGifPop() {
    gifPop.classList.remove("show");
    if (gifSound) { stopSound(gifSound); gifSound = null; }   // sound ends with the gif
  }
  function showGif(src, sound) {
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
    // pair an optional sound: it plays now and is cut when the gif hides
    if (gifSound && gifSound !== sound) stopSound(gifSound);
    gifSound = sound || null;
    if (sound) playSound(sound);
    // start with a fallback, then extend to the gif's real length once measured
    clearTimeout(gifTimer);
    gifTimer = setTimeout(hideGifPop, 2600);
    measureGif(src, (ms) => {
      clearTimeout(gifTimer);
      gifTimer = setTimeout(hideGifPop, ms);
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
 
  // ----- Worm-across effect (an image inches across with a wriggle) -----
  // Reuses the same full-screen .swim-layer. Crawls left -> right low on the
  // screen, alternately scrunching and stretching like an inchworm.
  function wormAcross(src) {
    const worm = document.createElement("img");
    worm.className = "worm-crawl";
    worm.src = src;
    swimLayer.appendChild(worm);
    const vw = window.innerWidth;
    worm.style.top = (55 + Math.random() * 28) + "vh";   // low lane (ground-ish)
    const start = -300, end = vw + 300;
    const frames = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const x = start + (end - start) * p;
      const scrunch = (i % 2 === 0);                       // alternate stretch/scrunch
      const sx = scrunch ? 0.62 : 1.12;                    // squash/stretch along travel
      const sy = scrunch ? 1.22 : 0.9;                     // taller when scrunched
      const y  = Math.sin(p * Math.PI * 7) * 9;            // gentle up/down undulation
      frames.push({ transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})` });
    }
    const anim = worm.animate(frames, { duration: 4200, easing: "linear" });
    anim.onfinish = () => worm.remove();
  }
 
  // ----- BabyMiko Tamagotchi (a tiny pet she pokes for a few seconds) -----
  // Uses tama_console.png as the handheld (the pixel-her is baked into it).
  // Three invisible hotspots sit over the pink buttons. Closes on Enter,
  // and on the "Done" button for phones (which have no keyboard Enter here).
  // TAMA_BTNS positions are % of the device image (520x640): {x, y} centers.
  const TAMA_BTNS = [
    { act: "feed", x: 30.8, y: 79, label: "🍼 Feed" },   // left pink button
    { act: "play", x: 49.6, y: 79, label: "🎮 Play" },   // middle pink button
    { act: "love", x: 66.3, y: 79, label: "💖 Love" },   // right pink button
  ];
  const TAMA_REACT = {
    feed: ["Yum yum 😋", "Quiero bibí 🍼", "Quiero más 🤤", "Gracias Mike 🥹"],
    play: ["Wiii! 🎉", "Otra vez! 🎮", "Jijiji 😄", "Gané esta ronda 😼"],
    love: ["Te quiero 💕", "Mimitos 💖", "Awww 🥰", "Eres el mejor 😚"],
  };
  function launchTamagotchi() {
    const old = document.querySelector(".tama-overlay");
    if (old) old.remove();
 
    const ov = document.createElement("div");
    ov.className = "tama-overlay";
    const btns = TAMA_BTNS.map(b =>
      '<button type="button" class="tama-hot" data-act="' + b.act + '" ' +
      'title="' + b.label.replace(/[^\x20-\x7E]/g, "").trim() + '" ' +
      'style="left:' + b.x + '%;top:' + b.y + '%">' +
        '<span class="tama-tip">' + b.label + '</span>' +
      '</button>'
    ).join("");
    ov.innerHTML =
      '<div class="tama-wrap">' +
        '<div class="tama-bubble" id="tama-bubble">¡Hola! Cuídame 🥺</div>' +
        '<div class="tama-device" id="tama-device">' +
          '<div class="tama-fx" id="tama-fx"></div>' +
          btns +
        '</div>' +
        '<button type="button" class="tama-close" id="tama-close">Done ⏎</button>' +
      '</div>';
    document.body.appendChild(ov);
 
    const device = ov.querySelector("#tama-device");
    const bubble = ov.querySelector("#tama-bubble");
    const fx     = ov.querySelector("#tama-fx");
 
    function react(act) {
      const list = TAMA_REACT[act] || TAMA_REACT.love;
      bubble.textContent = list[Math.floor(Math.random() * list.length)];
      bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop");
      // little hop so the baked-in pet feels alive
      device.classList.remove("hop"); void device.offsetWidth; device.classList.add("hop");
      // float a heart/sparkle up from the screen area
      const e = document.createElement("span");
      e.className = "tama-float";
      e.textContent = act === "play" ? "✨" : (act === "feed" ? "🍪" : "💖");
      e.style.left = (38 + Math.random() * 24) + "%";
      fx.appendChild(e);
      setTimeout(() => e.remove(), 950);
    }
 
    ov.querySelectorAll(".tama-hot").forEach(b => {
      b.addEventListener("click", () => {
        react(b.dataset.act);
        b.classList.add("pressing");                 // show tooltip on touch (no hover on phones)
        clearTimeout(b._tipT);
        b._tipT = setTimeout(() => b.classList.remove("pressing"), 1100);
        b.blur();
      });
    });
 
    function close() {
      document.removeEventListener("keydown", onKey);
      ov.classList.add("closing");
      setTimeout(() => ov.remove(), 200);
    }
    function onKey(e) {
      if (e.key === "Enter") { e.preventDefault(); close(); }
    }
    ov.querySelector("#tama-close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
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
  let lyricTimer, lyricSound = null;
  function hideLyric() {
    lyricBox.classList.remove("show");
    if (lyricSound) { stopSound(lyricSound); lyricSound = null; }   // sound ends with the text
  }
  function showLyric(duet, ms, sound) {
    lyricBox.querySelector(".lyric-text").textContent = duet.line || "";
    lyricBox.querySelector(".lyric-meta").textContent =
      [duet.song, duet.artist].filter(Boolean).join(" — ");
    lyricBox.classList.add("show");
    if (lyricSound && lyricSound !== sound) stopSound(lyricSound);
    lyricSound = sound || null;
    if (sound) playSound(sound);
    clearTimeout(lyricTimer);
    lyricTimer = setTimeout(hideLyric, ms || 4200);
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
      if (item.worm)    tile.dataset.worm     = (item.worm === true ? item.src : item.worm);
      if (item.fx)      tile.dataset.fx       = item.fx;
      if (item.sound)   tile.dataset.sound    = item.sound;
      if (item.power)   tile.dataset.power    = item.power;
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
        if (on) {
          const snd = tile.dataset.sound, gif = tile.dataset.gif;
          // show this tile's caption right away — neutral hint, not an error yet
          if (tile.dataset.caption) {
            msgEl.textContent = tile.dataset.caption;
            msgEl.className = "cap-msg hint";
          } else {
            msgEl.textContent = ""; msgEl.className = "cap-msg";
          }
          if (tile.dataset.label === "Cherry") {
            // reveal her cherry image into falling cherries (gif now lives on the
            // me + Cherry verify combo). The cherry fx adds emoji + tint on top.
            rainImages(["CherryConfetti.jpg"]);
          } else {
            if (gif)               showGif(gif, snd);   // sound lasts as long as the gif
            if (tile.dataset.swim) swimAcross(tile.dataset.swim);
            if (tile.dataset.worm) wormAcross(tile.dataset.worm);
          }
          if (snd && !gif) playSound(snd);   // no animation to match → play it in full
          // per-character background powers
          if (tile.dataset.effect === "radio") triggerAlastorPowers();
          if (tile.dataset.effect === "blood") triggerBlood();
          if (tile.dataset.fx) triggerCharFx(tile.dataset.fx);
          if (tile.dataset.power === "shadow")    triggerShadows();
          if (tile.dataset.power === "timestop")  triggerTimeStop();
          if (tile.dataset.power === "music")     triggerMusic();
          if (tile.dataset.power === "zukofire")  triggerZukoFire();
          if (tile.dataset.power === "blades")    triggerCassian();
        } else {
          // deselected — fall back to another selected tile's caption, or clear
          const other = grid.querySelector(".cap-tile.selected");
          if (other && other.dataset.caption) {
            msgEl.textContent = other.dataset.caption;
            msgEl.className = "cap-msg hint";
          } else {
            msgEl.textContent = ""; msgEl.className = "cap-msg";
          }
        }
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
    // the 3 Bridgerton brothers together => AloStraws confetti
    const allPicked = selected.map(t => t.dataset.label);
    if (allPicked.includes("Anthony") && allPicked.includes("Benedict") && allPicked.includes("Colin")) {
      rainImages(["AloStraws.jpg"]);
      fail("All three Bridgerton brothers?! That's a whole regency scandal. They're fictional AND taken — I'm real AND yours 🍓");
      return;
    }
    // both Xaden AND Violet (two different thunder characters) selected => storm
    const thunderPicked = new Set(
      selected.filter(t => t.dataset.effect === "thunder").map(t => t.dataset.label)
    );
    if (thunderPicked.size >= 2) {
      triggerThunder();
      triggerShadows();          // her lightning + his darkness, together
      fail("Xaden AND Violet?! Yo también te puedo electrocutar si quieres ⚡🔫");
      return;
    }
    // Allie + Dean (and ONLY those two) selected => their couple gif
    const picked = selected.map(t => t.dataset.label);
    if (picked.length === 2 && picked.includes("Allie") && picked.includes("Dean")) {
      showGif("AllieAndDean.gif");
      fail("Honestly... I get it JAJAJAJA. Pero invita!");
      return;
    }
    // both Alastors (demon form + human form) selected => Danny.gif
    if (picked.length === 2 && picked.includes("AlastorDemon") && picked.includes("AlastorHuman")) {
      showGif("Danny.gif");
      fail("HANNA MONTANA?!?!?! Very Bi of you.");
      return;
    }
    // all the Avatar / Pandora characters together => avatar gif
    if (picked.includes("Neytiri") && picked.includes("JakeSully") && picked.includes("Varang")) {
      showGif("Avatar.gif");
      fail("All of Pandora?? 🌌 Neytiri, Jake AND Varang — Ni el arbol aguanta esa presión 💀");
      return;
    }
    // las Chicas submitted for verification => whawhawha confetti
    const chicasTile = selected.find(t => t.dataset.label === "Chicas");
    if (chicasTile) {
      rainImages(["whawhawha.jpg"]);
      fail(chicasTile.dataset.caption || "Sería ideal pero es todas o nada y victoria no tira para tu lado 🥱");
      return;
    }
    // Michael + Cherry => her gif (only shows up for this pairing) + Cherry.mp3
    if (picked.includes("Cherry") && picked.includes("Michael")) {
      showGif("Cherry.gif", "Cherry.mp3");   // sound lasts as long as the gif
      fail("Yo Y Cherry?? 🍒 Buen intento — pero el único que se queda eres yo 😌");
      return;
    }
    // BabyMiko + Rauw Alejandro together => their crossover gif
    if (picked.includes("BabyMiko") && picked.includes("RauwAlejandro")) {
      showGif("MikoRauw.gif", "MikoAndRauw.mp3");
      fail("Lamento decirte Rauw que yo se la quiero quitar a ambos 🥱");
      return;
    }
    // BabyMiko submitted => launch the mini tamagotchi (close on Enter)
    const mikoTile = selected.find(t => t.dataset.label === "BabyMiko");
    if (mikoTile) {
      launchTamagotchi();
      fail(mikoTile.dataset.caption || "Te va a tener de tamagotchi 🕹️");
      return;
    }
    // Rauw Alejandro + Bad Bunny (and ONLY those two) => flash the duet line + play it
    if (picked.length === 2 && picked.includes("RauwAlejandro") && picked.includes("BadBunny")) {
      showLyric(DUET, 19000, "Party.mp3");   // text + clip last exactly 19s
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
    prompt: "Which are you most likly to buy from marshalls?",
    right: "Hahaha yes. That one 🍒",
    wrong: "Wrong berry, amor 🫐",
    options: [
      { emoji: "🍒", label: "Cherry", correct: true },
      { emoji: "🍓", label: "Strawberry", correct: true },
      { emoji: "🫐", label: "Blueberry", correct: true },
      { emoji: "🍇", label: "Raspberry", correct: true },
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
        "Are you sure about that? 🤔",
      ],
      gif: "MikeFine.gif",   // TODO: a gif of you reacting
      finalMsg: "…UGHHH. FINE. It was me. Happy now?? 🙄💕",
    },
    options: [
      { src: "me1.jpeg", label: "Michael", correct: true },
      { src: "her.jpeg", label: "You" },
      { src: "Cameo.jpg", label: "Cameo", },
      { src: "Candy.jpg", label: "Candy" },
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
   SCREEN 5 — SPOTIFY WRAPPED: US EDITION
   ---------------------------------------------------------------------
   Styled to look like a real Spotify Wrapped. Card kinds:
     intro     - the splash
     stat      - giant count-up number + label
     spotlight - "album art" + Top Artist / Top Song
     ranked    - numbered top-5 list (edit the `items`)
     summary   - the final shareable stacked card
   `accent` picks the bright background: green/pink/purple/yellow/blue/coral.
   ===================================================================== */
const WRAPPED = [
  { kind: "intro",  accent: "green" },
 
  { kind: "stat",   accent: "pink",   num: 59375,                 label: "messages sent",
    note: "Two years of texts and we STILL had more to say 💬" },
 
  { kind: "stat",   accent: "purple", num: 131400, unit: "",      label: "minutes together",
    note: "That's 2,190 hours of you being my favorite place to be ⏳" },
 
  { kind: "stat",   accent: "yellow", num: 1095,                  label: "meals shared",
    note: "Every single one beats eating alone 🍽️" },
 
  { kind: "stat",   accent: "blue",   big: "∞",                   label: "inside jokes",
    note: "Officially uncountable — nobody else would get a single one 😂" },
 
  { kind: "spotlight", accent: "green", art: "me1.jpeg", topLabel: "Your Top Artist",
    name: "Michael", note: "You were in the top 0.01% of his listeners 🎧" },
 
  { kind: "spotlight", accent: "coral", art: "ComoDormisteCover.jpg", topLabel: "Your Top Song",
    name: "Como Dormiste", note: "You know exactly which one 🎵" },
 
  { kind: "ranked", accent: "purple", title: "Your Top Artists", items: [
    { name: "Michael",                 img: "me1.jpeg" },
    { name: "Michael (Acoustic)",      img: "me2.jpeg" },
    { name: "Michael & The Cat",       img: "me3.jpeg" },
    { name: "Michael feat. You",       img: "her.jpeg" },
    { name: "Honestly, still Michael", img: "MikeBefore.jpg" },
  ] },
 
  { kind: "summary", accent: "pink" },
];
 
function initWrapped() {
  const stage   = document.getElementById("wr-stage");
  const dotsEl  = document.getElementById("wr-dots");
  const nextBtn = document.getElementById("wr-next");
  let idx = 0;
 
  dotsEl.innerHTML = "";
  WRAPPED.forEach(() => {
    const d = document.createElement("span");
    d.className = "wr-dot";
    dotsEl.appendChild(d);
  });
 
  function countUp(el, target, unit) {
    const dur = 1100, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US") + (unit || "");
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
 
  function render() {
    const c = WRAPPED[idx];
    stage.className = "wr-stage wr-" + (c.accent || "green");
    const mark = '<div class="wr-mark">● Wrapped</div>';
    let html = "";
 
    if (c.kind === "intro") {
      html =
        '<div class="wr-card wr-introcard">' + mark +
          '<div class="wr-block">' +
            '<div class="wr-introbig">Us,<br>Wrapped</div>' +
            '<div class="wr-introsub">Two years. Tap to unwrap →</div>' +
          '</div>' +
        '</div>';
 
    } else if (c.kind === "stat") {
      html =
        '<div class="wr-card">' + mark +
          '<div class="wr-block">' +
            '<div class="wr-statnum" id="wr-num"></div>' +
            '<div class="wr-statlabel">' + (c.label || "") + '</div>' +
            '<div class="wr-note">' + (c.note || "") + '</div>' +
          '</div>' +
        '</div>';
 
    } else if (c.kind === "spotlight") {
      const art = c.art
        ? '<img class="wr-art" src="' + c.art + '" alt="">'
        : '<div class="wr-art wr-art-ph">' + (c.note2 || "♫") + '</div>';
      html =
        '<div class="wr-card">' + mark +
          '<div class="wr-block">' +
            '<div class="wr-toplabel">' + (c.topLabel || "") + '</div>' +
            art +
            '<div class="wr-name">' + (c.name || "") + '</div>' +
            '<div class="wr-note">' + (c.note || "") + '</div>' +
          '</div>' +
        '</div>';
 
    } else if (c.kind === "ranked") {
      let rows = "";
      c.items.forEach((it, i) => {
        const name  = (typeof it === "string") ? it : it.name;
        const thumb = (it && it.img)
          ? '<span class="wr-thumb" style="background-image:url(\'' + it.img + '\')"></span>'
          : '<span class="wr-thumb wr-t' + (i % 6) + '"></span>';
        rows +=
          '<div class="wr-row">' +
            '<span class="wr-rank">' + (i + 1) + '</span>' +
            thumb +
            '<span class="wr-rowname">' + name + '</span>' +
          '</div>';
      });
      html =
        '<div class="wr-card">' + mark +
          '<div class="wr-toplabel wr-ranktitle">' + (c.title || "") + '</div>' +
          '<div class="wr-list">' + rows + '</div>' +
        '</div>';
 
    } else if (c.kind === "summary") {
      const pair = (h, v) =>
        '<div class="wr-sumrow"><div class="wr-sumh">' + h + '</div>' +
        '<div class="wr-sumv">' + v + '</div></div>';
      html =
        '<div class="wr-card wr-summarycard">' +
          '<div class="wr-mark">● Wrapped &middot; Us</div>' +
          '<div class="wr-sumgrid">' +
            pair("Top Artist", "Michael") +
            pair("Top Song", "Como Dormiste") +
            pair("Minutes", "131,400") +
            pair("Top Genre", "Love/Reggaeton") +
          '</div>' +
          '<div class="wr-note">That\'s our two years 💛 Tap to keep going →</div>' +
        '</div>';
    }
 
    stage.innerHTML = html;
 
    if (c.kind === "stat") {
      const el = document.getElementById("wr-num");
      if (c.num != null) { el.textContent = "0"; countUp(el, c.num, c.unit); }
      else el.textContent = c.big || "";
    }
 
    [...dotsEl.children].forEach((d, i) => d.classList.toggle("on", i === idx));
    nextBtn.textContent = (idx === WRAPPED.length - 1) ? "Continue →" : "Next →";
  }
 
  function advance() {
    if (idx < WRAPPED.length - 1) { idx++; render(); }
    else nextScreen();
  }
 
  nextBtn.addEventListener("click", advance);
  stage.addEventListener("click", advance);   // tapping the card also advances
 
  initWrapped._reset = () => { idx = 0; render(); };
  render();
}
// onShow: always start the deck from the first card
function showWrapped() { if (initWrapped._reset) initWrapped._reset(); }
 
/* =====================================================================
   SCREEN 6 — DIGITAL SCRAPBOOK  (a stack of polaroids she flips through)
   ---------------------------------------------------------------------
   ✏️  FILL ME IN: one entry per photo. Drop the image files next to
   index.html and put the filename in `src`. `caption` is the handwritten
   line under the photo; `date` is optional (also handwritten, bottom-right).
   Add/remove as many as you like — the counter and flow adapt.
   ===================================================================== */
const SCRAPBOOK = [
  { src: "scrap1.jpg", caption: "Our first kiss", date: "December, 1, 2024" },
  { src: "scrap2.jpg", caption: "A favorite memory", date: "October, 1, 2025" },
  { src: "scrap3.jpg", caption: "A random side quest", date: "October, 15, 2025" },
  { src: "scrap4.jpg", caption: "Our last celebrated goal", date: "May, 9, 2026" },
  { src: "scrap5.jpg", caption: "Our recreated kiss", date: "December, 1, 2025" },
];
 
// Optional year-recap video — revealed after the last photo is flipped through.
// Drop your .mp4 next to index.html. Set src to "" to skip the video entirely.
const SCRAPBOOK_VIDEO = {
  src: "recap.mp4",
  caption: "Our year, in one take 🎬",
};
 
function initScrapbook() {
  const stack   = document.getElementById("scrap-stack");
  const countEl = document.getElementById("scrap-count");
  const hint    = document.getElementById("scrap-hint");
  const doneEl  = document.getElementById("scrap-done");
  const nextBtn = document.getElementById("scrap-next");
 
  function updateCount() {
    const total = SCRAPBOOK.length;
    const left  = stack.querySelectorAll(".polaroid").length;
    const cur   = Math.min(total - left + 1, total);
    countEl.textContent = total ? `${cur} / ${total}` : "";
  }
 
  function attachTop() {
    const cards = [...stack.querySelectorAll(".polaroid")];
    if (!cards.length) {                 // flipped through them all
      hint.style.display = "none";
      if (SCRAPBOOK_VIDEO && SCRAPBOOK_VIDEO.src) {
        stack.classList.add("video-mode");
        stack.innerHTML =
          '<div class="scrap-video">' +
            '<video src="' + SCRAPBOOK_VIDEO.src + '" controls playsinline preload="metadata"></video>' +
            (SCRAPBOOK_VIDEO.caption ? '<div class="scrap-vcap">' + SCRAPBOOK_VIDEO.caption + '</div>' : '') +
          '</div>';
      }
      doneEl.style.display = "";
      nextBtn.style.display = "";
      return;
    }
    cards.forEach(c => c.classList.remove("top"));
    const top = cards[0];                // first child = highest z = on top
    top.classList.add("top");
    top.addEventListener("click", dismiss, { once: true });
    updateCount();
  }
 
  function dismiss(e) {
    const card = e.currentTarget;
    const dir = Math.random() < 0.5 ? -1 : 1;
    card.style.transition = "transform .5s ease, opacity .5s ease";
    card.style.transform  = `translate(calc(-50% + ${dir * 160}%), -50%) rotate(${dir * 20}deg)`;
    card.style.opacity = "0";
    setTimeout(() => { card.remove(); attachTop(); }, 470);
  }
 
  function build() {
    stack.innerHTML = "";
    stack.classList.remove("video-mode");
    doneEl.style.display = "none";
    nextBtn.style.display = "none";
    hint.style.display = "";
    SCRAPBOOK.forEach((m, i) => {
      const card = document.createElement("div");
      card.className = "polaroid";
      const rot = (i % 2 ? 1 : -1) * (2 + (i * 2) % 6);
      card.style.setProperty("--rot", rot + "deg");
      card.style.zIndex = String(SCRAPBOOK.length - i);   // first memory on top
      card.innerHTML =
        '<div class="tape"></div>' +
        '<div class="pola-photo"><img alt=""><span class="pola-ph">' +
          (m.label || ("Photo " + (i + 1))) + '</span></div>' +
        '<div class="pola-cap">' + (m.caption || "") + '</div>' +
        (m.date ? '<div class="pola-date">' + m.date + '</div>' : '');
      const img = card.querySelector("img");
      img.onload = () => card.classList.add("has-img");
      if (m.src) img.src = m.src;
      stack.appendChild(card);
    });
    attachTop();
  }
 
  nextBtn.addEventListener("click", nextScreen);
  initScrapbook._reset = build;
  build();
}
// onShow: rebuild the stack each time the screen is entered
function showScrapbook() { if (initScrapbook._reset) initScrapbook._reset(); }
 
/* =====================================================================
   SCREEN 7 — TERMS & CONDITIONS  (read to the bottom, then draw a signature)
   ---------------------------------------------------------------------
   ✏️  Edit the clauses below freely. TERMS_FINE is the italic line at the end.
   She must scroll to the bottom AND draw a signature to unlock "Sign & Renew".
   ===================================================================== */
const TERMS = [
  "By signing, Subscriber (\"You\") agrees to renew the Boyfriend Subscription — Premium Tier — for a minimum of one (1) additional year.",
  "Subscriber shall accept all compliments without argument, including on days she insists she \"looks terrible.\" (She does not.)",
  "Hand-holding shall be initiated whenever physically possible: walks, car rides, grocery aisles, and during scary movies.",
  "Good night kisses are a core feature and may not be disabled, paused, or downgraded.",
  "Cameo and Candy retains full executive authority over the household and must be consulted on all major decisions. 🐱🐶",
  "Subscriber reserves the lifelong right to steal fries; Provider permanently waives all objections. 🍟(This offer has never been given before)",
  "All inside jokes accrued during the term remain jointly owned, in perpetuity, across all future updates.",
  "Provider (Michael) guarantees unlimited snacks, rides, and reassurance — 24/7, no rollover caps.",
  "Either party may call the other for absolutely no reason, at any hour, no agenda required.",
  "This agreement auto-renews indefinitely. We checked: there is no cancellation button. 💔🚫",
  "Subscriber confirms she is, and will remain, the favorite person. Status is non-transferable. Ever.",
];
const TERMS_FINE = "By signing below, Subscriber acknowledges she is officially stuck with me. Congratulations. ❤️";
 
// Optional add-ons she ticks (or doesn't). The accepted ones get folded into
// the signed agreement and emailed. Edit freely.
const TERMS_OPTIONS = [
  "Boyfriend must always let me choose the movie 🎬",
  "loquear una vez al año 🍍",
  "Unlimited forehead kisses, available on demand 😚",
  "I am entitled to the last bite of every dessert 🍰",
  "At home dinner night once a week 🍝",
  "He handles all bugs, spiders, and scary noises 🕷️",
  "Do at a random public place once a year 🚻",
  "I get to steal his hoodies indefinitely 🧥",
  "He must hype me up at least once a day 📣",
  "Cuddles are non-negotiable after a long day 🫂",
  "He handles more of the cleaning and I handle more of the organizing 🧼",
  "We hit the gym together at least twice a week 💪",
  "We must make a local or international trip together at least twice a year ✈️",
  "I will move in with boyfriend and redo the living space to my liking 🏡",
];
 
// --- Where the signed agreement is emailed -----------------------------
const RENEWAL_EMAIL_TO = "michael.rodriguezg99@gmail.com";   // where the signed agreement lands
// Truly-automatic silent send via EmailJS (SDK is loaded in index.html).
const EMAILJS = { publicKey: "L0lukFdK-SFcSkWnm", serviceId: "service_ey35afh", templateId: "template_tg9rx93", finalTemplateId: "template_fmbfeh9" };
 
// ✏️ Subject + body sent with the FINAL renewal email (template_fmbfeh9).
// In that EmailJS template, set the Subject field to {{subject}} and put
// {{message}} in the body (same as your working agreement template).
const FINAL_EMAIL = {
  subject: "💖 Renewed! You picked YES (again) and your membership is locked in!",
  message:
    "Great news 🎉\n\n" +
    "You just renewed your Girlfriend Membership — Premium Tier — for another year.\n\n" +
    "📅 Date locked in: November 9th — PLACEHOLDER Restaurant, 7pm.\n\n" +
    "Status: Renewed successfully.\n" +
    "Expiration date: Never. 💖🐱🐶",
};
 
function initTerms() {
  const scroll     = document.getElementById("terms-scroll");
  const list       = document.getElementById("terms-list");
  const fine       = document.getElementById("terms-fine");
  const canvas     = document.getElementById("terms-canvas");
  const clearBtn   = document.getElementById("terms-clear");
  const acceptBtn  = document.getElementById("terms-accept");
  const scrollHint = document.getElementById("terms-scrollhint");
  const optsEl     = document.getElementById("terms-options");
  const ctx = canvas.getContext("2d");
 
  let scrolled = false, signed = false, drawing = false;
 
  list.innerHTML = TERMS.map(t => "<li>" + t + "</li>").join("");
  fine.textContent = TERMS_FINE;
  optsEl.innerHTML = TERMS_OPTIONS.map((t, i) =>
    '<label class="terms-opt"><input type="checkbox" data-opt="' + i + '"><span>' + t + '</span></label>'
  ).join("");
 
  function sizeCanvas() {
    const w = canvas.parentElement.clientWidth || 280;
    canvas.width = w; canvas.height = 120;           // (resets the drawing)
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#5a3e3a";
  }
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  }
  function start(e) { drawing = true; const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y); e.preventDefault(); }
  function move(e) {
    if (!drawing) return;
    const { x, y } = pos(e); ctx.lineTo(x, y); ctx.stroke();
    if (!signed) { signed = true; updateBtn(); }
    e.preventDefault();
  }
  function end() { drawing = false; }
 
  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
 
  function updateBtn() { acceptBtn.disabled = !(scrolled && signed); }
 
  scroll.addEventListener("scroll", () => {
    if (scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 8) {
      scrolled = true;
      if (scrollHint) scrollHint.style.display = "none";
      updateBtn();
    }
  });
 
  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signed = false; updateBtn();
  });
 
  function buildEmailBody(chosen) {
    const date = new Date().toLocaleDateString();
    const L = [];
    L.push("RELATIONSHIP RENEWAL AGREEMENT — SIGNED ✅");
    L.push("Signed on: " + date);
    L.push("");
    L.push("Terms accepted by signature:");
    TERMS.forEach((t, i) => L.push((i + 1) + ". " + t));
    L.push("");
    L.push("Optional add-ons she accepted:");
    if (chosen.length) chosen.forEach(c => L.push("  ☑ " + c));
    else L.push("  (none selected — playing hard to get 😏)");
    L.push("");
    L.push(TERMS_FINE);
    return L.join("\n");
  }
 
  function sendRenewalEmail(chosen) {
    const subject = "Relationship Renewal Agreement — Signed ✅";
    const message = buildEmailBody(chosen);
    // Send silently via EmailJS only — never touches the device's mail app.
    if (window.emailjs && EMAILJS.publicKey && EMAILJS.serviceId && EMAILJS.templateId) {
      try {
        emailjs.init({ publicKey: EMAILJS.publicKey });
        emailjs.send(EMAILJS.serviceId, EMAILJS.templateId,
          { to_email: RENEWAL_EMAIL_TO, subject: subject, message: message }
        ).catch(() => { /* send failed; stay silent, do nothing */ });
      } catch (e) { /* ignore */ }
    }
  }
 
  acceptBtn.addEventListener("click", () => {
    if (acceptBtn.disabled) return;
    const chosen = [...optsEl.querySelectorAll("input:checked")]
      .map(cb => TERMS_OPTIONS[+cb.dataset.opt]);
    sendRenewalEmail(chosen);
    nextScreen();
  });
 
  initTerms._reset = () => {
    sizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signed = false; drawing = false;
    scroll.scrollTop = 0;
    // if the clauses are short enough not to scroll, count it as already read
    scrolled = scroll.scrollHeight <= scroll.clientHeight + 8;
    if (scrollHint) scrollHint.style.display = scrolled ? "none" : "";
    updateBtn();
  };
  sizeCanvas();
  updateBtn();
}
// onShow: resize the canvas to the now-visible window and reset the gates
function showTerms() { if (initTerms._reset) initTerms._reset(); }
 
/* =====================================================================
   SCREEN 8 — DATE PICKER  (a calendar where only ONE day is "available")
   ---------------------------------------------------------------------
   ✏️  DATE_ANSWER is the only correct day (month is 1-indexed: Nov = 11).
   Every OTHER day shows a random funny excuse from DATE_EXCUSES (reused).
   Edit the excuses freely — add/remove as many as you like.
   ===================================================================== */
const DATE_ANSWER = { year: 2026, month: 11, day: 9 };   // November 9, 2026
 
const DATE_EXCUSES = [
  "Booked solid — Cameo scheduled a very important nap that day 🐱",
  "Booked solid — Candy has a vet appointment that day 🐶",
  "Can't, the restaurant is closed for mysterious \"renovations\" 👀",
  "Nope — that's National Stay-Home-and-Miss-Each-Other Day 😔",
  "Mercury's in retrograde that day. Hard pass 🔮",
  "Sold out! Everyone wants a date with you — but only I get one 😤",
  "Tengo que lavar el pelo ese día 💁 (excusa oficial)",
  "The stars say no… but they keep whispering \"try November\" 🌟",
  "Cameo vetoed it — he's very protective of our calendar 🐱✋",
  "Candy said going out that day is bad luck 🐶",
  "Conflicto de horario con mi trabajo 😅",
  "Nuh-uh. That day is reserved for thinking about the RIGHT day 🤔",
  "Unavailable — I'll be too busy being obsessed with you 💘",
];
 
const DATE_HINTS = [
  "",
  "",
  "💡 Psst… pick a day that already means something to us 💕",
  "💡 Our anniversary. The 9th of November. You've got this 😉",
];
 
function showDatePicker() { if (initDatePicker._reset) initDatePicker._reset(); }
 
function initDatePicker() {
  const grid    = document.getElementById("date-grid");
  const monthEl = document.getElementById("date-month");
  const prevBtn = document.getElementById("date-prev");
  const nextBtn = document.getElementById("date-next");
  const msgEl   = document.getElementById("date-msg");
  const hintEl  = document.getElementById("date-hint");
  const win     = document.querySelector("#date-screen .win");
 
  const MONTHS = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
 
  let viewYear  = DATE_ANSWER.year;
  let viewMonth = DATE_ANSWER.month - 1;   // 0-indexed for JS Date
  let wrong = 0;
  let done  = false;
 
  const rand  = a => a[Math.floor(Math.random() * a.length)];
  const shake = () => { win.classList.remove("shake"); void win.offsetWidth; win.classList.add("shake"); };
 
  function build() {
    monthEl.textContent = MONTHS[viewMonth] + " " + viewYear;
    grid.innerHTML = "";
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();      // 0 = Sunday
    const days     = new Date(viewYear, viewMonth + 1, 0).getDate(); // last day of month
 
    for (let i = 0; i < firstDow; i++) {
      const blank = document.createElement("span");
      blank.className = "date-cell empty";
      grid.appendChild(blank);
    }
    for (let d = 1; d <= days; d++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "date-cell";
      cell.textContent = d;
      cell.addEventListener("click", () => pick(d, cell));
      grid.appendChild(cell);
    }
  }
 
  function pick(d, cell) {
    if (done) return;
    const isCorrect =
      viewYear === DATE_ANSWER.year &&
      viewMonth === DATE_ANSWER.month - 1 &&
      d === DATE_ANSWER.day;
 
    if (isCorrect) {
      done = true;
      grid.querySelectorAll(".date-cell").forEach(c => c.disabled = true);
      cell.classList.add("correct");
      hintEl.textContent = "";
      msgEl.textContent = "It's a date 💖 See you November 9th, 2026 ✨";
      msgEl.className = "date-msg ok";
      setTimeout(nextScreen, 1600);
      return;
    }
 
    cell.classList.remove("wrong"); void cell.offsetWidth; cell.classList.add("wrong");
    setTimeout(() => cell.classList.remove("wrong"), 500);
    msgEl.textContent = rand(DATE_EXCUSES);
    msgEl.className = "date-msg bad";
    shake();
    wrong++;
    hintEl.textContent = DATE_HINTS[Math.min(wrong, DATE_HINTS.length - 1)];
  }
 
  prevBtn.addEventListener("click", () => {
    if (--viewMonth < 0) { viewMonth = 11; viewYear--; }
    build();
  });
  nextBtn.addEventListener("click", () => {
    if (++viewMonth > 11) { viewMonth = 0; viewYear++; }
    build();
  });
 
  initDatePicker._reset = () => {
    viewYear  = DATE_ANSWER.year;
    viewMonth = DATE_ANSWER.month - 1;
    wrong = 0; done = false;
    msgEl.textContent = ""; msgEl.className = "date-msg";
    hintEl.textContent = "";
    build();
  };
  build();
}
 
/* =====================================================================
   SCREEN 9 — LETTER (renewal finale)
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
    title.textContent = "🐱 It's me, Cameo. You hesitated… and now my tiny heart is cracked 🥺 Do you REALLY want to break my heart like this?";
    yesBtn.style.display = "none";
  }
 
  function startRunawayRound() {
    phase = "runaway";
    catImg.src = "candy_heart.gif";
    title.textContent = "🐶 Candy here. Okay, enough teasing — for real this time: renew your membership as his girlfriend? 🥺";
    yesBtn.style.display = "";
    noBtn.style.transform = "";
  }
 
  let finalSent = false;
  function sendRenewalConfirmation() {
    if (finalSent) return;                 // only ever send once
    finalSent = true;
    if (window.emailjs && EMAILJS.publicKey && EMAILJS.serviceId && EMAILJS.finalTemplateId) {
      try {
        emailjs.init({ publicKey: EMAILJS.publicKey });
        emailjs.send(EMAILJS.serviceId, EMAILJS.finalTemplateId,
          { to_email: RENEWAL_EMAIL_TO, subject: FINAL_EMAIL.subject, message: FINAL_EMAIL.message }
        ).catch(() => { /* send failed; stay silent */ });
      } catch (e) { /* ignore */ }
    }
  }
 
  function showFinal() {
    sendRenewalConfirmation();             // membership renewed -> fire the final email
    title.textContent = "Yippeeee! Membership renewed — for another forever 💖";
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