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
        /* 为贴边半隐藏做准备 */
        overflow: visible;
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

      #web-pet-dock-side {
        position: absolute;
        width: 60px;
        height: 60px;
        background: #ffbf4f;
        z-index: 1000000;
        pointer-events: auto;
        display: none;
        border-radius: 50%;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      #web-pet-dock-side:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.26);
      }

      /* 收起时隐藏 web-pet，显示 web-pet-dock-side */
      #web-pet-container.web-pet-docked-left #web-pet,
      #web-pet-container.web-pet-docked-right #web-pet,
      #web-pet-container.web-pet-docked-top #web-pet,
      #web-pet-container.web-pet-docked-bottom #web-pet {
        display: none;
      }

      #web-pet-container.web-pet-docked-left #web-pet-dock-side,
      #web-pet-container.web-pet-docked-right #web-pet-dock-side,
      #web-pet-container.web-pet-docked-top #web-pet-dock-side,
      #web-pet-container.web-pet-docked-bottom #web-pet-dock-side {
        display: block;
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

    /* 贴边效果: left, top, right, bottom */
    const dockSide = document.createElement('div');
    dockSide.id = 'web-pet-dock-side';
    container.appendChild(dockSide);


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
    let dockedSide = null; // 当前是否处于某个方向的贴边收起

    function clearDock() {
      // 移除 dock 状态 class
      container.classList.remove(
        'web-pet-docked-left',
        'web-pet-docked-right',
        'web-pet-docked-top',
        'web-pet-docked-bottom'
      );
      dockedSide = null;
      // 展开时恢复溢出
      container.style.overflow = 'visible';

      // 展开宠物本体，隐藏半圆按钮位置重置
      pet.style.display = 'flex';
      dockSide.style.left = '';
      dockSide.style.right = '';
      dockSide.style.top = '';
      dockSide.style.bottom = '';
    }

    /* 贴边收起：隐藏宠物，仅显示半圆按钮 */
    function applyDock(side) {
      clearDock();
      dockedSide = side;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = container.getBoundingClientRect();

      const btnSize = 60;
      const btnRadius = btnSize / 2;

      // 宠物本体隐藏，由半圆按钮替代
      pet.style.display = 'none';

      // 基于当前矩形，先把容器对齐到边，然后把圆按钮“探出”一半
      if (side === 'left') {
        container.style.left = '0px';
        container.style.top = rect.top + 'px';
        container.style.bottom = 'auto';

        dockSide.style.left = -btnRadius + 'px';
        dockSide.style.right = '';
        dockSide.style.top = (rect.height / 2 - btnRadius) + 'px';
        dockSide.style.bottom = '';
      } else if (side === 'right') {
        container.style.left = (vw - rect.width) + 'px';
        container.style.top = rect.top + 'px';
        container.style.bottom = 'auto';

        dockSide.style.left = '';
        dockSide.style.right = -btnRadius + 'px';
        dockSide.style.top = (rect.height / 2 - btnRadius) + 'px';
        dockSide.style.bottom = '';
      } else if (side === 'top') {
        container.style.left = rect.left + 'px';
        container.style.top = '0px';
        container.style.bottom = 'auto';

        dockSide.style.left = (rect.width / 2 - btnRadius) + 'px';
        dockSide.style.right = '';
        dockSide.style.top = -btnRadius + 'px';
        dockSide.style.bottom = '';
      } else if (side === 'bottom') {
        container.style.left = rect.left + 'px';
        container.style.top = (vh - rect.height) + 'px';
        container.style.bottom = 'auto';

        dockSide.style.left = (rect.width / 2 - btnRadius) + 'px';
        dockSide.style.right = '';
        dockSide.style.top = '';
        dockSide.style.bottom = -btnRadius + 'px';
      }

      // 添加标记 class，触发 CSS：隐藏宠物、显示半圆
      container.style.bottom = 'auto';
      container.classList.add('web-pet-docked-' + side);
      container.style.overflow = 'visible';
    }

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
      // 开始拖拽时，如果是收起状态，则先展开
      clearDock();

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
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // 计算距离四个边缘的距离，决定是否收起以及朝向
      const distances = {
        left: rect.left,
        right: vw - (rect.left + rect.width),
        top: rect.top,
        bottom: vh - (rect.top + rect.height)
      };

      const nearestSide = Object.keys(distances).reduce((prev, cur) =>
        distances[cur] < distances[prev] ? cur : prev
      );

      const threshold = 0; // 距离屏幕边缘小于该值则触发收起
      if (distances[nearestSide] <= threshold) {
        applyDock(nearestSide);
      } else {
        clearDock();
      }

      // 收起/展开后再读取最新位置进行持久化
      const finalRect = container.getBoundingClientRect();
      try {
        localStorage.setItem(
          'web_pet_position',
          JSON.stringify({ x: finalRect.left, y: finalRect.top })
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

    // 点击半圆按钮，重新展开宠物
    dockSide.addEventListener('click', () => {
      clearDock();
    });

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

