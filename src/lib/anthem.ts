// "America" chaos event — once triggered, plays the US national anthem on
// loop for the rest of the browser session. Survives navigation between
// arcade routes via a singleton <audio> element on document.body.

const FLAG_KEY = "america-chaos-active";
const SRC = "https://upload.wikimedia.org/wikipedia/commons/c/c4/Star_Spangled_Banner_instrumental.ogg";

function getEl(): HTMLAudioElement {
  let el = document.getElementById("america-anthem") as HTMLAudioElement | null;
  if (!el) {
    el = document.createElement("audio");
    el.id = "america-anthem";
    el.src = SRC;
    el.loop = true;
    el.volume = 0.5;
    el.style.display = "none";
    document.body.appendChild(el);
  }
  return el;
}

export function isAmericaActive(): boolean {
  return sessionStorage.getItem(FLAG_KEY) === "1";
}

export function activateAmerica() {
  sessionStorage.setItem(FLAG_KEY, "1");
  const el = getEl();
  el.play().catch(() => {
    /* autoplay blocked until next user gesture; will retry on next call */
  });
}

export function ensureAmericaPlaying() {
  if (!isAmericaActive()) return;
  const el = getEl();
  if (el.paused) el.play().catch(() => {});
}

export function deactivateAmerica() {
  sessionStorage.removeItem(FLAG_KEY);
  const el = document.getElementById("america-anthem") as HTMLAudioElement | null;
  if (el) {
    el.pause();
    el.remove();
  }
}
