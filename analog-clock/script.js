const hourHand = document.querySelector('.hour-hand');
const minuteHand = document.querySelector('.minute-hand');
const secondHand = document.querySelector('.second-hand');

function setClockHands() {
    const now = new Date();

    const seconds = now.getSeconds();
    const secondsDegrees = ((seconds / 60) * 360) + 90; // 每秒 6 度，+90 度是因为初始 CSS transform 是垂直向下的
    // 移除旧的 transform, 添加新的 rotate transform
    secondHand.style.transform = `translate(-50%, 0) rotate(${secondsDegrees}deg)`;

    const minutes = now.getMinutes();
    const minutesDegrees = ((minutes / 60) * 360) + ((seconds / 60) * 6) + 90; // 每分钟 6 度，加上秒数带来的偏移
    minuteHand.style.transform = `translate(-50%, 0) rotate(${minutesDegrees}deg)`;

    const hours = now.getHours();
    // 小时数需要转换成 12 小时制，并考虑分钟带来的偏移
    const hoursDegrees = ((hours / 12) * 360) + ((minutes / 60) * 30) + 90; // 每小时 30 度，加上分钟带来的偏移
    hourHand.style.transform = `translate(-50%, 0) rotate(${hoursDegrees}deg)`;
}

// 立即执行一次以设置初始位置
setClockHands();

// 每秒更新一次指针位置
setInterval(setClockHands, 1000);
