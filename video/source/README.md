# xwflow promo video — source

- `index.html`, `anim.js`, `cues.js` — the motion composition; `render(t)` draws frame at time `t` (seconds).
  Needs `shots/` (app screenshots from `shoot.mjs`) and `assets/` (logo, node and integration SVGs from `/assets`) next to it.
- `render.mjs` — Playwright frame renderer: `node render.mjs frames <start> <end> 30`.
- `music.py` — numpy-synthesized music bed + SFX, ducked under the voiceover.
- Voiceover: ElevenLabs v4 (Higgsfield), preset voice "Emily", offset +1.0 s.
- Encode: `ffmpeg -framerate 30 -i frames/f%05d.jpg -i final_mix.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac xwflow-promo.mp4`.
