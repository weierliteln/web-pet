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
  const animations = [
    {
      key: 'idle',
      gif: new URL('./images/待机.gif', baseUrl).toString(),
      message: '嗨，有问题问我！👋',
      audio: new URL('./audio/待机_1.mp3', baseUrl).toString(),
    },
    {
      key: 'byOk',
      gif: new URL('./images/比OK.gif', baseUrl).toString(),
      message: '好呀，给你比个OK~',
      audio: new URL('./audio/比OK_1.mp3', baseUrl).toString(),
    },
    {
      key: 'funny',
      gif: new URL('./images/搞怪.gif', baseUrl).toString(),
      message: '哈哈哈，你真有趣~',
      audio: new URL('./audio/搞怪_1.mp3', baseUrl).toString(),
    },
    {
      key: 'clap',
      gif: new URL('./images/鼓掌.gif', baseUrl).toString(),
      message: '掌声响起来~',
      audio: new URL('./audio/鼓掌_1.mp3', baseUrl).toString(),
    }
  ] 

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
      }

      #web-pet-dock-side {
        position: absolute;
        top: 0;
        left: 0;
        width: 10px;
        height: 10px;
        background: rgba(0,0,0,0.5);
        z-index: 1000000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.25s ease;
      }

      #web-pet-dock-side.web-pet-dock-left {
        left: 0;
      }

      #web-pet-dock-side.web-pet-dock-top {
        top: 0;
      }

      #web-pet-dock-side.web-pet-dock-right {
        right: 0;
      }

      #web-pet-dock-side.web-pet-dock-bottom {
        bottom: 0;
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
    const idleAnim = animations.find(a => a.key === 'idle');
    img.src = idleAnim ? idleAnim.gif : '';

    /* 贴边效果: left, top, right, bottom */
    const dockSide = document.createElement('div');
    dockSide.id = 'web-pet-dock-side';
    dockSide.textContent = '贴边效果';
    container.appendChild(dockSide);

    pet.appendChild(closeBtn);
    pet.appendChild(speech);
    pet.appendChild(img);

    container.appendChild(pet);
    document.body.appendChild(container);

    let currentState = 'idle';
    let restoreTimer = null;
    let messageTimer = null;

    function showMessage(text, holdMs) {
      if (!speech) return;

      if (messageTimer) {
        clearTimeout(messageTimer);
        messageTimer = null;
      }

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
      const anim = animations.find(a => a.key === key);
      if (!anim) return;

      // 如果正在播放相同动画，刷新持续时间与对话
      if (currentState === key) {
        if (restoreTimer) clearTimeout(restoreTimer);
        restoreTimer = setTimeout(() => switchAnimation('idle', 0), holdMs);
        showMessage(anim.message, holdMs);
        return;
      }

      currentState = key;
      img.src = anim.gif;

      showMessage(anim.message, holdMs);

      // 播放音频
      if (anim.audio) {
        const audio = new Audio(anim.audio);
        audio.play().catch(() => {
          // 忽略音频播放错误
        });
      }

      if (key !== 'idle') {
        if (restoreTimer) clearTimeout(restoreTimer);
        restoreTimer = setTimeout(() => {
          switchAnimation('idle', 0);
        }, holdMs);
      }
    }

    // 随机播放动画
    function playRandomAnimation() {
      // 排除 idle 状态，只从其他动画中随机选择
      const availableAnimations = animations.filter(a => a.key !== 'idle');
      if (availableAnimations.length === 0) return;
      
      const randomIndex = Math.floor(Math.random() * availableAnimations.length);
      const randomAnim = availableAnimations[randomIndex];
      switchAnimation(randomAnim.key, 2500);
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

      // 贴边效果
      if(newX === 0) {
        console.log('left');
        dockSide.classList.add('web-pet-dock-left');
      } 
      else if(newY === 0) {
        console.log('top');
        dockSide.classList.add('web-pet-dock-top');
      }
      else if(newX === vw - rect.width) {
        console.log('right');
        dockSide.classList.add('web-pet-dock-right');
      }
      else if(newY === vh - rect.height) {
        console.log('bottom');
        dockSide.classList.add('web-pet-dock-bottom');
      }


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

    // 点击事件：随机播放动画
    pet.addEventListener('click', (e) => {
      // 如果刚刚拖动过，不触发点击
      if (suppressClick) return;
      // 如果点击的是关闭按钮，不触发
      if (e.target === closeBtn) return;
      
      e.stopPropagation();
      playRandomAnimation();
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

