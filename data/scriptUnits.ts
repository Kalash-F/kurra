export interface ScriptItem {
  character: string;
  transliteration: string;
  phonetic?: string;
  type: 'vowel' | 'consonant' | 'matra' | 'syllable' | 'word' | 'phrase';
  example?: string;
  exampleMeaning?: string;
  notes?: string;
  audioFile?: string; // relative path: e.g. 'script/vowel_a'
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
  // ─── STAGE 1: VOWELS ─────────────────────────────────────────────────────────
  {
    id: 'script-1',
    title: 'First Vowels',
    subtitle: 'अ, आ, इ',
    stage: 1,
    icon: 'अ',
    color: '#E8733A',
    goal: 'Learn the first three vowels and their sounds',
    items: [
      { character: 'अ', transliteration: 'a', type: 'vowel', example: 'अनार', exampleMeaning: 'pomegranate', audioFile: 'vowel_a', },
      { character: 'आ', transliteration: 'aa', type: 'vowel', example: 'आमा', exampleMeaning: 'mother', audioFile: 'vowel_aa' },
      { character: 'इ', transliteration: 'i', type: 'vowel', example: 'इनार', exampleMeaning: 'well', audioFile: 'vowel_i' },
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
      { character: 'ई', transliteration: 'ee', type: 'vowel', example: 'ईख', exampleMeaning: 'sugarcane', audioFile: 'vowel_ee' },
      { character: 'उ', transliteration: 'u', type: 'vowel', example: 'उन', exampleMeaning: 'wool', audioFile: 'vowel_u' },
      { character: 'ऊ', transliteration: 'oo', type: 'vowel', example: 'ऊन', exampleMeaning: 'wool', audioFile: 'vowel_oo' },
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
      { character: 'ए', transliteration: 'e', type: 'vowel', example: 'एक', exampleMeaning: 'one', audioFile: 'vowel_e' },
      { character: 'ऐ', transliteration: 'ai', type: 'vowel', example: 'ऐना', exampleMeaning: 'mirror', audioFile: 'vowel_ai' },
      { character: 'ओ', transliteration: 'o', type: 'vowel', example: 'ओठ', exampleMeaning: 'lip', audioFile: 'vowel_o' },
      { character: 'औ', transliteration: 'au', type: 'vowel', example: 'औषधि', exampleMeaning: 'medicine', audioFile: 'vowel_au' },
    ],
  },

  // ─── STAGE 2: CONSONANTS (all 7 groups) ──────────────────────────────────────
  {
    id: 'script-4',
    title: 'Consonants: Group 1',
    subtitle: 'क ख ग घ ङ',
    stage: 2,
    icon: 'क',
    color: '#3498DB',
    goal: 'Learn the first group of consonants — the K/G sounds',
    items: [
      { character: 'क', transliteration: 'ka', type: 'consonant', example: 'कलम', exampleMeaning: 'pen', audioFile: 'cons_ka' },
      { character: 'ख', transliteration: 'kha', type: 'consonant', example: 'खाना', exampleMeaning: 'food', audioFile: 'cons_kha' },
      { character: 'ग', transliteration: 'ga', type: 'consonant', example: 'गाई', exampleMeaning: 'cow', audioFile: 'cons_ga' },
      { character: 'घ', transliteration: 'gha', type: 'consonant', example: 'घर', exampleMeaning: 'house', audioFile: 'cons_gha' },
      { character: 'ङ', transliteration: 'nga', type: 'consonant', notes: 'Rarely used alone; found in combinations like बाङ्गो', audioFile: 'cons_nga' },
    ],
  },
  {
    id: 'script-5',
    title: 'Consonants: Group 2',
    subtitle: 'च छ ज झ ञ',
    stage: 2,
    icon: 'च',
    color: '#9B59B6',
    goal: 'Learn the CH/J sound group',
    items: [
      { character: 'च', transliteration: 'cha', type: 'consonant', example: 'चिया', exampleMeaning: 'tea', audioFile: 'cons_cha' },
      { character: 'छ', transliteration: 'chha', type: 'consonant', example: 'छात्र', exampleMeaning: 'student', audioFile: 'cons_chha' },
      { character: 'ज', transliteration: 'ja', type: 'consonant', example: 'जल', exampleMeaning: 'water', audioFile: 'cons_ja' },
      { character: 'झ', transliteration: 'jha', type: 'consonant', example: 'झोला', exampleMeaning: 'bag', audioFile: 'cons_jha' },
      { character: 'ञ', transliteration: 'nya', type: 'consonant', notes: 'Nasal sound; found in words like ञान', audioFile: 'cons_nya' },
    ],
  },
  {
    id: 'script-6',
    title: 'Consonants: Group 3',
    subtitle: 'ट ठ ड ढ ण',
    stage: 2,
    icon: 'ट',
    color: '#1ABC9C',
    goal: 'Learn the retroflex T/D sounds — tongue curls back',
    items: [
      { character: 'ट', transliteration: 'Ta', type: 'consonant', example: 'टाउको', exampleMeaning: 'head', notes: 'Retroflex — tongue tip curls back', audioFile: 'cons_Ta' },
      { character: 'ठ', transliteration: 'Tha', type: 'consonant', example: 'ठूलो', exampleMeaning: 'big', notes: 'Aspirated retroflex', audioFile: 'cons_Tha' },
      { character: 'ड', transliteration: 'Da', type: 'consonant', example: 'डाक्टर', exampleMeaning: 'doctor', audioFile: 'cons_Da' },
      { character: 'ढ', transliteration: 'Dha', type: 'consonant', example: 'ढोका', exampleMeaning: 'door', audioFile: 'cons_Dha' },
      { character: 'ण', transliteration: 'Na', type: 'consonant', notes: 'Retroflex nasal; mainly in Sanskrit-origin words', audioFile: 'cons_Na' },
    ],
  },
  {
    id: 'script-7',
    title: 'Consonants: Group 4',
    subtitle: 'त थ द ध न',
    stage: 2,
    icon: 'त',
    color: '#E74C3C',
    goal: 'Learn the dental T/D sounds — tongue touches teeth',
    items: [
      { character: 'त', transliteration: 'ta', type: 'consonant', example: 'तरकारी', exampleMeaning: 'vegetables', notes: 'Dental — tongue against upper teeth', audioFile: 'cons_ta' },
      { character: 'थ', transliteration: 'tha', type: 'consonant', example: 'थकित', exampleMeaning: 'tired', audioFile: 'cons_tha' },
      { character: 'द', transliteration: 'da', type: 'consonant', example: 'दाल', exampleMeaning: 'lentils', audioFile: 'cons_da' },
      { character: 'ध', transliteration: 'dha', type: 'consonant', example: 'धन्यवाद', exampleMeaning: 'thank you', audioFile: 'cons_dha' },
      { character: 'न', transliteration: 'na', type: 'consonant', example: 'नमस्ते', exampleMeaning: 'hello', audioFile: 'cons_na' },
    ],
  },
  {
    id: 'script-8',
    title: 'Consonants: Group 5',
    subtitle: 'प फ ब भ म',
    stage: 2,
    icon: 'प',
    color: '#F39C12',
    goal: 'Learn the P/B/M lip sounds',
    items: [
      { character: 'प', transliteration: 'pa', type: 'consonant', example: 'पानी', exampleMeaning: 'water', audioFile: 'cons_pa' },
      { character: 'फ', transliteration: 'pha', type: 'consonant', example: 'फूल', exampleMeaning: 'flower', audioFile: 'cons_pha' },
      { character: 'ब', transliteration: 'ba', type: 'consonant', example: 'बाबा', exampleMeaning: 'father', audioFile: 'cons_ba' },
      { character: 'भ', transliteration: 'bha', type: 'consonant', example: 'भात', exampleMeaning: 'rice', audioFile: 'cons_bha' },
      { character: 'म', transliteration: 'ma', type: 'consonant', example: 'माछा', exampleMeaning: 'fish', audioFile: 'cons_ma' },
    ],
  },
  {
    id: 'script-9',
    title: 'Consonants: Group 6',
    subtitle: 'य र ल व',
    stage: 2,
    icon: 'र',
    color: '#8E44AD',
    goal: 'Learn the Y/R/L/W semi-vowels',
    items: [
      { character: 'य', transliteration: 'ya', type: 'consonant', example: 'यहाँ', exampleMeaning: 'here', audioFile: 'cons_ya' },
      { character: 'र', transliteration: 'ra', type: 'consonant', example: 'राम्रो', exampleMeaning: 'good', audioFile: 'cons_ra' },
      { character: 'ल', transliteration: 'la', type: 'consonant', example: 'लाग्यो', exampleMeaning: 'felt', audioFile: 'cons_la' },
      { character: 'व', transliteration: 'wa', type: 'consonant', example: 'वर्ष', exampleMeaning: 'year', audioFile: 'cons_wa' },
    ],
  },
  {
    id: 'script-10',
    title: 'Consonants: Group 7',
    subtitle: 'श ष स ह',
    stage: 2,
    icon: 'स',
    color: '#2C3E50',
    goal: 'Learn the SH/S/H sounds — the sibilants',
    items: [
      { character: 'श', transliteration: 'sha', type: 'consonant', example: 'शहर', exampleMeaning: 'city', notes: 'Palatal sibilant', audioFile: 'cons_sha' },
      { character: 'ष', transliteration: 'Sha', type: 'consonant', notes: 'Retroflex sibilant; mainly in Sanskrit words', audioFile: 'cons_Sha' },
      { character: 'स', transliteration: 'sa', type: 'consonant', example: 'साथी', exampleMeaning: 'friend', audioFile: 'cons_sa' },
      { character: 'ह', transliteration: 'ha', type: 'consonant', example: 'हात', exampleMeaning: 'hand', audioFile: 'cons_ha' },
    ],
  },

  // ─── STAGE 3: MATRAS ─────────────────────────────────────────────────────────
  {
    id: 'script-11',
    title: 'Matras: Part 1',
    subtitle: 'क का कि की',
    stage: 3,
    icon: 'का',
    color: '#C0392B',
    goal: 'See how the first vowel signs modify the consonant क',
    items: [
      { character: 'क', transliteration: 'ka', type: 'matra', notes: 'Base form — inherent "a" sound', audioFile: 'matra_ka' },
      { character: 'का', transliteration: 'kaa', type: 'matra', notes: 'ा (aa matra) added', audioFile: 'matra_kaa' },
      { character: 'कि', transliteration: 'ki', type: 'matra', notes: 'ि (i matra) added', audioFile: 'matra_ki' },
      { character: 'की', transliteration: 'kee', type: 'matra', notes: 'ी (ee matra) added', audioFile: 'matra_kee' },
    ],
  },
  {
    id: 'script-12',
    title: 'Matras: Part 2',
    subtitle: 'कु कू के कै को कौ',
    stage: 3,
    icon: 'के',
    color: '#16A085',
    goal: 'Learn the remaining vowel signs on क',
    items: [
      { character: 'कु', transliteration: 'ku', type: 'matra', notes: 'ु (u matra) — sits below', audioFile: 'matra_ku' },
      { character: 'कू', transliteration: 'koo', type: 'matra', notes: 'ू (oo matra) — sits below', audioFile: 'matra_koo' },
      { character: 'के', transliteration: 'ke', type: 'matra', notes: 'े (e matra)', audioFile: 'matra_ke' },
      { character: 'कै', transliteration: 'kai', type: 'matra', notes: 'ै (ai matra)', audioFile: 'matra_kai' },
      { character: 'को', transliteration: 'ko', type: 'matra', notes: 'ो (o matra)', audioFile: 'matra_ko' },
      { character: 'कौ', transliteration: 'kau', type: 'matra', notes: 'ौ (au matra)', audioFile: 'matra_kau' },
    ],
  },

  // ─── STAGE 4: SYLLABLES ──────────────────────────────────────────────────────
  {
    id: 'script-13',
    title: 'Simple Syllables',
    subtitle: 'मा, ना, रा, बा...',
    stage: 4,
    icon: 'मा',
    color: '#8E44AD',
    goal: 'Sound out syllables built from familiar consonants + matras',
    items: [
      { character: 'मा', transliteration: 'maa', type: 'syllable', phonetic: 'mah', audioFile: 'syl_maa' },
      { character: 'ना', transliteration: 'naa', type: 'syllable', phonetic: 'nah', audioFile: 'syl_naa' },
      { character: 'रा', transliteration: 'raa', type: 'syllable', phonetic: 'rah', audioFile: 'syl_raa' },
      { character: 'बा', transliteration: 'baa', type: 'syllable', phonetic: 'bah', audioFile: 'syl_baa' },
      { character: 'की', transliteration: 'kee', type: 'syllable', phonetic: 'kee', audioFile: 'syl_kee' },
      { character: 'नी', transliteration: 'nee', type: 'syllable', phonetic: 'nee', audioFile: 'syl_nee' },
      { character: 'पु', transliteration: 'pu', type: 'syllable', phonetic: 'poo', audioFile: 'syl_pu' },
      { character: 'रे', transliteration: 're', type: 'syllable', phonetic: 'ray', audioFile: 'syl_re' },
    ],
  },

  // ─── STAGE 5: WORD READING ───────────────────────────────────────────────────
  {
    id: 'script-14',
    title: 'Tiny Words',
    subtitle: 'बाबा, ममी, घर...',
    stage: 5,
    icon: 'बाबा',
    color: '#E8733A',
    goal: 'Read your first short words in Devanagari',
    items: [
      { character: 'म', transliteration: 'ma', type: 'word', phonetic: 'muh', exampleMeaning: 'I / me', audioFile: 'word_ma' },
      { character: 'घर', transliteration: 'ghar', type: 'word', phonetic: 'ghuhr', exampleMeaning: 'house', audioFile: 'word_ghar' },
      { character: 'बाबा', transliteration: 'baabaa', type: 'word', phonetic: 'bah-bah', exampleMeaning: 'father / dad', audioFile: 'word_baabaa' },
      { character: 'ममी', transliteration: 'mamee', type: 'word', phonetic: 'muh-mee', exampleMeaning: 'mummy', audioFile: 'word_mamee' },
      { character: 'मा', transliteration: 'maa', type: 'word', phonetic: 'mah', exampleMeaning: 'mother (informal)', audioFile: 'word_maa' },
    ],
  },
  {
    id: 'script-15',
    title: 'Common Words',
    subtitle: 'पानी, खाना, राम्रो...',
    stage: 5,
    icon: '📖',
    color: '#2A9D8F',
    goal: 'Read everyday Nepali words',
    items: [
      { character: 'पानी', transliteration: 'paanee', type: 'word', phonetic: 'pah-nee', exampleMeaning: 'water', audioFile: 'word_paanee' },
      { character: 'खाना', transliteration: 'khaanaa', type: 'word', phonetic: 'khah-nah', exampleMeaning: 'food', audioFile: 'word_khaanaa' },
      { character: 'राम्रो', transliteration: 'raamro', type: 'word', phonetic: 'rahm-ro', exampleMeaning: 'good / nice', audioFile: 'word_raamro' },
      { character: 'साथी', transliteration: 'saathee', type: 'word', phonetic: 'sah-thee', exampleMeaning: 'friend', audioFile: 'word_saathee' },
      { character: 'आमा', transliteration: 'aama', type: 'word', phonetic: 'ah-mah', exampleMeaning: 'mother', audioFile: 'word_aama' },
      { character: 'बुवा', transliteration: 'buwa', type: 'word', phonetic: 'boo-wah', exampleMeaning: 'father', audioFile: 'word_buwa' },
    ],
  },
  {
    id: 'script-16',
    title: 'Known Words in Script',
    subtitle: 'नमस्ते, धन्यवाद...',
    stage: 5,
    icon: '🔗',
    color: '#E9C46A',
    goal: 'Connect spoken words you already know to their written form',
    items: [
      { character: 'नमस्ते', transliteration: 'namaste', type: 'word', phonetic: 'nuh-muh-stay', exampleMeaning: 'hello', audioFile: 'word_namaste' },
      { character: 'धन्यवाद', transliteration: 'dhanyabaad', type: 'word', phonetic: 'dhun-yuh-bahd', exampleMeaning: 'thank you', audioFile: 'word_dhanyabaad' },
      { character: 'हजुर', transliteration: 'hajur', type: 'word', phonetic: 'huh-joor', exampleMeaning: 'yes / excuse me', audioFile: 'word_hajur' },
      { character: 'होइन', transliteration: 'hoina', type: 'word', phonetic: 'hoy-nuh', exampleMeaning: 'no', audioFile: 'word_hoina' },
      { character: 'ठीक छ', transliteration: 'thik chha', type: 'word', phonetic: 'theek-chuh', exampleMeaning: 'okay', audioFile: 'word_thikchhha' },
    ],
  },

  // ─── STAGE 6: PHRASE READING ─────────────────────────────────────────────────
  {
    id: 'script-17',
    title: 'First Phrases',
    subtitle: 'म ठीक छु...',
    stage: 6,
    icon: '📝',
    color: '#C0392B',
    goal: 'Read your first complete Nepali phrases',
    items: [
      { character: 'नमस्ते', transliteration: 'namaste', type: 'phrase', phonetic: 'nuh-muh-stay', exampleMeaning: 'Hello', audioFile: 'phrase_namaste' },
      { character: 'म ठीक छु', transliteration: 'ma thik chhu', type: 'phrase', phonetic: 'muh theek chhu', exampleMeaning: 'I am fine', audioFile: 'phrase_ma_thik_chhu' },
      { character: 'मलाई पानी चाहिन्छ', transliteration: 'malai paani chahinchha', type: 'phrase', phonetic: 'muh-lie pah-nee chah-hin-chuh', exampleMeaning: 'I need water', audioFile: 'phrase_malai_paani' },
      { character: 'म घर जान्छु', transliteration: 'ma ghar jaanchhu', type: 'phrase', phonetic: 'muh ghuhr jahn-chhoo', exampleMeaning: 'I go home', audioFile: 'phrase_ma_ghar' },
      { character: 'धन्यवाद', transliteration: 'dhanyabaad', type: 'phrase', phonetic: 'dhun-yuh-bahd', exampleMeaning: 'Thank you', audioFile: 'phrase_dhanyabaad' },
    ],
  },
];
