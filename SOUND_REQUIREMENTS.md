# Sound Asset Requirements — Kurra

All files go in `assets/sounds/`. Format: `.wav`, 16-bit, 44.1kHz, mono.

## Cultural Direction

The sound world should feel subtly Nepali — not generic, not theatrical.

**Inspirations**:
- Singing bowl resonance (Tibetan/Nepali bowls) — warm, sustaining harmonics
- Bansuri (bamboo flute) — airy, breathy, open
- Madal drum — restrained percussive warmth, muted attack
- Mountain atmosphere — spacious, reverberant, clean

**NOT**: Sitar clichés, generic "Asian" pentatonic scales, temple bells on every action.

---

## Sound Files

### `tap.wav`
- **Purpose**: Button/card press feedback
- **Duration**: 30ms
- **Texture**: Soft wood knock or muted finger-on-wood. Dry, no reverb
- **Tone**: Neutral, grounding
- **Volume level**: 0.3 (very quiet — background feedback)

### `select.wav`
- **Purpose**: Option selection, toggle activation
- **Duration**: 50ms
- **Texture**: Gentle click with slight resonance, like a small singing bowl lightly tapped
- **Tone**: Slightly warm, confirms action
- **Volume level**: 0.4

### `correct.wav`
- **Purpose**: Correct answer confirmed
- **Duration**: 200ms
- **Texture**: Warm bell harmonic, singing bowl strike — bright but soft. Clean attack, gentle decay
- **Tone**: Approving, uplifting without being triumphant
- **Volume level**: 0.6

### `incorrect.wav`
- **Purpose**: Incorrect answer
- **Duration**: 150ms
- **Texture**: Hollow soft knock, muted thud — NOT a harsh buzzer. Like a gentle "hmm, not quite"
- **Tone**: Neutral, non-punitive. Acknowledgement, not judgment
- **Volume level**: 0.5

### `progress.wav`
- **Purpose**: Lesson step advance
- **Duration**: 100ms
- **Texture**: Rising two-note chime, gentle. Like two small bells ascending a whole step
- **Tone**: Forward momentum, subtle encouragement
- **Volume level**: 0.3 (very subtle — plays often)

### `complete.wav`
- **Purpose**: Lesson or review session complete
- **Duration**: 500ms
- **Texture**: Layered singing bowl strike + soft sustained bansuri-like tone. Warm, resonant, settling
- **Tone**: Achievement, satisfaction, warmth. "You did something meaningful"
- **Volume level**: 0.8

### `streak.wav`
- **Purpose**: Streak incremented, welcome-back with streak preserved
- **Duration**: 400ms
- **Texture**: Warm ascending 3-note arpeggio, bell-like. Each note slightly brighter. Like walking uphill toward a view
- **Tone**: Continuity, momentum, gentle pride
- **Volume level**: 0.8

### `levelup.wav`
- **Purpose**: XP level milestone reached
- **Duration**: 600ms
- **Texture**: Fuller version of `complete` — singing bowl with more overtones, slight reverb tail. Perhaps a bansuri breath layered underneath
- **Tone**: Celebration without excess. "You've reached a new height"
- **Volume level**: 0.9

---

## Technical Notes

- All sounds must loop cleanly if < 100ms (for tap/select debounce)
- Sounds must sound good on phone speakers (tinny highs are ok, test for it)
- No clipping — peak at -3dB
- Fade in/out: minimum 5ms to avoid pops
- Test with and without reverb tails — keep tails short (< 200ms)
