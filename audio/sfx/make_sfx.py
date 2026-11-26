#!/usr/bin/env python3
"""Звуковые эффекты «РобикЛаб.Старт»: синтез на чистом Python, без внешних библиотек.

Запуск:  python3 audio/sfx/make_sfx.py      (нужен ffmpeg — он добавляет «воздух» и сжимает в mp3)
Имена файлов совпадают с методами RL.Sfx в js/fx.js: pop, tap, success, fanfare, melt, chime, whoosh, star.
"""
import math, os, random, struct, subprocess, tempfile, wave

SR = 44100
OUT = os.path.dirname(os.path.abspath(__file__))
random.seed(7)


def buf(sec):
    return [0.0] * int(SR * sec)


def add(dst, src, at=0.0, gain=1.0):
    o = int(at * SR)
    for i, v in enumerate(src):
        if o + i < len(dst):
            dst[o + i] += v * gain


def mallet(freq, dur, partials, attack=0.004):
    """Удар по пластинке: набор частичных тонов, каждый со своим затуханием."""
    n = int(SR * dur)
    out = [0.0] * n
    for mult, amp, decay in partials:
        w = 2 * math.pi * freq * mult / SR
        for i in range(n):
            t = i / SR
            env = min(1.0, t / attack) * math.exp(-t * decay)
            out[i] += amp * env * math.sin(w * i)
    return out


def marimba(freq, dur=0.5):      # тёплое дерево
    return mallet(freq, dur, [(1, 1.0, 9), (4, 0.28, 28), (10, 0.06, 60)])


def glock(freq, dur=0.9):        # колокольчик-металлофон
    return mallet(freq, dur, [(1, 1.0, 5), (2.76, 0.35, 9), (5.4, 0.16, 16), (8.9, 0.06, 30)])


def sweep(f0, f1, dur, decay=12, kind='sine'):
    """Скользящий тон (экспоненциально от f0 к f1)."""
    n = int(SR * dur)
    out, ph = [0.0] * n, 0.0
    for i in range(n):
        t = i / SR
        f = f0 * (f1 / f0) ** (t / dur)
        ph += 2 * math.pi * f / SR
        s = math.sin(ph) if kind == 'sine' else (2 / math.pi) * math.asin(math.sin(ph))
        out[i] = s * min(1.0, t / 0.004) * math.exp(-t * decay)
    return out


def noise_sweep(dur, f0, f1, q=2.2):
    """Шум через полосовой фильтр с плывущей частотой — «вжух»."""
    n = int(SR * dur)
    out, low, band = [0.0] * n, 0.0, 0.0
    for i in range(n):
        t = i / n
        fc = f0 * (f1 / f0) ** t
        f = 2 * math.sin(math.pi * fc / SR)
        x = random.uniform(-1, 1)
        low += f * band
        high = x - low - band / q
        band += f * high
        out[i] = band * math.sin(math.pi * t) ** 1.5   # плавный вход и выход
    return out


def sfx_tap():
    b = buf(0.12)
    add(b, mallet(880, 0.1, [(1, 1.0, 55), (2.4, 0.4, 90)], attack=0.001))
    return b


def sfx_pop():
    b = buf(0.22)
    add(b, sweep(260, 880, 0.14, decay=22))
    add(b, mallet(1300, 0.08, [(1, 0.25, 70)], attack=0.001), at=0.005)
    return b


def sfx_success():
    b = buf(1.0)
    for k, f in enumerate([523.25, 659.25, 783.99]):
        add(b, marimba(f, 0.6), at=k * 0.09)
        add(b, glock(f * 2, 0.5), at=k * 0.09, gain=0.18)
    return b


def sfx_fanfare():
    b = buf(2.2)
    for k, f in enumerate([523.25, 659.25, 783.99]):
        add(b, marimba(f, 0.45), at=k * 0.12)
        add(b, glock(f * 2, 0.5), at=k * 0.12, gain=0.25)
    for f, g in [(1046.5, 1.0), (783.99, 0.55), (1318.5, 0.5)]:       # итоговый аккорд
        add(b, glock(f, 1.6), at=0.36, gain=g * 0.7)
        add(b, marimba(f / 2, 0.9), at=0.36, gain=g * 0.6)
    for k in range(7):                                                 # искорки
        add(b, glock(random.choice([2093, 2637, 3136, 3520]), 0.4), at=0.5 + k * 0.11, gain=0.12)
    return b


def sfx_chime():
    b = buf(1.9)
    for k, f in enumerate([783.99, 1046.5, 1318.5]):
        add(b, glock(f, 1.5), at=k * 0.14, gain=0.8)
    return b


def sfx_star():
    b = buf(0.9)
    add(b, glock(1318.5, 0.5), gain=0.7)
    add(b, glock(1760.0, 0.7), at=0.08, gain=0.8)
    add(b, glock(2637.0, 0.5), at=0.15, gain=0.25)
    return b


def sfx_whoosh():
    b = buf(0.5)
    add(b, noise_sweep(0.42, 300, 3200), gain=1.0)
    add(b, sweep(180, 620, 0.4, decay=5), gain=0.12)
    return b


def sfx_melt():
    b = buf(1.6)
    add(b, sweep(1500, 420, 0.5, decay=6), gain=0.45)                  # «таяние» вниз
    for k, f in enumerate([2093, 1760, 1568, 1318.5, 1046.5, 880]):   # капельки-льдинки
        add(b, glock(f, 0.6), at=0.05 + k * 0.1, gain=0.4)
    add(b, sweep(500, 1100, 0.09, decay=30), at=0.85, gain=0.5)        # капля
    return b


def save(name, samples, tail=True):
    peak = max(abs(v) for v in samples) or 1.0
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v / peak * 0.85)) * 32767)) for v in samples))
    fx = 'aecho=0.8:0.5:45|90:0.22|0.12,' if tail else ''
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp,
                    '-af', fx + 'afade=t=out:st=%.3f:d=0.05,alimiter=limit=0.9' % max(0, len(samples) / SR - 0.05),
                    '-ac', '1', '-ar', '44100', '-b:a', '96k', os.path.join(OUT, name + '.mp3')], check=True)
    os.remove(tmp)
    print('%-8s %.2f c' % (name, len(samples) / SR))


if __name__ == '__main__':
    save('tap', sfx_tap(), tail=False)
    save('pop', sfx_pop(), tail=False)
    save('success', sfx_success())
    save('fanfare', sfx_fanfare())
    save('chime', sfx_chime())
    save('star', sfx_star())
    save('whoosh', sfx_whoosh(), tail=False)
    save('melt', sfx_melt())
