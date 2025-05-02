function computeCurrentTimeDigits() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // 添加调试输出
    console.log(`当前时间: ${hours}:${minutes}:${seconds}`);
    
    return {
        h1: hours[0],
        h2: hours[1],
        m1: minutes[0],
        m2: minutes[1],
        s1: seconds[0],
        s2: seconds[1],
    };
}

function updateClockDisplay(digits) {
    // 添加调试输出
    console.log("更新数字:", digits);
    
    document.querySelector('.hours-tens').dataset.value = digits.h1;
    document.querySelector('.hours-ones').dataset.value = digits.h2;
    document.querySelector('.minutes-tens').dataset.value = digits.m1;
    document.querySelector('.minutes-ones').dataset.value = digits.m2;
    document.querySelector('.seconds-tens').dataset.value = digits.s1;
    document.querySelector('.seconds-ones').dataset.value = digits.s2;
    
    // 检查是否已正确设置属性
    console.log("小时十位:", document.querySelector('.hours-tens').dataset.value);
    console.log("小时个位:", document.querySelector('.hours-ones').dataset.value);
}

function tick() {
    const digits = computeCurrentTimeDigits();
    updateClockDisplay(digits);
}

// 确保DOM加载完成再初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM已加载，初始化时钟...");
    tick();
    setInterval(tick, 1000);
});

// 如果已经加载完成，立即执行一次
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("页面已经加载，直接初始化时钟...");
    setTimeout(tick, 0);
} 