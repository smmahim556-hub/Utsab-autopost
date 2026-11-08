// Our own background music for the cartoon stories (2026-11-08: YouTube Content ID claimed the stock piano track we used).
// Everything here is synthesised from scratch, so no one else owns it: a soft, playful piano-like arpeggio over a warm pad,
// a I-vi-IV-V progression in C at 92 bpm, ~2 minutes, written as WAV and turned into assets/story-music.mp3 by ffmpeg.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const SR = 44100, BPM = 92, BEAT = 60 / BPM, BARS = 48;
const N = Math.ceil(BARS * 4 * BEAT * SR) + SR * 3;
const L = new Float32Array(N), R = new Float32Array(N);
const hz = m => 440 * 2 ** ((m - 69) / 12);
// Piano-ish: a few harmonics, fast attack, exponential decay; pan per note.
function note(m, t, dur, vel, pan = 0) {
  const f = hz(m), s0 = Math.floor(t * SR), len = Math.floor((dur + 1.2) * SR);
  for (let i = 0; i < len && s0 + i < N; i++) {
    const x = i / SR, env = Math.min(1, x / 0.006) * Math.exp(-x * (2.2 + f / 900)) * (x > dur ? Math.exp(-(x - dur) * 6) : 1);
    const v = vel * env * (Math.sin(2 * Math.PI * f * x) + 0.35 * Math.sin(4 * Math.PI * f * x) * Math.exp(-x * 3) + 0.12 * Math.sin(6 * Math.PI * f * x) * Math.exp(-x * 5));
    L[s0 + i] += v * (1 - pan) / 2; R[s0 + i] += v * (1 + pan) / 2;
  }
}
// Soft pad: detuned sines with a slow swell.
function pad(ms, t, dur, vel) {
  const s0 = Math.floor(t * SR), len = Math.floor(dur * SR);
  for (const m of ms) for (const d of [-0.07, 0.07]) {
    const f = hz(m) * 2 ** (d / 12);
    for (let i = 0; i < len && s0 + i < N; i++) {
      const x = i / SR, env = Math.sin(Math.PI * Math.min(1, x / dur)) ** 1.5;
      const v = vel * env * Math.sin(2 * Math.PI * f * x);
      L[s0 + i] += v * (d < 0 ? 0.6 : 0.4); R[s0 + i] += v * (d < 0 ? 0.4 : 0.6);
    }
  }
}
const CH = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]; // C, Am, F, G
const BASS = [48, 45, 41, 43];
const MEL = [[76, 74, 72, 74], [72, 71, 69, 71], [69, 72, 74, 72], [71, 74, 79, 74]];
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let bar = 0; bar < BARS; bar++) {
  const c = bar % 4, t0 = bar * 4 * BEAT, part = Math.floor(bar / 8) % 3; // A, B (with melody), A'
  pad(CH[c], t0, 4 * BEAT + 0.4, 0.035);
  note(BASS[c], t0, 2 * BEAT, 0.16, 0); note(BASS[c] + 7, t0 + 2 * BEAT, 2 * BEAT, 0.1, 0);
  const arp = [CH[c][0] + 12, CH[c][1] + 12, CH[c][2] + 12, CH[c][1] + 12];
  for (let k = 0; k < 8; k++) note(arp[k % 4] + (k >= 4 && part === 2 ? 12 : 0), t0 + k * BEAT / 2, BEAT / 2, 0.07 + 0.02 * rnd(), k % 2 ? 0.35 : -0.35);
  if (part === 1) MEL[c].forEach((m, k) => note(m, t0 + k * BEAT, BEAT * 0.9, 0.09, 0.1));
}
// Fade in/out so the loop restarts gently, normalise, write 16-bit stereo WAV.
const total = Math.floor(BARS * 4 * BEAT * SR);
let peak = 0;
for (let i = 0; i < total; i++) { const g = Math.min(1, i / SR / 1.5, (total - i) / SR / 2.5); L[i] *= g; R[i] *= g; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const buf = Buffer.alloc(44 + total * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + total * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(total * 4, 40);
for (let i = 0; i < total; i++) { buf.writeInt16LE(Math.round(L[i] / peak * 0.85 * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] / peak * 0.85 * 32767), 46 + i * 4); }
const wav = '/tmp/story-music.wav', out = path.join(__dirname, '..', 'assets', 'story-music.mp3');
fs.writeFileSync(wav, buf);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-af', 'aecho=0.8:0.6:60|120:0.25|0.15,lowpass=f=9000,volume=5dB,alimiter=limit=0.95', '-b:a', '160k', out]);
console.log(out, (total / SR).toFixed(1) + 's');
