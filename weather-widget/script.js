// --- 配置 ---
const CONFIG = {
    // 优先尝试的 API: 'openmeteo', 'openweathermap'
    API_PRIORITY: ['openmeteo', 'openweathermap'],
    OPENMETEO_GEO_URL: 'https://geocoding-api.open-meteo.com/v1/search',
    OPENMETEO_API_URL: 'https://api.open-meteo.com/v1/forecast',
    OPENWEATHERMAP_API_URL: 'https://api.openweathermap.org/data/2.5',
    // 默认 OpenWeatherMap API Key，建议用户替换
    DEFAULT_OWM_API_KEY: '1d3aae4e5b7ae01c32698a5fe99072b2',
    DEFAULT_CITY: '北京',
    UPDATE_INTERVAL: 30 * 60 * 1000, // 30分钟更新一次
    STORAGE_KEY: 'weather_widget_config_v2' // 更新 key 避免旧配置冲突
};

// --- DOM 元素获取 ---
// 使用函数统一获取元素，避免重复查询
function getElements() {
    return {
        body: document.body,
        location: document.querySelector('.location'),
        temp: document.querySelector('.temp'),
        weatherDesc: document.querySelector('.weather-desc'),
        weatherIcon: document.querySelector('.weather-icon img'),
        feelsLike: document.querySelector('.detail-item:nth-child(1) .detail-value'),
        humidity: document.querySelector('.detail-item:nth-child(2) .detail-value'),
        windSpeed: document.querySelector('.detail-item:nth-child(3) .detail-value'),
        updatedTime: document.querySelector('.updated-time'),
        forecastContainer: document.querySelector('.forecast-container'),
        settingsIcon: document.querySelector('.settings-icon'),
        settingsPanel: document.querySelector('.settings-panel'),
        saveButton: document.getElementById('save-settings'),
        cityInput: document.getElementById('city-input'),
        apiKeyInput: document.getElementById('api-key'), // OpenWeatherMap Key
        dataSource: document.querySelector('.data-source')
    };
}

// --- 本地存储 ---
function saveConfig(config) {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(config));
}

function loadConfig() {
    const savedConfig = localStorage.getItem(CONFIG.STORAGE_KEY);
    return savedConfig ? JSON.parse(savedConfig) : {
        city: CONFIG.DEFAULT_CITY,
        owmApiKey: CONFIG.DEFAULT_OWM_API_KEY, // OWM = OpenWeatherMap
        lastUpdated: null,
        lastSuccessfulApi: null // 记录上次成功的 API
    };
}

// --- 时间格式化 ---
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', { hour12: false });
}

function formatTimeHM(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}


// --- 天气图标映射 (如果需要) ---
// OpenWeatherMap 图标: https://openweathermap.org/weather-conditions
// Open-Meteo WMO Code: https://open-meteo.com/en/docs#weathervariables
// 简单映射示例，可能需要更完善
const WMO_TO_OWM_ICON_MAP = {
    0: '01d', // Clear sky
    1: '01d', // Mainly clear
    2: '02d', // Partly cloudy
    3: '03d', // Overcast
    45: '50d', // Fog
    48: '50d', // Depositing rime fog
    51: '09d', // Drizzle: Light
    53: '09d', // Drizzle: moderate
    55: '09d', // Drizzle: dense intensity
    56: '09d', // Freezing Drizzle: Light
    57: '09d', // Freezing Drizzle: dense
    61: '10d', // Rain: Slight
    63: '10d', // Rain: moderate
    65: '10d', // Rain: heavy intensity
    66: '10d', // Freezing Rain: Light
    67: '10d', // Freezing Rain: heavy
    71: '13d', // Snow fall: Slight
    73: '13d', // Snow fall: moderate
    75: '13d', // Snow fall: heavy intensity
    77: '13d', // Snow grains
    80: '09d', // Rain showers: Slight
    81: '09d', // Rain showers: moderate
    82: '09d', // Rain showers: violent
    85: '13d', // Snow showers slight
    86: '13d', // Snow showers heavy
    95: '11d', // Thunderstorm: Slight or moderate
    96: '11d', // Thunderstorm with slight hail
    99: '11d'  // Thunderstorm with heavy hail
};

function getWeatherIconUrl(iconCode, apiSource = 'openweathermap') {
    if (apiSource === 'openweathermap') {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    } else if (apiSource === 'openmeteo') {
        // 假设 iconCode 是 WMO 代码, 需要判断白天黑夜
        const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
        const owmIcon = WMO_TO_OWM_ICON_MAP[iconCode] || '01d'; // 默认晴天
        // 替换 d 为 n 表示夜晚
        const finalIcon = isDay ? owmIcon : owmIcon.replace('d', 'n');
        return `https://openweathermap.org/img/wn/${finalIcon}@2x.png`;
    }
    return 'https://openweathermap.org/img/wn/01d@2x.png'; // 默认图标
}

// --- UI 更新 ---
function updateUI(weatherData, apiSource) {
    const elements = getElements();

    elements.location.textContent = weatherData.locationName || '未知地点';
    elements.temp.textContent = `${Math.round(weatherData.temp)}°C`;
    elements.weatherDesc.textContent = weatherData.description || '--';
    elements.weatherIcon.src = getWeatherIconUrl(weatherData.icon, apiSource);
    elements.weatherIcon.alt = weatherData.description || '天气图标';
    elements.feelsLike.textContent = `${Math.round(weatherData.feelsLike)}°C`;
    elements.humidity.textContent = `${weatherData.humidity}%`;
    elements.windSpeed.textContent = `${weatherData.windSpeed} m/s`; // 统一单位 m/s

    // 更新预报
    elements.forecastContainer.innerHTML = ''; // 清空旧预报
    if (weatherData.forecast && weatherData.forecast.length > 0) {
        elements.forecastContainer.style.display = 'flex';
        weatherData.forecast.forEach(item => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-time">${formatTimeHM(item.time)}</div>
                <img src="${getWeatherIconUrl(item.icon, apiSource)}" alt="${item.description}">
                <div class="forecast-temp">${Math.round(item.temp)}°C</div>
            `;
            elements.forecastContainer.appendChild(forecastItem);
        });
    } else {
        elements.forecastContainer.style.display = 'none';
    }

    // 更新数据来源和时间
    const now = new Date();
    elements.updatedTime.textContent = `最后更新: ${formatDateTime(now)}`;
    elements.dataSource.textContent = `数据来源: ${apiSource === 'openmeteo' ? 'Open-Meteo' : 'OpenWeatherMap'}`;

    // 保存最后成功的 API 和更新时间
    const config = loadConfig();
    config.lastUpdated = now.getTime();
    config.lastSuccessfulApi = apiSource;
    saveConfig(config);
}

function showLoading(isLoading) {
    const elements = getElements();
    if (isLoading) {
        elements.body.classList.add('loading');
    } else {
        elements.body.classList.remove('loading');
    }
}

function showError(message) {
    const elements = getElements();
    elements.weatherDesc.textContent = message;
    elements.temp.textContent = '--°C';
    // 可以考虑清除其他数据或显示特定错误图标
    elements.forecastContainer.style.display = 'none';
    elements.dataSource.textContent = '数据获取失败';
}

function showFinalError() {
    showError('所有天气接口尝试失败');
    // 可以在这里添加更详细的提示，例如引导用户检查网络或获取 OWM API Key
     const elements = getElements();
     elements.location.textContent = '请检查城市名称或网络';
     elements.dataSource.innerHTML = `数据获取失败 <a href="https://openweathermap.org/appid" target="_blank" title="获取 OpenWeatherMap API Key">尝试获取Key?</a>`;
}

// --- 地理编码 ---
async function getCoordinatesForCity(city) {
    const url = `${CONFIG.OPENMETEO_GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
        }
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name, country_code } = data.results[0];
            return { latitude, longitude, name: `${name}, ${country_code}` };
        } else {
            throw new Error('找不到指定城市');
        }
    } catch (error) {
        console.error('地理编码失败:', error);
        throw error; // 将错误向上抛出
    }
}

// --- Open-Meteo API ---
async function fetchOpenMeteoData(latitude, longitude, locationName) {
    console.log('尝试使用 Open-Meteo...');
    const url = `${CONFIG.OPENMETEO_API_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Open-Meteo API error: ${response.status}`);
        }
        const data = await response.json();

        // 提取并映射数据
        const weatherData = {
            locationName: locationName || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, // 使用地理编码返回的城市名
            temp: data.current.temperature_2m,
            feelsLike: data.current.apparent_temperature,
            humidity: data.current.relative_humidity_2m,
            windSpeed: data.current.wind_speed_10m, // m/s - Open-Meteo 默认是 km/h, 需要转换或API指定
            description: '', // 需要根据 weather_code 查找描述
            icon: data.current.weather_code, // WMO code
            forecast: []
        };

        // 获取天气描述 (可以从 WMO code 映射)
        // ... 可以在这里添加 WMO code 到中文描述的映射 ...
        weatherData.description = `WMO: ${data.current.weather_code}`; // 临时

        // 提取小时预报 (取接下来几个小时)
        const nowHour = new Date().getHours();
        const startIndex = data.hourly.time.findIndex(t => new Date(t).getHours() >= nowHour);
        if (startIndex !== -1) {
            for (let i = startIndex; i < Math.min(startIndex + 5, data.hourly.time.length); i++) {
                weatherData.forecast.push({
                    time: new Date(data.hourly.time[i]),
                    temp: data.hourly.temperature_2m[i],
                    icon: data.hourly.weather_code[i],
                    description: `WMO: ${data.hourly.weather_code[i]}` // 临时
                });
            }
        }

        updateUI(weatherData, 'openmeteo');
        console.log('Open-Meteo 数据获取成功');
        return true; // 表示成功

    } catch (error) {
        console.error('Open-Meteo 获取失败:', error);
        return false; // 表示失败
    }
}

// --- OpenWeatherMap API ---
async function fetchOpenWeatherData(city, apiKey) {
    console.log('尝试使用 OpenWeatherMap...');
    const weatherUrl = `${CONFIG.OPENWEATHERMAP_API_URL}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=zh_cn`;
    const forecastUrl = `${CONFIG.OPENWEATHERMAP_API_URL}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=zh_cn&cnt=5`; // 获取5个时间点的预报

    try {
        // 并行获取当前天气和预报
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(forecastUrl)
        ]);

        if (!weatherResponse.ok) {
            throw new Error(`OWM Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
        }
        if (!forecastResponse.ok) {
            // 预报失败不阻止显示当前天气
             console.warn(`OWM Forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
        }

        const weatherDataRaw = await weatherResponse.json();
        const forecastDataRaw = forecastResponse.ok ? await forecastResponse.json() : null;

        // 提取并映射数据
        const weatherData = {
            locationName: `${weatherDataRaw.name}, ${weatherDataRaw.sys.country}`,
            temp: weatherDataRaw.main.temp,
            feelsLike: weatherDataRaw.main.feels_like,
            humidity: weatherDataRaw.main.humidity,
            windSpeed: weatherDataRaw.wind.speed, // m/s
            description: weatherDataRaw.weather[0].description,
            icon: weatherDataRaw.weather[0].icon,
            forecast: []
        };

        // 提取预报数据
        if (forecastDataRaw && forecastDataRaw.list) {
            weatherData.forecast = forecastDataRaw.list.map(item => ({
                time: new Date(item.dt * 1000),
                temp: item.main.temp,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            }));
        }

        updateUI(weatherData, 'openweathermap');
        console.log('OpenWeatherMap 数据获取成功');
        return true; // 表示成功

    } catch (error) {
        console.error('OpenWeatherMap 获取失败:', error);
        // 如果错误是 401 (Unauthorized)，可能是 API Key 问题
        if (error.message.includes('401')) {
             showError('OpenWeatherMap API Key 无效或错误');
             const elements = getElements();
             elements.dataSource.innerHTML = `数据来源: OWM Key 无效 <a href="https://openweathermap.org/appid" target="_blank" title="获取 OpenWeatherMap API Key">获取Key?</a>`;
        }
        return false; // 表示失败
    }
}


// --- 主更新逻辑 (轮询) ---
async function updateWeatherWithFallback() {
    showLoading(true);
    const config = loadConfig();
    const city = config.city || CONFIG.DEFAULT_CITY;
    const owmApiKey = config.owmApiKey || CONFIG.DEFAULT_OWM_API_KEY;

    let success = false;
    let coordinates = null;

    // 1. 尝试地理编码
    try {
        coordinates = await getCoordinatesForCity(city);
         // 更新地点显示为地理编码返回的名称
         const elements = getElements();
         if (coordinates?.name && elements.location) {
             elements.location.textContent = coordinates.name;
         }
    } catch (geoError) {
        showError(`无法找到城市: ${city}`);
        showLoading(false);
        return; // 地理编码失败，无法继续
    }

    // 2. 按优先级尝试 API
    for (const api of CONFIG.API_PRIORITY) {
        if (api === 'openmeteo' && coordinates) {
            success = await fetchOpenMeteoData(coordinates.latitude, coordinates.longitude, coordinates.name);
        } else if (api === 'openweathermap') {
            success = await fetchOpenWeatherData(city, owmApiKey);
        }

        if (success) {
            break; // 如果成功，跳出循环
        }
    }

    // 3. 如果所有 API 都失败
    if (!success) {
        showFinalError();
    }

    showLoading(false);
}


// --- 设置面板 ---
function setupSettingsPanel() {
    const elements = getElements();
    const config = loadConfig();

    // 加载当前配置到输入框
    elements.cityInput.value = config.city || '';
    elements.apiKeyInput.value = config.owmApiKey || '';

    // 切换设置面板显示
    elements.settingsIcon.addEventListener('click', () => {
        const isVisible = elements.settingsPanel.style.display !== 'none';
        elements.settingsPanel.style.display = isVisible ? 'none' : 'block';
    });

    // 保存设置
    elements.saveButton.addEventListener('click', () => {
        const city = elements.cityInput.value.trim();
        const apiKey = elements.apiKeyInput.value.trim();

        if (city) {
            const newConfig = loadConfig(); // 获取当前配置
            newConfig.city = city;
            newConfig.owmApiKey = apiKey || CONFIG.DEFAULT_OWM_API_KEY;
            // 用户保存设置后，清除上次成功的 API 记录，以便下次优先尝试 Open-Meteo
            newConfig.lastSuccessfulApi = null;
            saveConfig(newConfig);

            // 立即更新天气
            updateWeatherWithFallback();

            // 隐藏设置面板
            elements.settingsPanel.style.display = 'none';
        } else {
            alert('请输入有效的城市名称');
        }
    });
}

// --- 初始化 ---
function initWeatherWidget() {
    setupSettingsPanel();
    // 立即更新天气
    updateWeatherWithFallback();
    // 设置定时更新
    setInterval(updateWeatherWithFallback, CONFIG.UPDATE_INTERVAL);
}

// --- 启动 ---
document.addEventListener('DOMContentLoaded', initWeatherWidget); 