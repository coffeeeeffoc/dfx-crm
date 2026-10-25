"""Re-recognize ASR repetition/hallucination candidates, retaining originals."""
import json
import os
from pathlib import Path
import subprocess
import torch
from transcribe import ROOT, MODEL, OUTPUT, save

torch_lib = Path(torch.__file__).parent / 'lib'
os.environ['PATH'] = str(torch_lib) + os.pathsep + os.environ['PATH']
handle = os.add_dll_directory(str(torch_lib))
from faster_whisper import WhisperModel
from opencc import OpenCC
model = WhisperModel(str(MODEL), device='cuda', compute_type='int8_float16')
convert = OpenCC('t2s')
reports = []
manifest = json.loads((OUTPUT / 'manifest.json').read_text(encoding='utf-8'))
for meta in manifest:
    source = ROOT / 'materials' / meta['source']
    path = OUTPUT / f'{source.stem}.json'
    segments = json.loads(path.read_text(encoding='utf-8'))
    for segment in segments:
        if not (segment['compression_ratio'] > 2.5 or segment['text'] in ['简体中文字幕。', '见见见']):
            continue
        clip = ROOT / '.cache' / 'recheck.wav'
        start = max(0, segment['start'] - 1)
        end = min(meta['duration'], segment['end'] + 1)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(start), '-i', str(source), '-t', str(end - start), '-ac', '1', '-ar', '16000', str(clip)], check=True)
        result, info = model.transcribe(str(clip), language='zh', beam_size=5, vad_filter=True, condition_on_previous_text=False)
        revised = ' '.join(convert.convert(s.text).strip() for s in result)
        reports.append({'file': source.name, 'start': segment['start'], 'end': segment['end'], 'first_pass': segment['text'], 'second_pass': revised})
        segment['first_pass_text'] = segment['text']
        segment['second_pass_text'] = revised
        segment['text'] = f'【疑似误识别，需听原音复核】二次识别：{revised}' if revised else '【此处未识别出可靠语音，需听原音复核】'
    save(source, meta['duration'], segments)
(OUTPUT / 'recheck-notes.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(reports, ensure_ascii=False, indent=2))
