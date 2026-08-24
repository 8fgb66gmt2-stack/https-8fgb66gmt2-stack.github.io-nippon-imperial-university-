(() => {
  'use strict';

  const AUDIO_SRC = 'https://peritune.com/music/PerituneMaterial_TaishoRoman_Theme2.mp3';

  function initGramophone() {
    const section = document.querySelector('.gramophone-section');
    if (!section) return;

    const audio = section.querySelector('audio');
    if (!audio) return;

    const buttons = [...section.querySelectorAll('button')];
    const playButton = buttons.find(b => /再生|play/i.test(b.textContent || ''));
    const stopButton = buttons.find(b => /停止|stop|pause/i.test(b.textContent || ''));
    const status = section.querySelector('.player-status, .audio-status, [data-player-status]');

    const setStatus = text => {
      if (status) status.textContent = text;
    };

    audio.preload = 'auto';

    function ensureSource() {
      const current = audio.getAttribute('src');
      if (!current || current === window.location.href || current !== AUDIO_SRC) {
        audio.src = AUDIO_SRC;
      }
    }

    async function play() {
      try {
        ensureSource();
        if (audio.readyState === 0) audio.load();
        await audio.play();
        setStatus('再生中');
      } catch (error) {
        console.error('[Gramophone] playback failed:', error);
        setStatus('再生できません');
      }
    }

    function stop() {
      audio.pause();
      audio.currentTime = 0;
      setStatus('停止中');
    }

    if (playButton) {
      const clone = playButton.cloneNode(true);
      playButton.replaceWith(clone);
      clone.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        play();
      });
    }

    if (stopButton) {
      const clone = stopButton.cloneNode(true);
      stopButton.replaceWith(clone);
      clone.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        stop();
      });
    }

    audio.addEventListener('playing', () => setStatus('再生中'));
    audio.addEventListener('pause', () => {
      if (!audio.ended) setStatus('停止中');
    });
    audio.addEventListener('ended', () => setStatus('停止中'));
    audio.addEventListener('error', () => {
      console.error('[Gramophone] media error:', audio.error);
      setStatus('音源を読み込めません');
    });

    ensureSource();
    setStatus(audio.paused ? '停止中' : '再生中');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGramophone, { once: true });
  } else {
    initGramophone();
  }
})();
