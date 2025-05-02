function computeCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function updateClockDisplay() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        clockElement.textContent = computeCurrentTime();
    }
}

// 立即执行一次以显示初始时间
updateClockDisplay();

// 每秒更新一次时间
setInterval(updateClockDisplay, 1000);
