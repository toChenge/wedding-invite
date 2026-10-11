/* =========================================================
   李庆铎 ♥ 张雪 · 婚礼邀请函
   交互：花瓣 / 音乐 / 日历 / 倒计时 / 点图看大图 /
         导航复制 / 祝福留言 / 分享
   ========================================================= */
(function () {
  'use strict';

  /* -------- 基本设置 -------- */
  var WEDDING_TS = new Date('2026-10-26T00:00:00+08:00').getTime();
  var VENUE = '水泊梁山风味酒楼';
  var ADDRESS = '济宁市任城区水泊梁山风味酒楼（常青路与济安桥路交界处）';
  var MAP_URL = 'https://uri.amap.com/search?keyword=' + encodeURIComponent(VENUE + ' ' + ADDRESS) +
    '&city=' + encodeURIComponent('济宁') + '&view=map&callnative=1';

  /* 页面上出现的照片，顺序与 data-idx 对应（每张只出现一次） */
  var PAGE_PHOTOS = ['p03', 'p01', 'p05', 'p02', 'p08', 'p04', 'p09', 'p07', 'p06'];
  var PAGE_LABELS = ['封面', '婚礼邀请函', '邀请语', '请柬', '新人', '喜', '日子', '题诗', '地点'];

  var photos = window.WEDDING_PHOTOS || {};
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* =========================================================
     1. 花瓣
     ========================================================= */
  var canvas = $('petals');
  var ctx = canvas && canvas.getContext('2d');
  var bits = [];
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var COLORS = [
    'rgba(255, 214, 214, .85)',
    'rgba(255, 236, 224, .9)',
    'rgba(255, 190, 190, .75)',
    'rgba(255, 255, 255, .85)',
    'rgba(255, 226, 200, .8)'
  ];

  function sizeCanvas() {
    if (!canvas) return;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePetal(x, y, spread) {
    return {
      x: x === undefined ? Math.random() * W : x,
      y: y === undefined ? -20 : y,
      vx: (-0.35 + Math.random() * 0.7) + (spread ? (-2 + Math.random() * 4) : 0),
      vy: (0.35 + Math.random() * 0.6) + (spread ? (-1.6 + Math.random() * 2.4) : 0),
      r: 3.5 + Math.random() * 4.5,
      rot: Math.random() * Math.PI * 2,
      vr: (-0.5 + Math.random()) * 0.02,
      sway: 0.3 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: spread ? 260 : 1
    };
  }

  function petalBurst(n, x, y) {
    if (!ctx || reduceMotion) return;
    for (var i = 0; i < n && bits.length < 220; i++) bits.push(makePetal(x, y, true));
  }

  if (canvas && ctx) {
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    var t0 = 0;
    (function loop(now) {
      now = now || 0;
      var dt = Math.min(32, now - t0) / 16.7;
      t0 = now;
      if (!dt || dt < 0) dt = 1;
      ctx.clearRect(0, 0, W, H);
      if (!document.hidden && !reduceMotion && bits.length < 24) bits.push(makePetal());
      for (var i = bits.length - 1; i >= 0; i--) {
        var p = bits[i];
        p.phase += 0.012;
        p.x += (p.vx + Math.sin(p.phase) * p.sway) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.life !== 1) {
          p.vy += 0.012 * dt;
          p.life -= dt;
          if (p.life <= 0) { bits.splice(i, 1); continue; }
        }
        if (p.y > H + 30 || p.x < -40 || p.x > W + 40) { bits.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* =========================================================
     2. 首次交互：微信 / 浏览器需要一次点击才允许播放音乐
     ========================================================= */
  var firstTouchDone = false;

  function onFirstTouch() {
    if (firstTouchDone) return;
    firstTouchDone = true;
    tryPlayMusic();
    petalBurst(24, W * 0.5, H * 0.28);
  }

  window.addEventListener('touchstart', onFirstTouch, { passive: true });
  window.addEventListener('click', onFirstTouch);

  /* =========================================================
     3. 背景音乐
     ========================================================= */
  var bgm = $('bgm');
  var musicBtn = $('musicBtn');
  var musicIco = $('musicIco');
  var musicPill = $('musicPill');
  var musicAvailable = false;

  function setMusicState(on) {
    if (musicBtn) {
      musicBtn.classList.toggle('is-on', on);
      musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (musicIco) musicIco.textContent = on ? '♫' : '♪';
    if (musicPill) musicPill.classList.toggle('is-hidden', on);
  }

  function tryPlayMusic() {
    if (!musicAvailable || !bgm) return;
    var p = bgm.play();
    if (p && p.then) p.then(function () { setMusicState(true); }).catch(function () { setMusicState(false); });
  }

  fetch('music.mp3', { method: 'HEAD' })
    .then(function (r) {
      if (!r.ok) throw new Error('no music');
      musicAvailable = true;
      if (musicPill) musicPill.classList.remove('is-hidden');
    })
    .catch(function () {
      if (musicBtn) musicBtn.hidden = true;
      if (musicPill) musicPill.classList.add('is-hidden');
    });

  if (musicBtn) {
    musicBtn.addEventListener('click', function () {
      if (!musicAvailable || !bgm) return;
      if (bgm.paused) tryPlayMusic();
      else { bgm.pause(); setMusicState(false); }
    });
  }

  if (musicPill) musicPill.addEventListener('click', function () { tryPlayMusic(); });

  /* =========================================================
     4. 轻提示 + 分享
     ========================================================= */
  var toastEl = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    window.clearTimeout(toastEl._t);
    toastEl._t = window.setTimeout(function () { toastEl.classList.remove('is-on'); }, 2000);
  }

  var shareBtn = $('shareBtn');
  var shareTip = $('shareTip');
  var shareTipTxt = $('shareTipTxt');
  var shareTipOk = $('shareTipOk');

  function showShareTip(text) {
    if (!shareTip) return;
    if (shareTipTxt && text) shareTipTxt.textContent = text;
    shareTip.hidden = false;
  }

  if (shareTipOk) shareTipOk.addEventListener('click', function () { shareTip.hidden = true; });
  if (shareTip) shareTip.addEventListener('click', function (e) { if (e.target === shareTip) shareTip.hidden = true; });

  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var url = location.href;
      if (navigator.share) {
        navigator.share({
          title: '李庆铎 & 张雪 · 婚礼邀请函',
          text: 'our wedding · 2026.10.26 · 济宁市任城区水泊梁山风味酒楼',
          url: url
        }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          showShareTip('链接已复制，去粘贴给想邀请的人吧～（微信里点右上角「···」即可分享）');
        }).catch(function () { showShareTip(); });
        return;
      }
      showShareTip();
    });
  }

  /* =========================================================
     5. 日历（2026 年 10 月，26 号高亮）
     ========================================================= */
  (function buildCalendar() {
    var el = $('calendar');
    if (!el) return;
    var YEAR = 2026, MONTH = 9, DAY = 26;
    var first = new Date(YEAR, MONTH, 1);
    var total = new Date(YEAR, MONTH + 1, 0).getDate();
    var offset = (first.getDay() + 6) % 7;
    var week = ['一', '二', '三', '四', '五', '六', '日'];
    var html = '<div class="cal-week">' + week.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>';
    html += '<div class="cal-days">';
    for (var i = 0; i < offset; i++) html += '<span class="is-empty"></span>';
    for (var d = 1; d <= total; d++) {
      html += d === DAY ? '<span class="is-day"><b>' + d + '</b></span>' : '<span>' + d + '</span>';
    }
    html += '</div>';
    html += '<p class="cal-foot">2026年10月26日 · 星期一 · 农历九月十七</p>';
    el.innerHTML = html;
  })();

  /* =========================================================
     6. 倒计时
     ========================================================= */
  var cd = { d: $('cdD'), h: $('cdH'), m: $('cdM'), s: $('cdS') };
  var cdNote = $('cdNote');
  var last = { d: '', h: '', m: '', s: '' };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function setCell(key, val) {
    var el = cd[key];
    if (!el || last[key] === val) return;
    last[key] = val;
    el.textContent = val;
    var cell = el.parentNode;
    cell.classList.add('pop');
    window.setTimeout(function () { cell.classList.remove('pop'); }, 300);
  }

  function tick() {
    if (!cd.d) return;
    var diff = WEDDING_TS - Date.now();
    if (diff <= 0) {
      var over = Date.now() - WEDDING_TS;
      setCell('d', '00'); setCell('h', '00'); setCell('m', '00'); setCell('s', '00');
      if (cdNote) cdNote.textContent = over < 86400000 ? '就是今天 · 我们结婚啦' : '婚礼已圆满举行 · 感谢有你';
      return;
    }
    var t = Math.floor(diff / 1000);
    var d = Math.floor(t / 86400); t -= d * 86400;
    var h = Math.floor(t / 3600); t -= h * 3600;
    var m = Math.floor(t / 60); t -= m * 60;
    setCell('d', pad(d)); setCell('h', pad(h)); setCell('m', pad(m)); setCell('s', pad(t));
  }

  tick();
  window.setInterval(tick, 1000);

  /* =========================================================
     7. 点图看大图（页面上的照片都只有一张，不重复）
     ========================================================= */
  var lightbox = $('lightbox');
  var lbImg = $('lbImg');
  var lbCap = $('lbCap');
  var lbClose = $('lbClose');
  var lbPrev = $('lbPrev');
  var lbNext = $('lbNext');
  var current = 0;
  var loadedFull = {};

  function total() { return PAGE_PHOTOS.length; }

  function preload(slot) {
    if (!slot || loadedFull[slot]) return;
    loadedFull[slot] = true;
    var im = new Image();
    im.src = 'photos/' + slot + '.jpg';
  }

  function render(i) {
    var n = total();
    current = (i + n) % n;
    var slot = PAGE_PHOTOS[current];
    var meta = photos[slot] || {};
    lbImg.style.opacity = '0';
    lbImg.src = 'photos/' + slot + '.jpg';
    lbImg.alt = '李庆铎与张雪的婚纱照 ' + (current + 1);
    if (meta.w) { lbImg.width = meta.w; lbImg.height = meta.h; }
    lbImg.onload = function () { lbImg.style.opacity = '1'; };
    lbCap.textContent = PAGE_LABELS[current] + ' · ' + (current + 1) + ' / ' + n;
    preload(PAGE_PHOTOS[(current + 1) % n]);
    preload(PAGE_PHOTOS[(current - 1 + n) % n]);
  }

  function openLightbox(i) {
    if (!lightbox) return;
    lightbox.hidden = false;
    document.body.classList.add('is-locked');
    render(i);
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove('is-locked');
    lbImg.src = '';
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-idx]'), function (el) {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', function () {
      openLightbox(parseInt(el.getAttribute('data-idx'), 10) || 0);
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function (e) { e.stopPropagation(); render(current - 1); });
  if (lbNext) lbNext.addEventListener('click', function (e) { e.stopPropagation(); render(current + 1); });
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('lb-figure')) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') render(current - 1);
    if (e.key === 'ArrowRight') render(current + 1);
  });

  var tX = 0, tY = 0;
  if (lightbox) {
    lightbox.addEventListener('touchstart', function (e) {
      tX = e.changedTouches[0].clientX;
      tY = e.changedTouches[0].clientY;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tX;
      var dy = e.changedTouches[0].clientY - tY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) render(dx < 0 ? current + 1 : current - 1);
      else if (dy > 70 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
    }, { passive: true });
  }

  /* =========================================================
     8. 导航 / 复制地址 / 撒花瓣
     ========================================================= */
  var navBtn = $('navBtn');
  if (navBtn) navBtn.href = MAP_URL;

  var copyAddr = $('copyAddr');
  if (copyAddr) {
    copyAddr.addEventListener('click', function () {
      function done() { toast('地址已复制，导航搜「' + VENUE + '」也行'); }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = ADDRESS;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { toast(ADDRESS); }
        ta.remove();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ADDRESS).then(done).catch(fallback);
      } else fallback();
    });
  }

  var cheerBtn = $('cheerBtn');
  if (cheerBtn) {
    cheerBtn.addEventListener('click', function () {
      petalBurst(60, W * 0.5, H * 0.62);
      window.setTimeout(function () { petalBurst(40, W * 0.24, H * 0.55); }, 200);
      window.setTimeout(function () { petalBurst(40, W * 0.76, H * 0.55); }, 400);
      toast('谢谢你的祝福，我们不见不散');
    });
  }

  /* =========================================================
     9. 祝福留言（纯前端：提交后复制祝福，粘到微信发给新人）
     ========================================================= */
  var wishForm = $('wishForm');
  var wishName = $('wishName');
  var wishText = $('wishText');
  var wishDone = $('wishDone');
  var wishDoneText = $('wishDoneText');
  var wishCopy = $('wishCopy');
  var wishAgain = $('wishAgain');
  var lastWish = '';

  function legacyCopy(str, okMsg) {
    var ta = document.createElement('textarea');
    ta.value = str;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); if (okMsg) toast(okMsg); } catch (e) {}
    ta.remove();
  }

  function copyText(str, okMsg) {
    if (!str) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str).then(function () { if (okMsg) toast(okMsg); })
        .catch(function () { legacyCopy(str, okMsg); });
    } else legacyCopy(str, okMsg);
  }

  if (wishForm) {
    wishForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = (wishName.value || '').trim();
      var t = (wishText.value || '').trim();
      var bad = false;
      wishName.parentNode.classList.toggle('is-bad', !n);
      if (!n) bad = true;
      wishText.parentNode.classList.toggle('is-bad', !t);
      if (!t) bad = true;
      if (bad) { toast('称呼和祝福都要写一点点哦'); return; }

      lastWish = '【婚礼祝福】' + n + '：' + t;
      if (wishDoneText) wishDoneText.textContent = lastWish;
      wishForm.hidden = true;
      if (wishDone) wishDone.hidden = false;
      copyText(lastWish, '祝福已复制，粘贴到微信发给新人吧');
      petalBurst(28, W * 0.5, H * 0.6);
    });
  }

  if (wishCopy) {
    wishCopy.addEventListener('click', function () {
      copyText(lastWish || (wishDoneText ? wishDoneText.textContent : ''), '祝福已复制');
    });
  }

  if (wishAgain) {
    wishAgain.addEventListener('click', function () {
      if (wishDone) wishDone.hidden = true;
      if (wishForm) {
        wishForm.hidden = false;
        wishText.value = '';
        wishName.parentNode.classList.remove('is-bad');
        wishText.parentNode.classList.remove('is-bad');
      }
    });
  }

  /* =========================================================
     10. 滚动出现
     ========================================================= */
  function observeReveals() {
    var items = document.querySelectorAll('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var sibs = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (c) {
          return c.classList && c.classList.contains('reveal');
        }) : [];
        var idx = sibs.indexOf(el);
        el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 100 : 0) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  observeReveals();
})();
