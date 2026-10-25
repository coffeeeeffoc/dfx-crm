"""Local Chinese ASR. Original WAVs are never modified or uploaded."""
import argparse
import dataclasses
import json
import os
from pathlib import Path
import subprocess
import sys
import wave

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / '.cache' / 'faster-whisper-large-v3-turbo'
OUTPUT = ROOT / 'materials' / 'transcripts'
REVISION = '0a363e9161cbc7ed1431c9597a8ceaf0c4f78fcf'


def timestamp(seconds):
    total = int(seconds)
    return f'{total // 3600:02}:{total // 60 % 60:02}:{total % 60:02}'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--download-only', action='store_true')
    args = parser.parse_args()
    MODEL.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name in ['config.json', 'preprocessor_config.json', 'tokenizer.json', 'vocabulary.json', 'model.bin']:
        path = MODEL / name
        if path.exists():
            continue
        print(f'Downloading {name}', flush=True)
        partial = path.with_suffix(path.suffix + '.part')
        subprocess.run(['curl.exe', '-fL', '--retry', '3', '--connect-timeout', '20',
                        '--max-time', '1800', '-C', '-', '-o', str(partial),
                        f'https://huggingface.co/dropbox-dash/faster-whisper-large-v3-turbo/resolve/{REVISION}/{name}'], check=True)
        partial.replace(path)
    if args.download_only:
        return

    import torch
    torch_lib = Path(torch.__file__).parent / 'lib'
    os.environ['PATH'] = str(torch_lib) + os.pathsep + os.environ['PATH']
    dll_handle = os.add_dll_directory(str(torch_lib)) if sys.platform == 'win32' else None
    from faster_whisper import WhisperModel, BatchedInferencePipeline
    from opencc import OpenCC
    converter = OpenCC('t2s')
    model = BatchedInferencePipeline(WhisperModel(str(MODEL), device='cuda', compute_type='int8_float16'))
    manifest = []
    for source in sorted((ROOT / 'materials').glob('*.wav')):
        with wave.open(str(source)) as wav:
            duration = wav.getnframes() / wav.getframerate()
        segments = []
        for offset in range(0, int(duration) + 1, 300):
            chunk_json = OUTPUT / f'.{source.stem}-{offset}.json'
            if chunk_json.exists():
                segments.extend(json.loads(chunk_json.read_text(encoding='utf-8')))
                continue
            print(f'{source.name} {timestamp(offset)} / {timestamp(duration)}', flush=True)
            chunk = ROOT / '.cache' / 'asr-chunk.wav'
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(offset),
                            '-i', str(source), '-t', '300', '-ac', '1', '-ar', '16000', str(chunk)], check=True)
            generated, info = model.transcribe(str(chunk), language='zh', task='transcribe', beam_size=5,
                batch_size=4, vad_filter=True, condition_on_previous_text=False,
                initial_prompt='这是一段关于客户关系管理系统的中文会议录音。简体中文。CRM，星谱，鼎信，线索，跟进项目，报价，供应商，公海，库存。')
            part = []
            for seg in generated:
                item = dataclasses.asdict(seg)
                item['start'] += offset
                item['end'] += offset
                item['raw_text'] = item['text']
                item['text'] = converter.convert(item['text']).strip()
                if item['words']:
                    for word in item['words']:
                        word['start'] += offset
                        word['end'] += offset
                part.append(item)
            chunk_json.write_text(json.dumps(part, ensure_ascii=False, indent=2), encoding='utf-8')
            segments.extend(part)
            print(f'  recognized {len(part)} segments', flush=True)
            # Each completed chunk is durable, so interrupted runs resume without duplicating speech.
            save(source, duration, segments)
        save(source, duration, segments)
        manifest.append({'source': source.name, 'duration': duration, 'segments': len(segments),
                         'last_speech_end': segments[-1]['end'] if segments else None,
                         'model': 'faster-whisper-large-v3-turbo', 'revision': REVISION})
        (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'Completed {source.name}: {len(segments)} segments', flush=True)


def save(source, duration, segments):
    header = (f'# {source.stem} 中文转录\n\n'
              f'原文件：{source.name}\n时长：{timestamp(duration)}\n'
              '方式：本机 Whisper large-v3-turbo，中文识别，简体转换。\n'
              '说明：机器逐段转录，未做说话人身份识别或全文人工逐字校对；人名、品牌和重叠发言可能误识别。'
              '时间戳对应本文件，不把语音识别稿视作最终需求确认。原始识别与置信度保留在同名 JSON。\n\n')
    body = '\n\n'.join(f'[{timestamp(s["start"])} – {timestamp(s["end"])}] {s["text"]}' for s in segments)
    (OUTPUT / f'{source.stem}.md').write_text(header + body + '\n', encoding='utf-8')
    (OUTPUT / f'{source.stem}.txt').write_text(header.replace('# ', '') + body + '\n', encoding='utf-8')
    (OUTPUT / f'{source.stem}.json').write_text(json.dumps(segments, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    assert timestamp(3661) == '01:01:01'
    main()
