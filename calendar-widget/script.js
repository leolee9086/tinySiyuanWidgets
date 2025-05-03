/**
 * 日历挂件 - 脚本
 * 实现功能：
 * 1. 显示月历视图
 * 2. 选择日期查看/管理日程
 * 3. 添加、编辑、删除日程
 * 4. 本地存储保存日程数据
 */

// 全局变量
let currentDate = new Date(); // 当前显示的月份
let selectedDate = new Date(); // 当前选中的日期
let currentEvents = []; // 所有事件
let selectedEventId = null; // 当前选中的事件ID (用于编辑)

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
});

/**
 * 初始化日历
 */
function initCalendar() {
    // 初始化月份导航按钮
    document.getElementById('prev-month').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => navigateMonth(1));
    document.getElementById('today-btn').addEventListener('click', goToToday);
    
    // 初始化事件模态框按钮
    document.getElementById('add-event').addEventListener('click', () => openEventModal());
    document.getElementById('cancel-btn').addEventListener('click', closeEventModal);
    document.getElementById('event-form').addEventListener('submit', saveEvent);
    
    // 加载已保存的事件
    loadEvents();
    
    // 渲染当前月份的日历
    renderCalendar();
    
    // 选中今天
    selectDate(new Date());
}

/**
 * 切换月份
 * @param {number} offset - 月份偏移量 (-1 表示上个月，1 表示下个月)
 */
function navigateMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    renderCalendar();
}

/**
 * 跳转到今天
 */
function goToToday() {
    currentDate = new Date();
    renderCalendar();
    selectDate(new Date());
}

/**
 * 渲染日历
 */
function renderCalendar() {
    // 更新当前月份和年份显示
    const monthYearElement = document.getElementById('current-month-year');
    monthYearElement.textContent = formatMonthYear(currentDate);
    
    // 获取当前月的第一天和最后一天
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // 获取月初是星期几 (0 表示星期日，6 表示星期六)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // 计算前一个月需要显示的天数 (填充月初前的空位)
    const prevMonthDays = firstDayOfWeek;
    
    // 计算当前月的天数
    const daysInMonth = lastDayOfMonth.getDate();
    
    // 计算显示的总天数 (前一个月的天数 + 当前月的天数 + 后一个月的天数)
    // 我们使用6行7列的网格，所以总共显示42天
    const totalDays = 42;
    
    // 计算后一个月需要显示的天数 (填充月末后的空位)
    const nextMonthDays = totalDays - prevMonthDays - daysInMonth;
    
    // 获取前一个月的最后几天
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    
    // 获取渲染区域
    const daysGrid = document.getElementById('days-grid');
    daysGrid.innerHTML = '';
    
    // 渲染前一个月的天数
    for (let i = 0; i < prevMonthDays; i++) {
        const day = prevMonthLastDay - prevMonthDays + i + 1;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
        daysGrid.appendChild(createDayElement(day, date, true, false));
    }
    
    // 获取今天的日期
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && 
                          today.getFullYear() === currentDate.getFullYear();
    
    // 渲染当前月的天数
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const isToday = isCurrentMonth && i === today.getDate();
        daysGrid.appendChild(createDayElement(i, date, false, isToday));
    }
    
    // 渲染后一个月的天数
    for (let i = 1; i <= nextMonthDays; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
        daysGrid.appendChild(createDayElement(i, date, true, false));
    }
    
    // 重新选中之前选择的日期
    highlightSelectedDate();
}

/**
 * 创建日期单元格元素
 * @param {number} day - 日期
 * @param {Date} date - 完整日期对象
 * @param {boolean} isOtherMonth - 是否为其他月份
 * @param {boolean} isToday - 是否为今天
 * @returns {HTMLElement} 日期单元格元素
 */
function createDayElement(day, date, isOtherMonth, isToday) {
    const dayElement = document.createElement('div');
    dayElement.className = 'day';
    
    // 添加其他月份样式
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    // 添加今天样式
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    // 添加周末样式
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayElement.classList.add('weekend');
    }
    
    // 保存日期数据
    dayElement.dataset.date = formatDate(date);
    
    // 添加日期头部
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayHeader.appendChild(dayNumber);
    dayElement.appendChild(dayHeader);
    
    // 添加事件容器
    const dayEvents = document.createElement('div');
    dayEvents.className = 'day-events';
    dayElement.appendChild(dayEvents);
    
    // 添加当天的事件
    const dateString = formatDate(date);
    const eventsForDay = getEventsForDate(dateString);
    
    // 最多显示3个事件，超出显示"更多"
    const maxEventsToShow = 3;
    
    if (eventsForDay.length > 0) {
        for (let i = 0; i < Math.min(eventsForDay.length, maxEventsToShow); i++) {
            const event = eventsForDay[i];
            const eventElement = document.createElement('div');
            eventElement.className = `day-event ${event.color}`;
            eventElement.textContent = event.title;
            dayEvents.appendChild(eventElement);
        }
        
        // 如果事件超过最大显示数量，显示"更多"
        if (eventsForDay.length > maxEventsToShow) {
            const moreElement = document.createElement('div');
            moreElement.className = 'day-event-more';
            moreElement.textContent = `还有 ${eventsForDay.length - maxEventsToShow} 项`;
            dayEvents.appendChild(moreElement);
        }
    }
    
    // 添加点击事件
    dayElement.addEventListener('click', () => selectDate(date));
    
    return dayElement;
}

/**
 * 选择日期
 * @param {Date} date - 选中的日期
 */
function selectDate(date) {
    selectedDate = new Date(date);
    
    // 如果选中的日期不在当前显示的月份，切换到该月份
    if (selectedDate.getMonth() !== currentDate.getMonth() || 
        selectedDate.getFullYear() !== currentDate.getFullYear()) {
        currentDate = new Date(selectedDate);
        renderCalendar();
    } else {
        highlightSelectedDate();
    }
    
    // 更新日程区域
    updateScheduleView();
}

/**
 * 高亮选中的日期
 */
function highlightSelectedDate() {
    // 移除之前选中的日期
    const selectedDayElement = document.querySelector('.day.selected');
    if (selectedDayElement) {
        selectedDayElement.classList.remove('selected');
    }
    
    // 高亮新选中的日期
    const selectedDateString = formatDate(selectedDate);
    const dayElements = document.querySelectorAll('.day');
    
    for (const dayElement of dayElements) {
        if (dayElement.dataset.date === selectedDateString) {
            dayElement.classList.add('selected');
            break;
        }
    }
}

/**
 * 更新日程视图
 */
function updateScheduleView() {
    // 更新选中日期标题
    const selectedDateElement = document.getElementById('selected-date');
    selectedDateElement.textContent = `${formatFullDate(selectedDate)} 日程`;
    
    // 获取选中日期的事件
    const dateString = formatDate(selectedDate);
    const eventsForDay = getEventsForDate(dateString);
    
    // 获取事件列表容器
    const eventsListElement = document.getElementById('events-list');
    eventsListElement.innerHTML = '';
    
    // 如果没有事件，显示提示信息
    if (eventsForDay.length === 0) {
        const noEventsElement = document.createElement('div');
        noEventsElement.className = 'no-events';
        noEventsElement.textContent = '暂无日程安排';
        eventsListElement.appendChild(noEventsElement);
        return;
    }
    
    // 按时间排序事件
    eventsForDay.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });
    
    // 显示事件列表
    for (const event of eventsForDay) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        
        // 事件颜色标记
        const eventColor = document.createElement('div');
        eventColor.className = 'event-color';
        eventColor.style.backgroundColor = `var(--event-${event.color})`;
        eventElement.appendChild(eventColor);
        
        // 事件信息
        const eventInfo = document.createElement('div');
        eventInfo.className = 'event-info';
        
        // 事件标题
        const eventTitle = document.createElement('div');
        eventTitle.className = 'event-title';
        eventTitle.textContent = event.title;
        eventInfo.appendChild(eventTitle);
        
        // 事件时间
        if (event.time) {
            const eventTime = document.createElement('div');
            eventTime.className = 'event-time';
            eventTime.textContent = formatTime(event.time);
            eventInfo.appendChild(eventTime);
        }
        
        // 事件描述
        if (event.description) {
            const eventDescription = document.createElement('div');
            eventDescription.className = 'event-description';
            eventDescription.textContent = event.description;
            eventInfo.appendChild(eventDescription);
        }
        
        eventElement.appendChild(eventInfo);
        
        // 事件操作按钮
        const eventActions = document.createElement('div');
        eventActions.className = 'event-actions';
        
        // 编辑按钮
        const editButton = document.createElement('button');
        editButton.className = 'event-action-btn';
        editButton.textContent = '✏️';
        editButton.setAttribute('aria-label', '编辑');
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openEventModal(event);
        });
        eventActions.appendChild(editButton);
        
        // 删除按钮
        const deleteButton = document.createElement('button');
        deleteButton.className = 'event-action-btn';
        deleteButton.textContent = '🗑️';
        deleteButton.setAttribute('aria-label', '删除');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEvent(event.id);
        });
        eventActions.appendChild(deleteButton);
        
        eventElement.appendChild(eventActions);
        
        // 点击事件条目打开编辑模态框
        eventElement.addEventListener('click', () => {
            openEventModal(event);
        });
        
        eventsListElement.appendChild(eventElement);
    }
}

/**
 * 打开事件模态框
 * @param {Object} event - 事件对象 (如果是编辑模式)
 */
function openEventModal(event = null) {
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('event-form');
    const titleInput = document.getElementById('event-title');
    const timeInput = document.getElementById('event-time');
    const descriptionInput = document.getElementById('event-description');
    const colorSelect = document.getElementById('event-color');
    
    // 重置表单
    form.reset();
    
    if (event) {
        // 编辑模式
        modalTitle.textContent = '编辑日程';
        titleInput.value = event.title || '';
        timeInput.value = event.time || '';
        descriptionInput.value = event.description || '';
        colorSelect.value = event.color || 'blue';
        selectedEventId = event.id;
    } else {
        // 添加模式
        modalTitle.textContent = '添加日程';
        colorSelect.value = 'blue';
        selectedEventId = null;
    }
    
    // 显示模态框
    modal.classList.add('active');
}

/**
 * 关闭事件模态框
 */
function closeEventModal() {
    const modal = document.getElementById('event-modal');
    modal.classList.remove('active');
    selectedEventId = null;
}

/**
 * 保存事件
 * @param {Event} e - 提交事件
 */
function saveEvent(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('event-title');
    const timeInput = document.getElementById('event-time');
    const descriptionInput = document.getElementById('event-description');
    const colorSelect = document.getElementById('event-color');
    
    // 验证标题不能为空
    if (!titleInput.value.trim()) {
        alert('请输入日程标题');
        return;
    }
    
    // 准备事件数据
    const eventData = {
        title: titleInput.value.trim(),
        time: timeInput.value,
        description: descriptionInput.value.trim(),
        color: colorSelect.value,
        date: formatDate(selectedDate)
    };
    
    if (selectedEventId) {
        // 更新现有事件
        const eventIndex = currentEvents.findIndex(e => e.id === selectedEventId);
        if (eventIndex !== -1) {
            eventData.id = selectedEventId;
            currentEvents[eventIndex] = eventData;
        }
    } else {
        // 添加新事件
        eventData.id = generateEventId();
        currentEvents.push(eventData);
    }
    
    // 保存事件到本地存储
    saveEvents();
    
    // 关闭模态框
    closeEventModal();
    
    // 重新渲染日历和日程视图
    renderCalendar();
    updateScheduleView();
}

/**
 * 删除事件
 * @param {string} eventId - 事件ID
 */
function deleteEvent(eventId) {
    if (confirm('确定要删除此日程吗？')) {
        // 从事件列表中移除
        const eventIndex = currentEvents.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
            currentEvents.splice(eventIndex, 1);
        }
        
        // 保存到本地存储
        saveEvents();
        
        // 重新渲染日历和日程视图
        renderCalendar();
        updateScheduleView();
    }
}

/**
 * 生成唯一事件ID
 * @returns {string} 唯一ID
 */
function generateEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 获取指定日期的事件
 * @param {string} dateString - 日期字符串 (YYYY-MM-DD)
 * @returns {Object[]} 事件数组
 */
function getEventsForDate(dateString) {
    return currentEvents.filter(event => event.date === dateString);
}

/**
 * 保存事件到本地存储
 */
function saveEvents() {
    localStorage.setItem('calendar_events', JSON.stringify(currentEvents));
}

/**
 * 从本地存储加载事件
 */
function loadEvents() {
    const storedEvents = localStorage.getItem('calendar_events');
    if (storedEvents) {
        try {
            currentEvents = JSON.parse(storedEvents);
        } catch (e) {
            console.error('加载事件失败:', e);
            currentEvents = [];
        }
    }
}

// --- 辅助函数 ---

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的日期字符串
 */
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 格式化日期为 YYYY年MM月DD日
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的日期字符串
 */
function formatFullDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 格式化日期为 YYYY年MM月
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的日期字符串
 */
function formatMonthYear(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

/**
 * 格式化时间为 HH:MM
 * @param {string} timeString - 时间字符串 (HH:MM)
 * @returns {string} 格式化的时间字符串
 */
function formatTime(timeString) {
    if (!timeString) return '';
    
    // 假设输入已经是 HH:MM 格式
    return timeString;
} 