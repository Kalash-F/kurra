export interface ScriptItem {
  character: string;
  transliteration: string;
  type: 'vowel' | 'consonant' | 'matra' | 'syllable' | 'word' | 'phrase';
  example?: string;
  exampleMeaning?: string;
  notes?: string;
}

export interface ScriptUnit {
  id: string;
  title: string;
  subtitle: string;
  stage: number;
  icon: string;
  color: string;
  goal: string;
  items: ScriptItem[];
}

export const scriptUnits: ScriptUnit[] = [
  {
    id: 'script-1',
    title: 'First Vowels',
    subtitle: 'अ, आ, इ',
    stage: 1,
    icon: 'अ',
    color: '#E8733A',
    goal: 'Learn the first three vowels and their sounds',
    items: [
      { character: 'अ', transliteration: 'a', type: 'vowel', example: 'अनार', exampleMeaning: 'pomegranate' },
      { character: 'आ', transliteration: 'aa', type: 'vowel', example: 'आमा', exampleMeaning: 'mother' },
      { character: 'इ', transliteration: 'i', type: 'vowel', example: 'इनार', exampleMeaning: 'well' },
    ],
  },
  {
    id: 'script-2',
    title: 'More Vowels',
    subtitle: 'ई, उ, ऊ',
    stage: 1,
    icon: 'ई',
    color: '#2A9D8F',
    goal: 'Learn three more vowels',
    items: [
      { character: 'ई', transliteration: 'ee', type: 'vowel', example: 'ईख', exampleMeaning: 'sugarcane' },
      { character: 'उ', transliteration: 'u', type: 'vowel', example: 'उन', exampleMeaning: 'wool' },
      { character: 'ऊ', transliteration: 'oo', type: 'vowel', example: 'ऊन', exampleMeaning: 'wool' },
    ],
  },
  {
    id: 'script-3',
    title: 'Remaining Vowels',
    subtitle: 'ए, ऐ, ओ, औ',
    stage: 1,
    icon: 'ए',
    color: '#E9C46A',
    goal: 'Complete the core vowel set',
    items: [
      { character: 'ए', transliteration: 'e', type: 'vowel', example: 'एक', exampleMeaning: 'one' },
      { character: 'ऐ', transliteration: 'ai', type: 'vowel', example: 'ऐना', exampleMeaning: 'mirror' },
      { character: 'ओ', transliteration: 'o', type: 'vowel', example: 'ओठ', exampleMeaning: 'lip' },
      { character: 'औ', transliteration: 'au', type: 'vowel', example: 'औषधि', exampleMeaning: 'medicine' },
    ],
  },
  {
    id: 'script-4',
    title: 'First Consonants',
    subtitle: 'क, ख, ग',
    stage: 2,
    icon: 'क',
    color: '#3498DB',
    goal: 'Learn the first three consonants',
    items: [
      { character: 'क', transliteration: 'ka', type: 'consonant', example: 'कलम', exampleMeaning: 'pen' },
      { character: 'ख', transliteration: 'kha', type: 'consonant', example: 'खाना', exampleMeaning: 'food' },
      { character: 'ग', transliteration: 'ga', type: 'consonant', example: 'गाई', exampleMeaning: 'cow' },
    ],
  },
  {
    id: 'script-5',
    title: 'More Consonants',
    subtitle: 'घ, ङ, च',
    stage: 2,
    icon: 'च',
    color: '#9B59B6',
    goal: 'Learn three more consonants',
    items: [
      { character: 'घ', transliteration: 'gha', type: 'consonant', example: 'घर', exampleMeaning: 'house' },
      { character: 'ङ', transliteration: 'nga', type: 'consonant', notes: 'Rare as initial, used in combinations' },
      { character: 'च', transliteration: 'cha', type: 'consonant', example: 'चिया', exampleMeaning: 'tea' },
    ],
  },
  {
    id: 'script-6',
    title: 'Next Consonants',
    subtitle: 'छ, ज, झ',
    stage: 2,
    icon: 'ज',
    color: '#1ABC9C',
    goal: 'Learn next set of consonants',
    items: [
      { character: 'छ', transliteration: 'chha', type: 'consonant', example: 'छात्र', exampleMeaning: 'student' },
      { character: 'ज', transliteration: 'ja', type: 'consonant', example: 'जल', exampleMeaning: 'water' },
      { character: 'झ', transliteration: 'jha', type: 'consonant', example: 'झोला', exampleMeaning: 'bag' },
    ],
  },
  {
    id: 'script-7',
    title: 'Matra Intro',
    subtitle: 'Vowel signs on क',
    stage: 3,
    icon: 'का',
    color: '#E74C3C',
    goal: 'Understand how vowel signs modify consonants',
    items: [
      { character: 'क', transliteration: 'ka', type: 'matra', notes: 'Base form — inherent "a" sound' },
      { character: 'का', transliteration: 'kaa', type: 'matra', notes: 'आ matra added' },
      { character: 'कि', transliteration: 'ki', type: 'matra', notes: 'इ matra added' },
      { character: 'की', transliteration: 'kee', type: 'matra', notes: 'ई matra added' },
    ],
  },
  {
    id: 'script-8',
    title: 'More Matras',
    subtitle: 'कु, कू, के, को',
    stage: 3,
    icon: 'के',
    color: '#F39C12',
    goal: 'Learn remaining common vowel signs',
    items: [
      { character: 'कु', transliteration: 'ku', type: 'matra', notes: 'उ matra added' },
      { character: 'कू', transliteration: 'koo', type: 'matra', notes: 'ऊ matra added' },
      { character: 'के', transliteration: 'ke', type: 'matra', notes: 'ए matra added' },
      { character: 'को', transliteration: 'ko', type: 'matra', notes: 'ओ matra added' },
    ],
  },
  {
    id: 'script-9',
    title: 'Syllables & Tiny Words',
    subtitle: 'मा, का, बाबा, ममी',
    stage: 4,
    icon: 'मा',
    color: '#8E44AD',
    goal: 'Start reading small syllables and tiny words',
    items: [
      { character: 'मा', transliteration: 'maa', type: 'syllable' },
      { character: 'का', transliteration: 'kaa', type: 'syllable' },
      { character: 'की', transliteration: 'kee', type: 'syllable' },
      { character: 'बाबा', transliteration: 'baabaa', type: 'word', exampleMeaning: 'father / dad' },
      { character: 'ममी', transliteration: 'mamee', type: 'word', exampleMeaning: 'mummy' },
    ],
  },
  {
    id: 'script-10',
    title: 'Simple Words',
    subtitle: 'घर, पानी, खाना',
    stage: 5,
    icon: '📖',
    color: '#2C3E50',
    goal: 'Read simple everyday words in Devanagari',
    items: [
      { character: 'घर', transliteration: 'ghar', type: 'word', exampleMeaning: 'house' },
      { character: 'पानी', transliteration: 'paanee', type: 'word', exampleMeaning: 'water' },
      { character: 'खाना', transliteration: 'khaanaa', type: 'word', exampleMeaning: 'food' },
      { character: 'राम्रो', transliteration: 'raamro', type: 'word', exampleMeaning: 'good / nice' },
      { character: 'साथी', transliteration: 'saathee', type: 'word', exampleMeaning: 'friend' },
    ],
  },
  {
    id: 'script-11',
    title: 'Known Words in Script',
    subtitle: 'नमस्ते, धन्यवाद, म',
    stage: 5,
    icon: '🔗',
    color: '#16A085',
    goal: 'Connect spoken words you know to their written Devanagari form',
    items: [
      { character: 'नमस्ते', transliteration: 'namaste', type: 'word', exampleMeaning: 'hello' },
      { character: 'धन्यवाद', transliteration: 'dhanyabaad', type: 'word', exampleMeaning: 'thank you' },
      { character: 'म', transliteration: 'ma', type: 'word', exampleMeaning: 'I / me' },
      { character: 'राम्रो', transliteration: 'raamro', type: 'word', exampleMeaning: 'good' },
    ],
  },
  {
    id: 'script-12',
    title: 'First Phrases',
    subtitle: 'म ठीक छु',
    stage: 6,
    icon: '📝',
    color: '#C0392B',
    goal: 'Read your first complete phrases in Devanagari',
    items: [
      { character: 'म ठीक छु', transliteration: 'ma thik chhu', type: 'phrase', exampleMeaning: 'I am fine' },
      { character: 'मलाई पानी चाहिन्छ', transliteration: 'malai paani chahinchha', type: 'phrase', exampleMeaning: 'I need water' },
      { character: 'म घर जान्छु', transliteration: 'ma ghar jaanchhu', type: 'phrase', exampleMeaning: 'I go home' },
    ],
  },
];
