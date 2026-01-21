(function () {
  // 计算当前脚本所在目录，用于拼接 gif 资源路径
  const currentScript = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const baseUrl = currentScript && currentScript.src
    ? currentScript.src.replace(/[^/]*$/, '')
    : '';

  // 配置：动画资源与对应文案
  const animations = {
    idle: new URL('./images/舔手.gif', baseUrl).toString(),      // 默认待机
    head: new URL('./images/惬意思考.gif', baseUrl).toString(),  // 点击头部
    body: new URL('./images/大笑.gif', baseUrl).toString(),      // 点击身体
    feet: new URL('./images/钻进钻出.gif', baseUrl).toString()   // 点击脚部
  };

  const messages = {
    idle: '今天也要元气满满呀~',
    head: '嘿嘿，被你摸头了~',
    body: '笑死我啦！',
    feet: '脚脚好痒，不要乱踩啦~'
  };

  function injectStyle() {
    if (document.getElementById('web-pet-style')) return;

    const style = document.createElement('style');
    style.id = 'web-pet-style';
    style.textContent = `
      #web-pet-container {
        position: fixed;
        left: 40px;
        bottom: 40px;
        width:180px;
        height: auto;
        z-index: 999999;
        user-select: none;
      }

      #web-pet {
        position: relative;
        width: 100%;
        height: auto;
        cursor: grab;
        transition: transform 0.15s ease;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      }

      #web-pet.web-pet-dragging {
        cursor: grabbing;
        transform: scale(1.03);
      }

      #web-pet-img {
        width: 100%;
        height: auto;
        display: block;
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.25s ease;
      }

      /* 对话框 */
      #web-pet-speech {
        position: relative;
        display: inline-block;
        position: relative;
        margin: 0 auto;
        max-width: 85%;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        font-size: 12px;
        color: #333;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        white-space: nowrap;
        text-overflow: ellipsis;
        // overflow: hidden;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }

      #web-pet-speech::after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: -6px;
        transform: translateX(-50%);
        border-width: 6px 6px 0 6px;
        border-style: solid;
        border-color: rgba(255, 255, 255, 0.95) transparent transparent transparent;
      }

      /* 关闭按钮 */
      #web-pet-close {
        position: absolute;
        top: 80px;
        right: 20px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 14px;
        line-height: 22px;
        text-align: center;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.18);
        transition: transform 0.15s ease, opacity 0.2s ease;
        z-index: 1000000;
        padding: 0;
      }

      #web-pet-close:hover {
        transform: scale(1.05);
        opacity: 0.9;
      }

      /* 设置点击区域 */
      .web-pet-hit-area {
        position: absolute;
        left: 0;
        right: 0;
        cursor: inherit;
        pointer-events: auto;
      }

      .web-pet-area-head {
        top: 10%;
        height: 30%;
      }

      .web-pet-area-body {
        top: 30%;
        height: 45%;
      }

      .web-pet-area-feet {
        bottom: 0;
        height: 25%;
      }
    `;

    document.head.appendChild(style);
  }

  function initPet() {
    if (document.getElementById('web-pet-container')) return;

    injectStyle();

    const container = document.createElement('div');
    container.id = 'web-pet-container';

    const pet = document.createElement('div');
    pet.id = 'web-pet';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'web-pet-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭桌宠');
    closeBtn.textContent = '×';

    const speech = document.createElement('div');
    speech.id = 'web-pet-speech';

    const img = document.createElement('img');
    img.id = 'web-pet-img';
    img.alt = '网页宠物';
    img.src = animations.idle;

    // 点击区域
    const headArea = document.createElement('div');
    headArea.className = 'web-pet-hit-area web-pet-area-head';
    headArea.dataset.action = 'head';

    const bodyArea = document.createElement('div');
    bodyArea.className = 'web-pet-hit-area web-pet-area-body';
    bodyArea.dataset.action = 'body';

    const feetArea = document.createElement('div');
    feetArea.className = 'web-pet-hit-area web-pet-area-feet';
    feetArea.dataset.action = 'feet';

    pet.appendChild(closeBtn);
    pet.appendChild(speech);
    pet.appendChild(img);
    pet.appendChild(headArea);
    pet.appendChild(bodyArea);
    pet.appendChild(feetArea);

    container.appendChild(pet);
    document.body.appendChild(container);

    let currentState = 'idle';
    let restoreTimer = null;
    let messageTimer = null;

    function showMessage(key, holdMs) {
      if (!speech) return;

      if (messageTimer) {
        clearTimeout(messageTimer);
        messageTimer = null;
      }

      const text = messages[key];
      if (!text) {
        speech.style.opacity = '0';
        return;
      }

      speech.textContent = text;
      speech.style.opacity = '1';

      // 自动隐藏气泡
      // messageTimer = setTimeout(() => {
      //   speech.style.opacity = '0';
      // }, holdMs);
    }

    function switchAnimation(key, holdMs = 2500) {
      if (!animations[key]) return;

      // 如果正在播放相同动画，刷新持续时间与对话
      if (currentState === key) {
        if (restoreTimer) clearTimeout(restoreTimer);
        restoreTimer = setTimeout(() => switchAnimation('idle', 0), holdMs);
        showMessage(key, holdMs);
        return;
      }

      currentState = key;
      img.style.opacity = '0';

      setTimeout(() => {
        img.src = animations[key];
        img.onload = () => {
          img.style.opacity = '1';
        };
      }, 160);

      showMessage(key, holdMs);

      if (key !== 'idle') {
        if (restoreTimer) clearTimeout(restoreTimer);
        restoreTimer = setTimeout(() => {
          switchAnimation('idle', 0);
        }, holdMs);
      }
    }

    // 位置恢复
    try {
      const savedPos = JSON.parse(localStorage.getItem('web_pet_position') || 'null');
      if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
        container.style.left = savedPos.x + 'px';
        container.style.top = savedPos.y + 'px';
        container.style.bottom = 'auto';
      }
    } catch (_) {
      // localStorage 失败时忽略
    }

    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let petStartX = 0;
    let petStartY = 0;
    let suppressClick = false; // 拖动释放后短暂屏蔽点击

    function getEventPoint(e) {
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function onDown(e) {
      // 只响应左键或触摸
      if (e.type === 'mousedown' && e.button !== 0) return;

      // e.preventDefault();
      isDragging = true;
      hasMoved = false;
      pet.classList.add('web-pet-dragging');

      const point = getEventPoint(e);
      startX = point.x;
      startY = point.y;

      const rect = container.getBoundingClientRect();
      petStartX = rect.left;
      petStartY = rect.top;

      container.style.left = rect.left + 'px';
      container.style.top = rect.top + 'px';
      container.style.bottom = 'auto';

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }

    function onMove(e) {
      if (!isDragging) return;
      e.preventDefault();
      const point = getEventPoint(e);
      const dx = point.x - startX;
      const dy = point.y - startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved = true;
      }

      let newX = petStartX + dx;
      let newY = petStartY + dy;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = container.getBoundingClientRect();

      newX = Math.min(Math.max(newX, 0), vw - rect.width);
      newY = Math.min(Math.max(newY, 0), vh - rect.height);

      container.style.left = newX + 'px';
      container.style.top = newY + 'px';
    }

    function onUp() {
      if (!isDragging) return;
      isDragging = false;
      pet.classList.remove('web-pet-dragging');
      if (hasMoved) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 120);
      }
      hasMoved = false;

      const rect = container.getBoundingClientRect();
      try {
        localStorage.setItem(
          'web_pet_position',
          JSON.stringify({ x: rect.left, y: rect.top })
        );
      } catch (_) {
        // 忽略存储失败
      }

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    }

    // 拖动事件（在整个宠物区域上）
    pet.addEventListener('mousedown', onDown);
    pet.addEventListener('touchstart', onDown, { passive: false });

    // 点击区域触发行为
    [headArea, bodyArea, feetArea].forEach((area) => {
      area.addEventListener('click', (e) => {
        // e.stopPropagation();
        if (isDragging || suppressClick) return;
        const action = area.dataset.action;
        switchAnimation(action || 'idle');
      });

    });

    // 关闭
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.style.display = 'none';
    });

    // 初始为待机动画
    switchAnimation('idle', 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPet);
  } else {
    initPet();
  }
})();

