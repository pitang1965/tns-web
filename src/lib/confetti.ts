import confetti from 'canvas-confetti';

/**
 * Web Audio APIで祝福のチャイム音を鳴らす
 * ド→ミ→ソ→高いドの和音を順に鳴らし、最後に同時和音で締める
 */
export function playCelebrationSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // ド→ミ→ソ→高ドのアルペジオ + 最後に和音
    const notes = [
      { freq: 523.25, start: 0, duration: 0.15 }, // C5
      { freq: 659.25, start: 0.12, duration: 0.15 }, // E5
      { freq: 783.99, start: 0.24, duration: 0.15 }, // G5
      { freq: 1046.5, start: 0.36, duration: 0.3 }, // C6
      // 締めの和音
      { freq: 523.25, start: 0.5, duration: 0.4 }, // C5
      { freq: 659.25, start: 0.5, duration: 0.4 }, // E5
      { freq: 783.99, start: 0.5, duration: 0.4 }, // G5
      { freq: 1046.5, start: 0.5, duration: 0.4 }, // C6
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(0.08, now + note.start);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + note.start + note.duration
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.05);
    }

    // AudioContextをクリーンアップ
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Web Audio API非対応の場合は無視
  }
}

/**
 * くす玉が割れるような紙吹雪を発射する
 * 投稿完了時や新規作成完了時などのお祝いに使用
 */
export function celebrateSubmission() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // くす玉が割れるような複数方向への発射
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
