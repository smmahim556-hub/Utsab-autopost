# Voice clone demo: speak each line of a JSON list in the reference voice with AI4Bharat's IndicF5 (Bengali).
import json, sys
import numpy as np, soundfile as sf
from transformers import AutoModel

ref, ref_text, lines_file, out_dir = sys.argv[1:5]
model = AutoModel.from_pretrained("ai4bharat/IndicF5", trust_remote_code=True)
for i, line in enumerate(json.load(open(lines_file, encoding="utf-8"))):
    audio = np.asarray(model(line, ref_audio_path=ref, ref_text=ref_text))
    if audio.dtype == np.int16:
        audio = audio.astype(np.float32) / 32768.0
    sf.write(f"{out_dir}/{i}.wav", audio.astype(np.float32), samplerate=24000)
    print("line", i, "done", flush=True)
