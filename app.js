document.addEventListener('DOMContentLoaded', () => {
  // Global Audio Engine
  const audio = document.getElementById('global-audio-element');
  const playerBar = document.getElementById('player-bar');
  const nowTitle = document.getElementById('now-title');
  const nowStatus = document.getElementById('now-status');
  const pulseDot = document.querySelector('.pulse-dot');
  const btnMasterToggle = document.getElementById('btn-master-toggle');
  const currentTimeEl = document.getElementById('current-time');
  const totalDurationEl = document.getElementById('total-duration');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const volSlider = document.getElementById('vol-slider');
  const volIcon = document.getElementById('vol-icon');
  const btnRewind = document.getElementById('btn-rewind');
  const btnForward = document.getElementById('btn-forward');

  let currentSource = '';
  let currentActiveBtn = null;
  let currentActiveCard = null;
  let currentPlaybackRate = 1.0;
  let teacherMode = false;

  // Format seconds to mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Play a specific audio source
  function playAudio(src, title, triggerBtn, cardEl = null) {
    if (currentSource === src && !audio.paused) {
      // Pause
      audio.pause();
      return;
    }

    if (currentSource !== src) {
      currentSource = src;
      audio.src = src;
      audio.load();
    }

    audio.playbackRate = currentPlaybackRate;
    audio.play().then(() => {
      updateUIForPlaying(title, triggerBtn, cardEl);
    }).catch(err => {
      console.warn("Playback error:", err);
    });
  }

  function updateUIForPlaying(title, triggerBtn, cardEl) {
    // Reset previous button
    resetAllButtons();

    currentActiveBtn = triggerBtn;
    currentActiveCard = cardEl;

    if (triggerBtn) {
      triggerBtn.classList.add('playing');
      const icon = triggerBtn.querySelector('.play-icon') || triggerBtn.querySelector('.audio-btn-icon');
      if (icon) icon.textContent = '⏸';
      
      // Activate equalizer in the same card or row
      const parent = triggerBtn.closest('.card-audio-row') || triggerBtn.closest('.option-audio-action');
      if (parent) {
        const eq = parent.querySelector('.equalizer');
        if (eq) eq.classList.add('active');
      }
    }

    if (cardEl) {
      cardEl.classList.add('active-playing');
    }

    // Update Floating bar
    nowTitle.textContent = title || 'Đang phát âm thanh';
    nowStatus.textContent = 'Đang phát • ' + currentPlaybackRate + 'x';
    pulseDot.classList.add('active');
    btnMasterToggle.textContent = '⏸';
  }

  function updateUIForPaused() {
    if (currentActiveBtn) {
      currentActiveBtn.classList.remove('playing');
      const icon = currentActiveBtn.querySelector('.play-icon') || currentActiveBtn.querySelector('.audio-btn-icon');
      if (icon) icon.textContent = '▶';
    }

    // Deactivate all equalizers
    document.querySelectorAll('.equalizer').forEach(eq => eq.classList.remove('active'));
    document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active-playing'));

    pulseDot.classList.remove('active');
    nowStatus.textContent = 'Đã tạm dừng';
    btnMasterToggle.textContent = '▶';
  }

  function resetAllButtons() {
    document.querySelectorAll('.btn-play-audio, .btn-master-play, .btn-inline-play').forEach(btn => {
      btn.classList.remove('playing');
      const icon = btn.querySelector('.play-icon') || btn.querySelector('.audio-btn-icon');
      if (icon) icon.textContent = '▶';
    });
    document.querySelectorAll('.equalizer').forEach(eq => eq.classList.remove('active'));
    document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active-playing'));
  }

  // Audio Event Listeners
  audio.addEventListener('play', () => {
    btnMasterToggle.textContent = '⏸';
    pulseDot.classList.add('active');
  });

  audio.addEventListener('pause', () => {
    updateUIForPaused();
  });

  audio.addEventListener('ended', () => {
    updateUIForPaused();
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    nowStatus.textContent = 'Đã hoàn tất';
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = `${pct}%`;
      currentTimeEl.textContent = formatTime(audio.currentTime);
      totalDurationEl.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    totalDurationEl.textContent = formatTime(audio.duration);
  });

  // Progress Bar Seek
  progressContainer.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  });

  // Floating Master Play/Pause
  btnMasterToggle.addEventListener('click', () => {
    if (!currentSource) {
      // Default to playing full track
      playAudio('audio/bai3_full.mp3', 'Bài 3: Toàn bộ bài nghe (Track 22)', document.getElementById('play-bai3-full'));
      return;
    }
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  // Rewind / Forward 3s
  btnRewind.addEventListener('click', () => {
    if (audio.duration) {
      audio.currentTime = Math.max(0, audio.currentTime - 3);
    }
  });

  btnForward.addEventListener('click', () => {
    if (audio.duration) {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 3);
    }
  });

  // Volume
  volSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
    volIcon.textContent = audio.volume === 0 ? '🔇' : (audio.volume < 0.5 ? '🔉' : '🔊');
  });

  // Speed Controls
  document.querySelectorAll('.btn-speed').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPlaybackRate = parseFloat(btn.dataset.speed);
      audio.playbackRate = currentPlaybackRate;
      if (!audio.paused) {
        nowStatus.textContent = 'Đang phát • ' + currentPlaybackRate + 'x';
      }
    });
  });

  // Navigation Tab Switching
  document.querySelectorAll('.tab-btn').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      tabBtn.classList.add('active');
      tabBtn.setAttribute('aria-selected', 'true');
      const targetPanel = document.getElementById(tabBtn.dataset.tab);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // Wire all Play Audio Buttons
  document.querySelectorAll('.btn-play-audio, .btn-master-play, .btn-inline-play').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = btn.dataset.src;
      const title = btn.dataset.title || btn.textContent.trim();
      const card = btn.closest('.question-card');
      playAudio(src, title, btn, card);
    });
  });

  // True / False Quiz Buttons
  document.querySelectorAll('.btn-choice').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.question-card');
      const choice = btn.dataset.choice;
      const correct = btn.dataset.correct;

      // Remove states from sibling choice buttons
      card.querySelectorAll('.btn-choice').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong');
      });

      if (choice === correct) {
        btn.classList.add('selected-correct');
      } else {
        btn.classList.add('selected-wrong');
      }

      // Automatically show answer drawer
      const drawer = card.querySelector('.answer-drawer');
      if (drawer) {
        drawer.classList.remove('hidden');
        const revealBtn = card.querySelector('.btn-reveal-card');
        if (revealBtn) revealBtn.textContent = 'Ẩn lời thoại ▴';
      }
    });
  });

  // Individual Drawer Reveal
  document.querySelectorAll('.btn-reveal-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const drawer = document.getElementById(targetId);
      if (drawer) {
        drawer.classList.toggle('hidden');
        btn.textContent = drawer.classList.contains('hidden') ? 'Xem lời thoại & Đáp án ▾' : 'Ẩn lời thoại ▴';
      }
    });
  });

  // Teacher Mode: Toggle All Answers
  const toggleAnswersBtn = document.getElementById('toggle-all-answers');
  const toggleAnswersText = document.getElementById('toggle-answers-text');

  toggleAnswersBtn.addEventListener('click', () => {
    teacherMode = !teacherMode;
    toggleAnswersBtn.classList.toggle('active', teacherMode);
    toggleAnswersText.textContent = teacherMode ? 'Ẩn đáp án' : 'Hiện đáp án';

    // Bài 3: Reveal drawers and highlight correct T/F
    document.querySelectorAll('.answer-drawer').forEach(drawer => {
      if (teacherMode) {
        drawer.classList.remove('hidden');
      } else {
        drawer.classList.add('hidden');
      }
    });

    document.querySelectorAll('.btn-reveal-card').forEach(btn => {
      btn.textContent = teacherMode ? 'Ẩn lời thoại ▴' : 'Xem lời thoại & Đáp án ▾';
    });

    document.querySelectorAll('.question-card').forEach(card => {
      const choices = card.querySelectorAll('.btn-choice');
      choices.forEach(btn => {
        if (teacherMode) {
          if (btn.dataset.choice === btn.dataset.correct) {
            btn.classList.add('selected-correct');
          } else {
            btn.classList.remove('selected-correct', 'selected-wrong');
          }
        } else {
          btn.classList.remove('selected-correct', 'selected-wrong');
        }
      });
    });

    // Bài 2: Check correct options and show evidence
    const chkLocation = document.getElementById('chk-location');
    const chkTickets = document.getElementById('chk-tickets');
    const chkGuests = document.getElementById('chk-guests');
    const chkDecoration = document.getElementById('chk-decoration');

    if (chkLocation) chkLocation.checked = teacherMode;
    if (chkTickets) chkTickets.checked = teacherMode;
    if (chkGuests) chkGuests.checked = false;
    if (chkDecoration) chkDecoration.checked = false;

    document.querySelectorAll('.option-evidence').forEach(ev => {
      if (teacherMode) {
        ev.classList.remove('hidden');
      } else {
        ev.classList.add('hidden');
      }
    });
  });
});
