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
  const staticImg = new URL('./images/静止.jpg', baseUrl).toString();
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

      /* 吸附状态：隐藏 pet 元素，显示圆球 */
      #web-pet-container.web-pet-docked {
        width: 140px;
        height: 70px;
      }

      #web-pet-container.web-pet-docked #web-pet {
        display: none;
      }

      #web-pet-container.web-pet-docked #web-pet-dock-circle {
        display: flex;
      }

      /* 胶囊容器 */
      #web-pet-dock-circle {
        display: none;
        width: 140px;
        height: 70px;
        background: #5666e6;
        border-radius: 44px;
        align-items: center;
        justify-content: start;
        box-sizing: border-box;
        cursor: grab;
        transition: transform 0.15s ease;
      }

      #web-pet-dock-circle.web-pet-dragging {
        cursor: grabbing;
        transform: scale(1.1);
      }

      /* 内层白色圆形容器 */
      #web-pet-dock-inner {
        width: 70px;
        height: 70px;
        background: #fff;
        border-radius: 50%;
        border: 4px solid #5666e6;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }

      /* 圆球内的图片 */
      #web-pet-dock-img {
        width: 54px;
        height: 54px;
        display: block;
        object-fit: cover;
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

    /* 吸附时的圆球 */
    const dockCircle = document.createElement('div');
    dockCircle.id = 'web-pet-dock-circle';
    const dockInner = document.createElement('div');
    dockInner.id = 'web-pet-dock-inner';
    const dockImg = document.createElement('img');
    dockImg.id = 'web-pet-dock-img';
    dockImg.src = staticImg;
    dockImg.alt = '静止淼淼';
    dockInner.appendChild(dockImg);
    dockCircle.appendChild(dockInner);
    container.appendChild(dockCircle);

    pet.appendChild(closeBtn);
    pet.appendChild(speech);
    pet.appendChild(img);

    container.appendChild(pet);
    document.body.appendChild(container);

    let currentState = 'idle';
    let restoreTimer = null;
    let messageTimer = null;
    let autoSwitchTimer = null;

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

    function switchAnimation(key, holdMs = 5000) {
      const anim = animations.find(a => a.key === key);
      if (!anim) return;

      currentState = key;
      img.src = anim.gif;

      showMessage(anim.message, holdMs);

      // 播放音频
        const audio = new Audio(anim.audio);  
        audio.play().catch(error => {
        console.error('播放失败，需要等待用户点击后重新播放', error);
      });
    
   

      // 自动切换动画
      // if (key !== 'idle') {
      //   if (restoreTimer) clearTimeout(restoreTimer);
      //   restoreTimer = setTimeout(() => {
      //     switchAnimation('idle', 0);
      //   }, holdMs);
      // }
    }

    function playRandomAnimation() {
      const nonIdleAnimations = animations.filter(a => a.key !== 'idle');
      const randomIndex = Math.floor(Math.random() * nonIdleAnimations.length);
      const randomAnim = nonIdleAnimations[randomIndex];
      
      switchAnimation(randomAnim.key);
    }

    function startAutoSwitch() {
      if (autoSwitchTimer) clearInterval(autoSwitchTimer);
      
      autoSwitchTimer = setInterval(() => {
        playRandomAnimation();
      }, 5000);
    }
    

    // 位置恢复
    // try {
    //   const savedPos = JSON.parse(localStorage.getItem('web_pet_position') || 'null');
    //   if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
    //     container.style.left = savedPos.x + 'px';
    //     container.style.top = savedPos.y + 'px';
    //     container.style.bottom = 'auto';
        
    //     // 恢复吸附状态
    //     if (savedPos.docked && savedPos.dockedSide) {
    //       isDocked = true;
    //       dockedSide = savedPos.dockedSide;
    //       container.classList.add('web-pet-docked');
    //     }
    //   }
    // } catch (_) {
    //   // localStorage 失败时忽略
    // }

    // 吸附阈值（参考 pet.html）
    const MARGINS = 4;
    
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let petStartX = 0;
    let petStartY = 0;
    let suppressClick = false; // 拖动释放后短暂屏蔽点击
    let isDocked = false; // 是否已吸附到边缘
    let dockedSide = null; // 吸附到哪一边：'left', 'top', 'right', 'bottom'

    //修改不同位置胶囊的旋转以及里面图片位置和旋转
    function updateDockRotation(side) {
      const rotation = {
        left: 0,
        top: 90,
        right: 0,
        bottom: 90,
      };
      dockCircle.style.transform = `rotate(${rotation[side]}deg)`;
      dockCircle.style.justifyContent = side === 'left' ? 'flex-end' : side === 'right' ? 'flex-start' : side === 'top' ? 'flex-end' : 'flex-start';
      dockInner.style.transform = `rotate(-${rotation[side]}deg)`;
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
      isDragging = true;
      hasMoved = false;
      pet.classList.add('web-pet-dragging');
      dockCircle.classList.add('web-pet-dragging');

      // 如果从吸附状态开始拖拽，先取消吸附
      if (isDocked) {
        isDocked = false;
        dockedSide = null;
        container.classList.remove('web-pet-docked');
      }

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
      const rightScreenEdge = vw - MARGINS;
      const bottomScreenEdge = vh - MARGINS;

      // 限制在边界内（不再保持吸附状态，因为已经在 onDown 中取消了）
      newX = Math.min(Math.max(newX, 0), vw - rect.width);
      newY = Math.min(Math.max(newY, 0), vh - rect.height);

      container.style.left = newX + 'px';
      container.style.top = newY + 'px';

      // 清除之前的贴边标记
      dockSide.classList.remove('web-pet-dock-left', 'web-pet-dock-top', 'web-pet-dock-right', 'web-pet-dock-bottom');

      // 检测是否接近边缘（用于预览，但不立即吸附）
      const b = container.getBoundingClientRect();
      if (b.left < MARGINS) {
        dockSide.classList.add('web-pet-dock-left');
        updateDockRotation('left');
      } else if (b.top < MARGINS) {
        dockSide.classList.add('web-pet-dock-top');
        updateDockRotation('top');
      } else if (b.right > rightScreenEdge) {
        dockSide.classList.add('web-pet-dock-right');
        updateDockRotation('right');
      } else if (b.bottom > bottomScreenEdge) {
        dockSide.classList.add('web-pet-dock-bottom');
        updateDockRotation('bottom');
      }
    }

    function onUp() {
      if (!isDragging) return;
      isDragging = false;
      pet.classList.remove('web-pet-dragging');
      dockCircle.classList.remove('web-pet-dragging');
      if (hasMoved) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 120);
      }
      hasMoved = false;

      const rect = container.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rightScreenEdge = vw - MARGINS;
      const bottomScreenEdge = vh - MARGINS;
      const b = container.getBoundingClientRect();

      // 检测是否应该吸附（参考 pet.html 的逻辑）
      let shouldDock = false;
      let newDockedSide = null;
      let finalX = rect.left;
      let finalY = rect.top;

      if (b.left < MARGINS) {
        // 吸附到左边
        shouldDock = true;
        newDockedSide = 'left';
        finalX = 0;
      } else if (b.top < MARGINS) {
        // 吸附到上边
        shouldDock = true;
        newDockedSide = 'top';
        finalY = 40;
      } else if (b.right > rightScreenEdge) {
        // 吸附到右边
        shouldDock = true;
        newDockedSide = 'right';
        finalX = vw - 140;
      } else if (b.bottom > bottomScreenEdge) {
        // 吸附到下边
        shouldDock = true;
        newDockedSide = 'bottom';
        finalY = vh - 110;
      }

      // 执行吸附或取消吸附
      if (shouldDock) {
        // 执行吸附
        container.style.left = finalX + 'px';
        container.style.top = finalY + 'px';
        isDocked = true;
        dockedSide = newDockedSide;
        container.classList.add('web-pet-docked');
      } else {
        // 取消吸附
        if (isDocked) {
          isDocked = false;
          dockedSide = null;
          container.classList.remove('web-pet-docked');
        }
      }

      // 清除贴边标记
      dockSide.classList.remove('web-pet-dock-left', 'web-pet-dock-top', 'web-pet-dock-right', 'web-pet-dock-bottom');

      // 保存位置
      const finalRect = container.getBoundingClientRect();
      try {
        // localStorage.setItem(
        //   'web_pet_position',
        //   JSON.stringify({ 
        //     x: finalRect.left, 
        //     y: finalRect.top,
        //     docked: isDocked,
        //     dockedSide: dockedSide
        //   })
        // );
      } catch (_) {
        // 忽略存储失败
      }

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    }

    // 拖动事件（在整个宠物区域和圆球上）
    pet.addEventListener('mousedown', onDown);
    pet.addEventListener('touchstart', onDown, { passive: false });
    dockCircle.addEventListener('mousedown', onDown);
    dockCircle.addEventListener('touchstart', onDown, { passive: false });

    // 点击事件：随机播放动画
    pet.addEventListener('click', (e) => {
      // 如果刚刚拖动过，不触发点击
      if (suppressClick) return;
      // 如果点击的是关闭按钮，不触发
      if (e.target === closeBtn) return;
      
      e.stopPropagation();
    });

    // 关闭
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.style.display = 'none';
    });

    // 初始为待机动画
    switchAnimation('idle', 2000);
    
    // 启动自动切换
    startAutoSwitch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPet);
  } else {
    initPet();
  }
})();

