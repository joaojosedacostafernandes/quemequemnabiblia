#!/usr/bin/env python
"""Transcreve os mp3 do podcast com faster-whisper (GPU se disponivel).

Uso: python scripts/transcribe-podcast.py <audio_dir> <out_dir> [--model large-v3]
- Deteta o idioma por ficheiro (ha episodios em PT e em EN).
- Escreve <base>.txt (texto corrido) e <base>.srt (com tempos) em out_dir.
- Salta ficheiros ja transcritos (existe <base>.txt). Escreve primeiro para
  .part e so renomeia no fim, para um crash a meio nao marcar como feito.
"""
import sys, os, glob, argparse
# Forcar UTF-8 no stdout/stderr: os nomes dos ficheiros tem acentos e '?'/':'
# em largura total (？/：) que rebentam com o cp1252 do Windows.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("audio_dir")
ap.add_argument("out_dir")
ap.add_argument("--model", default=os.environ.get("WHISPER_MODEL", "large-v3"))
ap.add_argument("--force", action="store_true")
args = ap.parse_args()


def make_model():
    try:
        m = WhisperModel(args.model, device="cuda", compute_type="float16")
        print(f"[model] {args.model} device=cuda float16", flush=True)
        return m
    except Exception as e:
        print(f"[model] cuda indisponivel ({e}); a usar cpu int8", flush=True)
        m = WhisperModel(args.model, device="cpu", compute_type="int8")
        print(f"[model] {args.model} device=cpu int8", flush=True)
        return m


def fmt_ts(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


def main():
    os.makedirs(args.out_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(args.audio_dir, "*.mp3")))
    print(f"[scan] {len(files)} ficheiros em {args.audio_dir}", flush=True)
    model = make_model()
    done = 0
    for f in files:
        base = os.path.splitext(os.path.basename(f))[0]
        txt_path = os.path.join(args.out_dir, base + ".txt")
        srt_path = os.path.join(args.out_dir, base + ".srt")
        if os.path.exists(txt_path) and not args.force:
            print(f"[skip] {base}", flush=True); continue
        print(f"[transcrever] {base}", flush=True)
        try:
            segments, info = model.transcribe(f, language=None, vad_filter=True, beam_size=5)
            print(f"  lang={info.language} p={info.language_probability:.2f} dur={info.duration:.0f}s", flush=True)
            with open(txt_path + ".part", "w", encoding="utf-8") as tf, open(srt_path + ".part", "w", encoding="utf-8") as sf:
                i = 0
                for seg in segments:
                    i += 1
                    tf.write(seg.text.strip() + " ")
                    sf.write(f"{i}\n{fmt_ts(seg.start)} --> {fmt_ts(seg.end)}\n{seg.text.strip()}\n\n")
                    if i % 25 == 0:
                        print(f"    ...{fmt_ts(seg.end)}", flush=True)
            os.replace(txt_path + ".part", txt_path)
            os.replace(srt_path + ".part", srt_path)
            done += 1
            print(f"  [ok] {txt_path}", flush=True)
        except Exception as e:
            print(f"  [ERRO] {base}: {e}", flush=True)
    print(f"[DONE] transcritos nesta corrida: {done}", flush=True)


main()
