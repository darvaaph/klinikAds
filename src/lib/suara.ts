// Call audio for the TV (PRD F-002): chime, then Indonesian TTS twice.
// Browsers block audio until a user gesture, so the TV shows a "Mulai" screen
// that calls `bukaKunciAudio()` first.

const ANGKA = [
  "nol",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];

/** Reads digits one by one: "014" → "nol satu empat". */
export function ejaAngka(digit: string): string {
  return [...digit].map((d) => ANGKA[Number(d)] ?? d).join(" ");
}

/** Turns digits inside a room name into words: "Ruang 1" → "Ruang satu". */
function ruangDiucapkan(ruang: string): string {
  return ruang.replace(/\d+/g, (d) => ejaAngka(d));
}

/**
 * "Nomor antrian A, nol satu empat, silakan ke Poli Umum, Ruang satu"
 * (ARCH §2.3). Digits are read one by one so "014" is not read as "empat belas".
 */
export function kalimatPanggilan(kode: string, namaPoli: string, ruang: string): string {
  const [huruf, nomor = ""] = kode.split("-");
  return `Nomor antrian ${huruf}, ${ejaAngka(nomor)}, silakan ke ${namaPoli}, ${ruangDiucapkan(ruang)}`;
}

let konteks: AudioContext | null = null;
let chime: HTMLAudioElement | null = null;

/** Must run inside a user gesture (the "Mulai" button). Safe to call more than once. */
export async function bukaKunciAudio(): Promise<void> {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AC) {
    konteks ??= new AC();
    await konteks.resume().catch(() => {});
  }

  chime ??= new Audio("/sounds/chime.mp3");
  chime.preload = "auto";
  // A silent play inside the gesture unlocks this element for later plays.
  chime.volume = 0;
  await chime.play().catch(() => {});
  chime.pause();
  chime.currentTime = 0;
  chime.volume = 1;

  // Some browsers load voices lazily; asking once here warms the list up.
  window.speechSynthesis?.getVoices();
}

function putarChime(): Promise<void> {
  return new Promise((selesai) => {
    if (!chime) return selesai();
    chime.currentTime = 0;
    chime.onended = () => selesai();
    chime.play().catch(() => selesai());
    // Never let a stuck audio element block the queue.
    setTimeout(selesai, 3000);
  });
}

function suaraIndonesia(): SpeechSynthesisVoice | null {
  const daftar = window.speechSynthesis?.getVoices() ?? [];
  return (
    daftar.find((v) => v.lang === "id-ID") ?? daftar.find((v) => v.lang.startsWith("id")) ?? null
  );
}

/** True when the device has an Indonesian TTS voice. Without one, only the chime plays. */
export function adaSuaraIndonesia(): boolean {
  return suaraIndonesia() !== null;
}

function ucapkan(teks: string, suara: SpeechSynthesisVoice): Promise<void> {
  return new Promise((selesai) => {
    const u = new SpeechSynthesisUtterance(teks);
    u.voice = suara;
    u.lang = suara.lang;
    u.rate = 0.9;
    u.onend = () => selesai();
    u.onerror = () => selesai();
    window.speechSynthesis.speak(u);
    // Some TV WebViews never fire onend; cap each sentence.
    setTimeout(selesai, 12_000);
  });
}

// Announcements run one after another and never overlap, even if calls bunch up.
let antrean: Promise<void> = Promise.resolve();

/** Queue one call: chime, then the sentence twice (or chime only without an id-ID voice). */
export function umumkan(kode: string, namaPoli: string, ruang: string): Promise<void> {
  antrean = antrean.then(async () => {
    await putarChime();
    const suara = suaraIndonesia();
    if (!suara) return;
    const teks = kalimatPanggilan(kode, namaPoli, ruang);
    await ucapkan(teks, suara);
    await ucapkan(teks, suara);
  });
  return antrean;
}
