/**
 * 获取指定标识的翻页卡片元素
 * @param {string} digitIdentifier - 卡片标识符 (e.g., 'hours-tens')
 * @returns {{ card: HTMLElement, topFace: HTMLElement, bottomFace: HTMLElement, topFlip: HTMLElement, bottomFlip: HTMLElement }} 卡片相关元素的对象
 */
const getFlipCard = (digitIdentifier) => {
    const card = document.querySelector(`[data-digit="${digitIdentifier}"]`);
    if (!card) return null; // 如果找不到元素，返回 null
    return {
        card,
        topFace: card.querySelector('.top span'),
        bottomFace: card.querySelector('.bottom span'),
        topFlip: card.querySelector('.top-flip span'),
        bottomFlip: card.querySelector('.bottom-flip span'),
        topFlipContainer: card.querySelector('.top-flip'), // 获取容器以监听动画结束
    };
};

/**
 * 更新单个翻页卡片的数字并触发动画
 * @param {{ card: HTMLElement, topFace: HTMLElement, bottomFace: HTMLElement, topFlip: HTMLElement, bottomFlip: HTMLElement, topFlipContainer: HTMLElement }} cardElements - 卡片相关元素的对象
 * @param {string} newDigit - 新的数字 (0-9)
 */
const updateFlipCard = (cardElements, newDigit) => {
    if (!cardElements) return; // 确保元素存在

    const { card, topFace, bottomFace, topFlip, bottomFlip, topFlipContainer } = cardElements;
    const currentDigit = topFace.textContent;

    // 如果数字没有变化，则不执行动画
    if (newDigit === currentDigit) {
        return;
    }

    // 设置翻转动画中的数字
    topFlip.textContent = currentDigit;
    bottomFlip.textContent = newDigit;

    // 开始翻转动画
    card.classList.add('flip');

    // 监听顶部卡片翻转动画结束事件
    // 使用 .once = true 确保事件监听器只执行一次，防止重复绑定
    topFlipContainer.addEventListener('animationend', () => {
        // 更新静态卡片的数字
        topFace.textContent = newDigit;
        bottomFace.textContent = newDigit;

        // 重置翻转卡片的数字和动画状态，为下一次翻转做准备
        topFlip.textContent = newDigit; // 动画结束后统一为新数字
        card.classList.remove('flip');
    }, { once: true });
};

/**
 * 更新整个时钟显示
 */
const updateClock = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    updateFlipCard(getFlipCard('hours-tens'), hours[0]);
    updateFlipCard(getFlipCard('hours-ones'), hours[1]);
    updateFlipCard(getFlipCard('minutes-tens'), minutes[0]);
    updateFlipCard(getFlipCard('minutes-ones'), minutes[1]);
    updateFlipCard(getFlipCard('seconds-tens'), seconds[0]);
    updateFlipCard(getFlipCard('seconds-ones'), seconds[1]);

    // 更新日期显示
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        const month = now.getMonth() + 1; // 月份从 0 开始
        const day = now.getDate();
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekDay = weekDays[now.getDay()];
        dateDisplay.textContent = `${month}月${day}日 ${weekDay}`;
    }
};

/**
 * 初始化时钟
 */
const initializeClock = () => {
    updateClock(); // 初始加载时立即更新一次
    setInterval(updateClock, 1000); // 每秒更新一次
};

// DOM加载完成后初始化时钟
document.addEventListener('DOMContentLoaded', initializeClock); 