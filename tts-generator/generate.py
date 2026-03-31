import os
import io
import time
import wave
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables from .env file
load_dotenv()

# Map of phrases: { "filename": "nepali text" }
# For blanks like ___, they are removed so it reads naturally "mero naam ... ho".
phrases_map = {
    # Unit 1
    "u1_p1": "नमस्ते",
    "u1_p2": "तपाईंलाई कस्तो छ?",
    "u1_p3": "तिमी कस्तो छौ?",
    "u1_p4": "म ठीक छु",
    "u1_p5": "शुभ प्रभात",
    "u1_p6": "पछि भेटौला",
    "u1_p7": "शुभ रात्री",
    "u1_p8": "सन्चै छ?",
    
    # Unit 2
    "u2_p1": "मेरो नाम हो",
    "u2_p2": "म बाट हो",
    "u2_p3": "तपाईंसँग भेटेर खुसी लाग्यो",
    "u2_p4": "म नेपाली सिक्दै छु",
    "u2_p5": "तपाईंको नाम के हो?",
    "u2_p6": "तपाईं कहाँ बाट हो?",
    "u2_p7": "म अलि अलि नेपाली बोल्छु",
    "u2_p8": "म नेपाली हो",
    
    # Unit 3
    "u3_p1": "आमा",
    "u3_p2": "बुवा",
    "u3_p3": "दाइ",
    "u3_p4": "भाइ",
    "u3_p5": "दिदी",
    "u3_p6": "बहिनी",
    "u3_p7": "परिवार",
    "u3_p8": "यो मेरी आमा हो",
    "u3_p9": "यो मेरो बुवा हो",
    "u3_p10": "हजुरबुवा",
    
    # Unit 4
    "u4_p1": "मलाई भोक लागेको छ",
    "u4_p2": "मलाई तिर्खा लागेको छ",
    "u4_p3": "म थाकेको छु",
    "u4_p4": "मलाई पानी चाहिन्छ",
    "u4_p5": "मलाई खाना चाहिन्छ",
    "u4_p6": "म बिरामी छु",
    "u4_p7": "मलाई सुत्न मन लाग्यो",
    "u4_p8": "मलाई जाडो लागेको छ",
    
    # Unit 5
    "u5_p1": "पानी",
    "u5_p2": "खाना",
    "u5_p3": "चिया",
    "u5_p4": "भात",
    "u5_p5": "दाल",
    "u5_p6": "मलाई चिया चाहिन्छ",
    "u5_p7": "खाना मिठो छ",
    "u5_p8": "म खाना खाइसकेँ",
    "u5_p9": "तरकारी",
    "u5_p10": "दूध",
    
    # Unit 6
    "u6_p1": "हो",
    "u6_p2": "होइन",
    "u6_p3": "धन्यवाद",
    "u6_p4": "माफ गर्नुस्",
    "u6_p5": "कृपया",
    "u6_p6": "ठीक छ",
    "u6_p7": "केही छैन",
    "u6_p8": "हजुर",
    
    # Unit 7
    "u7_p1": "एक",
    "u7_p2": "दुई",
    "u7_p3": "तीन",
    "u7_p4": "चार",
    "u7_p5": "पाँच",
    "u7_p6": "छ",
    "u7_p7": "सात",
    "u7_p8": "आठ",
    "u7_p9": "नौ",
    "u7_p10": "दस",
    "u7_p11": "कति हो?",
    "u7_p12": "महँगो",
    
    # Unit 8
    "u8_p1": "यहाँ आउ",
    "u8_p2": "खाउ",
    "u8_p3": "बस",
    "u8_p4": "आमा कहाँ हुनुहुन्छ?",
    "u8_p5": "म घर जादै छु",
    "u8_p6": "आउ खाना खाउ",
    "u8_p7": "घर",
    "u8_p8": "ढोका खोल्नुस्",
    
    # Unit 9
    "u9_p1": "कहाँ?",
    "u9_p2": "म जादै छु",
    "u9_p3": "यहाँ रोक्नुस्",
    "u9_p4": "मलाई जानु छ",
    "u9_p5": "कति टाढा छ?",
    "u9_p6": "बायाँ",
    "u9_p7": "दायाँ",
    "u9_p8": "सिधा जानुस्",
    
    # Unit 10
    "u10_p1": "म खुसी छु",
    "u10_p2": "म चिन्तित छु",
    "u10_p3": "म बुझिन",
    "u10_p4": "बिस्तारै बोल्नुस्",
    "u10_p5": "तपाईंले मलाई मद्दत गर्न सक्नुहुन्छ?",
    "u10_p6": "म दुखी छु",
    "u10_p7": "म डराएको छु",
    "u10_p8": "तपाईंले के भन्नुभयो?"
}

script_map = {
    # Vowels
    "vowel_a": "अ",
    "vowel_aa": "आ",
    "vowel_i": "इ",
    "vowel_ee": "ई",
    "vowel_u": "उ",
    "vowel_oo": "ऊ",
    "vowel_e": "ए",
    "vowel_ai": "ऐ",
    "vowel_o": "ओ",
    "vowel_au": "औ",
    
    # Consonants 
    "cons_ka": "क",
    "cons_kha": "ख",
    "cons_ga": "ग",
    "cons_gha": "घ",
    "cons_nga": "ङ",
    "cons_cha": "च",
    "cons_chha": "छ",
    "cons_ja": "ज",
    "cons_jha": "झ",
    "cons_nya": "ञ",
    "cons_Ta": "ट",
    "cons_Tha": "ठ",
    "cons_Da": "ड",
    "cons_Dha": "ढ",
    "cons_Na": "ण",
    "cons_ta": "त",
    "cons_tha": "थ",
    "cons_da": "द",
    "cons_dha": "ध",
    "cons_na": "न",
    "cons_pa": "प",
    "cons_pha": "फ",
    "cons_ba": "ब",
    "cons_bha": "भ",
    "cons_ma": "म",
    "cons_ya": "य",
    "cons_ra": "र",
    "cons_la": "ल",
    "cons_wa": "व",
    "cons_sha": "श",
    "cons_Sha": "ष",
    "cons_sa": "स",
    "cons_ha": "ह",
    
    # Matras
    "matra_ka": "क",
    "matra_kaa": "का",
    "matra_ki": "कि",
    "matra_kee": "की",
    "matra_ku": "कु",
    "matra_koo": "कू",
    "matra_ke": "के",
    "matra_kai": "कै",
    "matra_ko": "को",
    "matra_kau": "कौ",
    
    # Matras (Kha)
    "matra_kha": "ख",
    "matra_khaa": "खा",
    "matra_khi": "खि",
    "matra_khee": "खी",
    "matra_khu": "खु",
    "matra_khoo": "खू",
    "matra_khe": "खे",
    "matra_khai": "खै",
    "matra_kho": "खो",
    "matra_khau": "खौ",

    # Matras (Ga)
    "matra_ga": "ग",
    "matra_gaa": "गा",
    "matra_gi": "गि",
    "matra_gee": "गी",
    "matra_gu": "गु",
    "matra_goo": "गू",
    "matra_ge": "गे",
    "matra_gai": "गै",
    "matra_go": "गो",
    "matra_gau": "गौ",

    # Matras (Gha)
    "matra_gha": "घ",
    "matra_ghaa": "घा",
    "matra_ghi": "घि",
    "matra_ghee": "घी",
    "matra_ghu": "घु",
    "matra_ghoo": "घू",
    "matra_ghe": "घे",
    "matra_ghai": "घै",
    "matra_gho": "घो",
    "matra_ghau": "घौ",

    # Matras (Cha)
    "matra_cha": "च",
    "matra_chaa": "चा",
    "matra_chi": "चि",
    "matra_chee": "ची",
    "matra_chu": "चु",
    "matra_choo": "चू",
    "matra_che": "चे",
    "matra_chai": "चै",
    "matra_cho": "चो",
    "matra_chau": "चौ",
    
    # Syllables
    "syl_maa": "मा",
    "syl_naa": "ना",
    "syl_raa": "रा",
    "syl_baa": "बा",
    "syl_kee": "की",
    "syl_nee": "नी",
    "syl_pu": "पु",
    "syl_re": "रे",
    
    # Words
    "word_ma": "म",
    "word_ghar": "घर",
    "word_baabaa": "बाबा",
    "word_mamee": "ममी",
    "word_maa": "मा",
    "word_paanee": "पानी",
    "word_khaanaa": "खाना",
    "word_raamro": "राम्रो",
    "word_saathee": "साथी",
    "word_aama": "आमा",
    "word_buwa": "बुवा",
    "word_namaste": "नमस्ते",
    "word_dhanyabaad": "धन्यवाद",
    "word_hajur": "हजुर",
    "word_hoina": "होइन",
    "word_thikchhha": "ठीक छ",
    
    # Phrases
    "phrase_namaste": "नमस्ते",
    "phrase_ma_thik_chhu": "म ठीक छु",
    "phrase_malai_paani": "मलाई पानी चाहिन्छ",
    "phrase_ma_ghar": "म घर जान्छु",
    "phrase_dhanyabaad": "धन्यवाद"
}

def pcm_to_wav(pcm_data):
    """Wrap raw PCM bytes into a WAV file in memory.
    Gemini TTS outputs: mono, 16-bit, 24kHz PCM."""
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wf:
        wf.setnchannels(1)        # Mono
        wf.setsampwidth(2)        # 16-bit (2 bytes)
        wf.setframerate(24000)    # 24kHz sample rate
        wf.writeframes(pcm_data)
    wav_buffer.seek(0)
    return wav_buffer.getvalue()

def synthesize_audio(text, output_path, client, voice_name):
    """Generate audio for text using Gemini TTS, wrap PCM into WAV, and save."""
    tts_prompt = f"Say exactly: {text}"
    try:
        # Rate limit: 10 requests per minute
        time.sleep(6.1)
        tts_response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=tts_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=voice_name
                        )
                    )
                ),
            ),
        )

        # Extract raw PCM audio data from response
        pcm_data = None
        for part in tts_response.candidates[0].content.parts:
            if part.inline_data:
                pcm_data = part.inline_data.data
                break

        if pcm_data:
            # Wrap raw PCM into a proper WAV file
            wav_data = pcm_to_wav(pcm_data)
            with open(output_path, "wb") as f:
                f.write(wav_data)
            print(f'WAV written: "{output_path}" ({len(wav_data)} bytes)')
        else:
            print(f"Warning: No audio data returned for '{text}'")
    except Exception as e:
        print(f"Error synthesizing '{text}' with {voice_name}: {e}")

def main():
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY is not set")
        return

    client = genai.Client(api_key=api_key)

    voices = {
        "female": "Aoede",
        "male": "Puck"
    }

    base_dir = "/Users/kalash/Documents/dev/nep/kurra/assets/audio"

    for voice_type, voice_name in voices.items():
        phrases_dir = os.path.join(base_dir, voice_type, "phrases")
        script_dir = os.path.join(base_dir, voice_type, "script")

        os.makedirs(phrases_dir, exist_ok=True)
        os.makedirs(script_dir, exist_ok=True)

        print(f"\nGenerating phrase audio for {voice_type} ({voice_name})...")
        for filename, text in phrases_map.items():
            out_path = os.path.join(phrases_dir, f"{filename}.wav")
            if not os.path.exists(out_path):
                synthesize_audio(text, out_path, client, voice_name)

        print(f"\nGenerating script audio for {voice_type} ({voice_name})...")
        for filename, text in script_map.items():
            out_path = os.path.join(script_dir, f"{filename}.wav")
            if not os.path.exists(out_path):
                synthesize_audio(text, out_path, client, voice_name)

    print("\nAll audio generated successfully!")

if __name__ == "__main__":
    main()
