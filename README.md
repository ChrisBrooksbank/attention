# Attention Trainer

**Train your attention like a transformer trains its weights.**

Your brain runs an attention mechanism every waking moment — deciding what to focus on, what to suppress, and what to carry forward. This app makes that process visible and trainable, using the same Query / Key / Value framework that powers transformer neural networks.

**[Try it now](https://attention-app.netlify.app)**

---

## The exercises

### Selective Attention — Q·K alignment
A rapid letter stream. One target letter. Your job: respond only when the target appears, ignore everything else. Trains the precision of the match between your attentional query and the perceptual keys of incoming stimuli.

### Sustained Attention — Query stabilisation
Long sequences, rare targets, relentless monotony. The challenge isn't detection — it's maintaining a sharp query signal across time without drifting. Vigilance in its purest form.

### N-Back — Value retention
See a stimulus. Hold it. N steps later, decide: does the current input match what you stored? Directly stresses working memory — how long an attended value survives before interference overwrites it.

---

## What you get back

Every session produces signal-detection metrics that map directly onto the attention model:

| Metric | What it tells you |
|--------|-------------------|
| **Accuracy** | Overall weight precision — did attention land on the right stimuli? |
| **d' (d-prime)** | Discriminability — how well your system separates signal from noise |
| **Hit rate** | Target sensitivity — are the right keys activating? |
| **False alarm rate** | Distractor suppression — are irrelevant keys leaking through? |
| **Reaction time** | Processing latency — how fast the Q·K match resolves |

Results are stored locally in IndexedDB. Nothing leaves your device.

---

## The model

```
Q × K → weights × V = output
```

**Query** — your attentional goal. *"What am I looking for?"*
**Key** — the features of each incoming stimulus. *"What does this input offer?"*
**Value** — the information extracted once attention lands. *"What do I carry forward?"*

The exercises isolate and train each component. The Learn page in the app explores this framework in depth, including how ADHD maps onto specific failure modes of the weighting mechanism.

---

## Tech

React 19 · TypeScript · Vite · Framer Motion · Dexie (IndexedDB) · PWA

Offline-first. Installable. No accounts, no servers, no tracking.

---

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

---

## License

MIT
