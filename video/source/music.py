import numpy as np, wave, sys, json
SR = 44100
DUR = 71.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
VO_OFF = 1.0
C = dict(okay=1.0, tabs=4.56, sheets=5.76, inbox=7.38, meet=10.48, xw=10.82, workflow=12.14, just=15.34,
         drafts=17.12, drag=19.62, webhooks=21.44, http=22.56, ai=23.64, emails=24.78, subflows=25.72, publish=26.46, test=27.7,
         prod=28.94, every=30.2, immutable=32.2, auditors=33.78, want=35.58, flowchart=37.56, swimlanes=38.56, bpmn=39.48,
         sequence=40.36, simulation=41.14, d3=42.34, connect=43.58, crm=44.84, payments=45.98, databases=46.72, chat=47.42,
         reconnect=47.96, oneclick=49.24, admins=50.44, branding=51.46, audit=52.26, health=54.0, allinone=55.54,
         selfhost=56.56, orrun=58.14, xwflow=59.82, define=61.02, publish2=61.94, run2=62.7, prove=63.5, final=64.9)
SCN = [15.15, 19.45, 26.3, 30.0, 35.4, 43.4, 50.2, 56.35, 59.6]

def buf(): return np.zeros((N, 2))
def tt(d): return np.arange(int(SR * d)) / SR
def add(dst, x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    if x.ndim == 1: x = np.stack([x * np.sqrt(.5 - pan / 2) * 1.414, x * np.sqrt(.5 + pan / 2) * 1.414], 1)
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), N - i)
    dst[i:i + n] += x[:n] * gain

def filt(x, lo=None, hi=None, order=2):
    n = len(x); X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(n, 1 / SR)
    H = np.ones_like(f)
    if hi: H *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if lo: H *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * (H[:, None] if x.ndim == 2 else H), n, axis=0)

def reverb(x, secs=2.6, damp=4000, mix=.35):
    L = int(SR * secs); t = np.arange(L) / SR
    ir = rng.standard_normal((L, 2)) * np.exp(-t * 6.9 / secs)[:, None]
    ir = filt(ir, hi=damp); ir /= np.sqrt((ir ** 2).sum(0))
    n = len(x) + L; nf = 1 << (n - 1).bit_length()
    out = np.fft.irfft(np.fft.rfft(x, nf, axis=0) * np.fft.rfft(ir, nf, axis=0), nf, axis=0)[:len(x)]
    return x * (1 - mix) + out * mix * 1.2

def saw(f, d, det=0.0):
    t = tt(d); return 2 * ((t * f * (1 + det)) % 1) - 1
def adsr(n, a=.005, d=.1, s=.6, r=.1, hold=None):
    e = np.ones(n); A = int(a * SR); D = int(d * SR); R = int(r * SR)
    e[:A] = np.linspace(0, 1, A) if A else 1
    e[A:A + D] = np.linspace(1, s, len(e[A:A + D])); e[A + D:] = s
    if R: e[-R:] *= np.linspace(1, 0, min(R, n))
    return e
mid = lambda m: 440 * 2 ** ((m - 69) / 12)

BPM = 120; B = 60 / BPM; D0 = C['meet']
def beat_times(a, b, step=1.0, off=0.0):
    k0 = int(np.ceil((a - D0) / (B * step) - 1e-9)) - 2
    ts = [D0 + (k * step + off) * B for k in range(k0, k0 + 400)]
    return [x for x in ts if a - 1e-6 <= x < b]

# chords (A minor): Am F C G, one bar each
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOT = [45, 41, 48, 43]
def chord_at(x):
    bar = int(np.floor((x - D0) / (4 * B))) % 4
    return bar

drums = buf(); bass = buf(); pads = buf(); plk = buf(); sfx = buf(); stab = buf()

# ---------- drum voices ----------
def kick():
    t = tt(.45); f = 45 + 110 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7) + .3 * filt(rng.standard_normal(len(t)), lo=2000) * np.exp(-t * 120)
    return np.tanh(x * 1.6) * .9
def clap():
    t = tt(.35); n = rng.standard_normal(len(t)); e = np.zeros(len(t))
    for o in [0, .011, .022]: e += np.exp(-np.maximum(t - o, 0) * 90) * (t >= o)
    e += .35 * np.exp(-t * 14)
    return filt(n * e, lo=900, hi=5000) * .8
def hat(open_=False):
    t = tt(.25 if open_ else .06); n = rng.standard_normal(len(t))
    return filt(n, lo=7000) * np.exp(-t * (14 if open_ else 70)) * .35
K, CL, HC, HO = kick(), clap(), hat(), hat(True)

GROOVE = [(D0, 56.35), (59.82, 64.9)]
for a, b in GROOVE:
    half = a > 59
    for x in beat_times(a, b, 2.0 if half else 1.0): add(drums, K, x, .95)
    for x in beat_times(a, b, 2.0, 1.0 if not half else 1.0): add(drums, CL, x, .55, .1)
    for x in beat_times(a, b, 1.0, .5): add(drums, HO, x, .45, -.2)
    for x in beat_times(a, b, .25): add(drums, HC, x, .25 + .1 * rng.random(), .25)
# intro soft hats + build
for x in beat_times(4.5, D0, .5): add(drums, HC, x, .18 * (x - 4.5) / 6 + .05, .2)
# snare roll into drop & into 59.82
def roll(a, b, g=.5):
    n = 16; ts = np.linspace(a, b, n, endpoint=False)
    for i, x in enumerate(ts): add(drums, CL, x, g * (.2 + .8 * i / n))
roll(D0 - 2 * B, D0 - .02, .35); roll(59.82 - 2 * B, 59.82 - .02, .45)

# ---------- bass: offbeat pumping ----------
def bassnote(m, d=B * .48):
    t = tt(d); f = mid(m)
    x = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) + .25 * filt(saw(f, d), hi=600)
    return np.tanh(1.4 * x) * adsr(len(t), .004, .08, .7, .05) * .55
for a, b in GROOVE:
    for x in beat_times(a, b, 1.0, .5): add(bass, bassnote(ROOT[chord_at(x)] - 12 + 12), x, 1.0)
    for x in beat_times(a, b, 4.0): add(bass, bassnote(ROOT[chord_at(x)] - 12, B * 1.5), x, .45)

# ---------- pads (detuned saws) ----------
def padchord(notes, d, bright=2400):
    x = np.zeros(int(SR * d))
    for m in notes + [notes[0] + 12]:
        for det in (-.006, 0, .007):
            x += saw(mid(m), d, det) * .12
    st = np.stack([filt(x, hi=bright), filt(np.roll(x, 300), hi=bright)], 1)
    return st * adsr(len(x), .25, .4, .85, .5)[:, None]
pad_dark, pad_bright = buf(), buf()
t0 = D0 - 8 * 4 * B  # start pads earlier, aligned to bars
x = t0
while x < 71.5:
    ci = chord_at(x + .01)
    add(pad_dark, padchord(CH[ci], 4 * B + .5, 700), x, 1.0)
    add(pad_bright, padchord(CH[ci], 4 * B + .5, 3200), x, 1.0)
    x += 4 * B
tl = np.arange(N) / SR
mixb = np.clip((tl - 1.0) / (D0 - 1.0), 0, 1) ** 2
mixb = np.where(tl > D0, 1, mixb)
mixb = np.where((tl > 56.35) & (tl < 59.82), .55 + .45 * (tl - 56.35) / 3.47, mixb)
pads = pad_dark * (1 - mixb)[:, None] + pad_bright * mixb[:, None]
# sidechain pump from kicks
pump = np.ones(N)
for a, b in GROOVE:
    for k in beat_times(a, b, 2.0 if a > 59 else 1.0):
        i = int(k * SR); L = int(.32 * SR); j = min(N, i + L)
        pump[i:j] = np.minimum(pump[i:j], .35 + .65 * (np.arange(j - i) / L) ** .6)
pads *= pump[:, None]

# ---------- pluck arp ----------
def pluck(m, d=.28):
    t = tt(d); f = mid(m); x = saw(f, d) + .5 * saw(f, d, .004)
    lp = filt(x, hi=1800 + 2500 * 1) * np.exp(-t * 14)
    return lp * .22
pat = [0, 1, 2, 1, 3, 2, 1, 2]
for a, b, g in [(3.5, D0, .5), (D0, 56.35, 1.0), (59.82, 64.9, 1.0)]:
    for i, x in enumerate(beat_times(a, b, .5)):
        ch = CH[chord_at(x)]; notes = ch + [ch[0] + 12]
        m = notes[pat[i % 8]] + 12 + (12 if (x > C['want'] and x < 43.4 and i % 4 == 3) else 0)
        add(plk, pluck(m), x, g * (np.clip((x - 3.5) / 6, .15, 1) if x < D0 else 1), .35 if i % 2 else -.35)
# delay echo on plucks
d = int(B * .75 * SR); echo = np.zeros_like(plk); echo[d:] = plk[:-d] * .35; echo[2 * d:] += plk[:-2 * d] * .15
plk = plk + echo[:, ::-1]

# ---------- word stabs at define/publish/run/prove + final chord ----------
for k, ci in [('define', 0), ('publish2', 1), ('run2', 2), ('prove', 3)]:
    add(stab, padchord(CH[ci], .9, 4000) * np.exp(-tt(.9) * 3)[:, None], C[k] - .03, 1.6)
fin = padchord([57, 60, 64, 69], 6.0, 3500) + padchord([45, 52], 6.0, 1200)
fin *= np.exp(-tt(6.0) * .55)[:, None]
add(stab, fin, C['final'] + 1.0, 1.3)

# ---------- SFX ----------
def whoosh(d=.7, up=True, lo=300, hi=9000, g=1.0):
    t = tt(d); n = rng.standard_normal((len(t), 2)); out = np.zeros_like(n)
    bands = np.geomspace(lo, hi, 9)
    for i in range(len(bands) - 1):
        bnd = filt(n, lo=bands[i], hi=bands[i + 1], order=3)
        c = (i / 8) if up else 1 - i / 8
        e = np.exp(-((t / d - (.25 + .5 * c)) ** 2) / .03)
        out += bnd * e[:, None]
    return out * g * .9
def pop(f0=900, f1=420, d=.09, g=.45):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38) * g
def tick():
    t = tt(.02); return filt(rng.standard_normal(len(t)), lo=2500, hi=9000) * np.exp(-t * 300) * .5
def impact(g=1.0, d=2.4):
    t = tt(d); f = 30 + 70 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crash = filt(rng.standard_normal(len(t)), lo=200, hi=6000) * np.exp(-t * 3.5) * .35
    return np.tanh((boom + crash) * 1.5) * g
def riser(d, g=.6):
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t))
    bands = np.geomspace(400, 12000, 12)
    for i in range(len(bands) - 1):
        c = i / 11; e = np.clip((t / d - c * .8) * 4, 0, 1)
        out += filt(n, lo=bands[i], hi=bands[i + 1], order=3) * e
    tone = np.sin(2 * np.pi * np.cumsum(200 + 800 * (t / d) ** 2) / SR) * .15
    return (out * .5 + tone) * (t / d) ** 2 * g
def shimmer(g=.5):
    out = np.zeros(int(SR * 3))
    for i, m in enumerate([81, 84, 88, 93, 96]):
        t = tt(2.4); f = mid(m)
        x = (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 2.2) * .18
        s = int(i * .07 * SR); out[s:s + len(x)] += x
    return out * g
def click():
    t = tt(.03); return (filt(rng.standard_normal(len(t)), lo=1500) * np.exp(-t * 400) + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 200)) * .6
def thud():
    t = tt(.4); f = 60 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * .9 + filt(rng.standard_normal(len(t)), hi=1500) * np.exp(-t * 40) * .4

# typing
for txt, a, cps in [('Okay, real talk.', 1.0, 14), ('Alert sales when an order is over $500', 15.95 + 1 / 26, 26)]:
    for i, ch in enumerate(txt):
        if ch != ' ': add(sfx, tick(), a + i / cps + .01, .55 + .2 * rng.random(), rng.uniform(-.3, .3))
# chips / pops
def blip(m, g=.22):
    t = tt(.35); f = mid(m)
    x = (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 16) * (1 - np.exp(-t * 900))
    air = filt(rng.standard_normal(len(t)), lo=4000) * np.exp(-t * 120) * .15
    return (x + air) * g
def chime(m1, m2, g=.32):
    out = np.zeros(int(SR * .9))
    for i, m in enumerate([m1, m2]):
        t = tt(.8); f = mid(m)
        x = (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t) + .1 * np.sin(2 * np.pi * 3.01 * f * t)) * np.exp(-t * 6) * (1 - np.exp(-t * 600))
        s0 = int(i * .07 * SR); out[s0:s0 + len(x)] += x * (1 if i else .8)
    return out * g
PENTA = [76, 79, 81, 84, 86, 88, 91, 93, 96, 88, 91, 93]
for i in range(12): add(sfx, blip(PENTA[i]), C['tabs'] + i * .36, 1, rng.uniform(-.7, .7))
for k, (a, b) in zip(['tabs', 'sheets', 'inbox'], [(64, 71), (67, 74), (69, 76)]): add(sfx, chime(a, b), C[k], 1)
for j, k in enumerate(['emails', 'subflows']): add(sfx, pop(980 + j * 90, 500), C[k], 1, .5)
add(sfx, click(), 17.55, .7)  # Send
# editor: pick up, drop, connect
for tp, td in [(20.45, 21.35), (22.1, 22.9)]:
    add(sfx, click(), tp, .6, -.3)
    add(sfx, whoosh(.5, True, 1500, 9000), td - .45, .18, .2)
    add(sfx, pop(520, 260, .14, .55), td, 1, .1)
    add(sfx, blip(84, .12), td + .03, 1, .1)
def zip_(d):
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t))
    for i, (lo, hi) in enumerate([(1500, 3000), (3000, 6000), (6000, 11000)]):
        out += filt(n, lo=lo, hi=hi) * np.clip((t / d * 3) - i + .5, 0, 1)
    return out * np.sin(np.pi * t / d) * .12
for t0 in [23.3, 24.6]:
    add(sfx, click(), t0 + .1, .6, .2)
    add(sfx, zip_(.75), t0 + .12, 1, .2)
    add(sfx, chime(76, 83, .28), t0 + .85, 1, .2)
    add(sfx, click(), t0 + .85, .5, .2)
for k in ['test', 'prod']: add(sfx, pop(700, 350, .12, .5), C[k], 1)
add(sfx, pop(700, 350, .12, .5), C['publish'] + .25, 1)
for j, k in enumerate(['crm', 'payments', 'databases', 'chat']): add(sfx, pop(950 + j * 80, 500), C[k], 1, .6)
for k in ['branding', 'audit', 'health']: add(sfx, pop(650, 320, .1, .4), C[k], 1)
add(sfx, pop(650, 320, .1, .4), C['admins'] + .2, 1)
add(sfx, click(), C['oneclick'] + .05, 1, .5)
add(sfx, shimmer(.35), C['oneclick'] + .08, 1, .5)
add(sfx, thud(), C['immutable'], .9)
# whooshes on scene changes
for x in SCN: add(sfx, whoosh(.8, True), x - .45, .55, rng.uniform(-.3, .3))
add(sfx, whoosh(.9, True, g=1.0), C['want'] - .4, .5)
for k in ['flowchart', 'swimlanes', 'bpmn', 'sequence', 'simulation', 'd3']: add(sfx, whoosh(.5, True, 800, 10000), C[k] - .4, .35, .4)
# risers & impacts
def swell(d=1.0):
    t = tt(d); n = filt(rng.standard_normal((len(t), 2)), lo=1500, hi=9000)
    return n * ((t / d) ** 3)[:, None] * .5
def bubble_pop():
    t = tt(.6)
    f = 280 + 2600 * (1 - np.exp(-t * 90))
    chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 55)
    burst = filt(rng.standard_normal(len(t)), lo=2500, hi=12000) * np.exp(-t * 160) * .7
    ft = 75 * np.exp(-t * 12) + 38
    thump = np.sin(2 * np.pi * np.cumsum(ft) / SR) * np.exp(-t * 9) * .8
    return np.tanh((chirp * .9 + burst + thump) * 1.3)
BP = C['meet'] - .3
add(sfx, swell(1.0), BP - 1.0, .5)
add(sfx, bubble_pop(), BP, .95)
for j, m in enumerate([88, 95, 100]): add(sfx, blip(m, .18), BP + .06 + j * .05, 1, (-.5, .5, 0)[j])
add(sfx, shimmer(.45), BP + .12, 1)
add(sfx, riser(3.3, .5), 59.82 - 3.3, .55); add(sfx, impact(.7, 1.6), 59.82, .55)
add(sfx, shimmer(.6), 59.85, 1)
add(sfx, riser(1.6, .5), C['final'] + 1.0 - 1.6, .6)
add(sfx, impact(1.2, 3.5), C['final'] + 1.0, .9)
add(sfx, shimmer(.8), C['final'] + 1.1, 1)
add(sfx, whoosh(1.2, False, 200, 6000, 1.0), C['final'] + 2.4, .35)
add(sfx, shimmer(.5), C['final'] + 2.5, 1)

# ---------- mix ----------
music = drums * .9 + bass * .9 + reverb(pads, 3.0, 3000, .4) * .55 + reverb(plk, 1.8, 6000, .3) * .5 + reverb(stab, 3.5, 5000, .45) * .7
# end: fade music tail
music *= np.clip((71.3 - tl) / 3.0, 0, 1)[:, None] ** 1.5
# VO-based ducking
def readwav(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    ch = w.getnchannels(); a = a.reshape(-1, ch); return a if ch == 2 else np.repeat(a, 2, 1)
vo = readwav(sys.argv[1]); vo_full = buf(); add(vo_full, vo, VO_OFF, 1.0)
env = np.abs(vo_full[:, 0]); L = int(.12 * SR)
env = np.convolve(env, np.ones(L) / L, mode='same'); env = env / (env.max() + 1e-9)
duck = 1 - .55 * np.clip(env * 6, 0, 1)
k = int(.15 * SR); duck = np.convolve(duck, np.ones(k) / k, mode='same')
music *= duck[:, None]
fx = reverb(sfx, 1.4, 7000, .22)
mixd = fx * .55
np.save(sys.argv[2], mixd.astype(np.float32))
out = np.clip(mixd / max(1e-9, np.abs(mixd).max()) * .89, -1, 1)
w = wave.open(sys.argv[3], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
print('ok', np.abs(mixd).max())
