import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSpeakingExercises,
  buildRequeueExercises,
  isProduceStyle,
  SpeakingExercise,
} from '../buildSpeakingExercises';
import { Phrase } from '../../data/speakingUnits';

const samplePhrases: Phrase[] = [
  { id: 'p1', english: 'Hello', romanized: 'namaste', devanagari: 'नमस्ते', phonetic: 'nuh-muh-stay' },
  { id: 'p2', english: 'I am fine', romanized: 'ma thik chhu', devanagari: 'म ठीक छु', phonetic: 'muh theek chhoo' },
  { id: 'p3', english: 'Good morning', romanized: 'subha prabhat', devanagari: 'शुभ प्रभात', phonetic: 'shoo-bhuh pruh-bhaht' },
];

function assertNoQuizFields(exs: SpeakingExercise[]) {
  for (const ex of exs) {
    assert.equal('options' in ex, false, `${ex.type} must not have options`);
    assert.equal('correctAnswer' in ex, false, `${ex.type} must not have correctAnswer`);
    const keys = Object.keys(ex).sort();
    assert.deepEqual(keys, ['phrase', 'type'], `unexpected keys on ${ex.type}: ${keys.join(',')}`);
  }
}

describe('buildSpeakingExercises', () => {
  it('returns empty for empty input', () => {
    assert.deepEqual(buildSpeakingExercises([]), []);
  });

  it('ends with recap and uses speak-first types only', () => {
    const exs = buildSpeakingExercises(samplePhrases);
    assert.ok(exs.length > 0);
    assert.equal(exs[exs.length - 1].type, 'recap');

    const allowed = new Set(['intro', 'listenRepeat', 'produce', 'listenProduce', 'microReview', 'recap']);
    for (const ex of exs) {
      assert.ok(allowed.has(ex.type), `unexpected type ${ex.type}`);
    }
  });

  it('emits no options / 4-choice fields', () => {
    assertNoQuizFields(buildSpeakingExercises(samplePhrases));
  });

  it('batches of 2: intro + listenRepeat for each phrase before produce', () => {
    const exs = buildSpeakingExercises(samplePhrases);
    // First batch = p1, p2
    assert.equal(exs[0].type, 'intro');
    assert.equal(exs[0].phrase.id, 'p1');
    assert.equal(exs[1].type, 'intro');
    assert.equal(exs[1].phrase.id, 'p2');
    assert.equal(exs[2].type, 'listenRepeat');
    assert.equal(exs[2].phrase.id, 'p1');
    assert.equal(exs[3].type, 'listenRepeat');
    assert.equal(exs[3].phrase.id, 'p2');
    assert.ok(isProduceStyle(exs[4].type));
    assert.equal(exs[4].phrase.id, 'p1');
    assert.ok(isProduceStyle(exs[5].type));
    assert.equal(exs[5].phrase.id, 'p2');
  });

  it('includes microReview after the second batch', () => {
    const exs = buildSpeakingExercises(samplePhrases);
    const micro = exs.filter((e) => e.type === 'microReview');
    assert.ok(micro.length >= 1);
    // micro-review picks from previously introduced (batch 1)
    assert.ok(['p1', 'p2'].includes(micro[0].phrase.id));
  });

  it('covers all three session phrases with intro and listenRepeat', () => {
    const exs = buildSpeakingExercises(samplePhrases);
    const introIds = exs.filter((e) => e.type === 'intro').map((e) => e.phrase.id);
    const listenIds = exs.filter((e) => e.type === 'listenRepeat').map((e) => e.phrase.id);
    assert.deepEqual(introIds.sort(), ['p1', 'p2', 'p3']);
    assert.deepEqual(listenIds.sort(), ['p1', 'p2', 'p3']);
  });
});

describe('buildRequeueExercises', () => {
  it('maps missed phrases to produce cards without quiz fields', () => {
    const requeue = buildRequeueExercises(samplePhrases.slice(0, 2));
    assert.equal(requeue.length, 2);
    assert.ok(requeue.every((e) => e.type === 'produce'));
    assertNoQuizFields(requeue);
  });
});

describe('isProduceStyle', () => {
  it('treats produce, listenProduce, and microReview as produce cards', () => {
    assert.equal(isProduceStyle('produce'), true);
    assert.equal(isProduceStyle('listenProduce'), true);
    assert.equal(isProduceStyle('microReview'), true);
    assert.equal(isProduceStyle('intro'), false);
    assert.equal(isProduceStyle('listenRepeat'), false);
    assert.equal(isProduceStyle('recap'), false);
  });
});
