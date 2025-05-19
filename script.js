// API Configuration
const API_KEY = "9af3e95259ea4cb0b28210932251905"; 
const BASE_URL = "https://api.weatherapi.com/v1";

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locateBtn = document.getElementById('locateBtn');
const currentWeather = document.getElementById('currentWeather');
const forecastContainer = document.getElementById('forecastContainer');
const errorMsg = document.getElementById('errorMsg');
const themeToggle = document.getElementById('themeToggle');
const unitToggle = document.getElementById('unitToggle');
const viewToggle = document.getElementById('viewToggle');
const historyBtn = document.getElementById('historyBtn');
const historyDropdown = document.getElementById('historyDropdown');
const historyList = document.getElementById('historyList');
const advancedMetrics = document.getElementById('advancedMetrics');
const clearBtn = document.getElementById('clearBtn');

// State variables
let isCelsius = true;
let isAdvancedView = false;
let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
let current = null; // Store current weather data for unit toggling
let data = null; // Store all weather data for forecast unit toggling

// Initialize theme from localStorage or prefer-color-scheme
function initializeTheme() {
    const currentTheme = localStorage.getItem('theme') || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    updateThemeIcon();
}

// Initialize the app
function init() {
    initializeTheme();
    loadLastSearch();
    renderSearchHistory();
}

// Load last searched city if available
function loadLastSearch() {
    if (searchHistory.length > 0) {
        cityInput.value = searchHistory[0];
        searchBtn.click();
    }
}

// Fetch Weather Data
async function fetchWeatherData(query) {
    try {
        // Show loading states
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const response = await fetch(
            `${BASE_URL}/forecast.json?key=${API_KEY}&q=${query}&days=5&aqi=no&alerts=no`
        );
        
        if (!response.ok) throw new Error("City not found");
        
        data = await response.json();
        current = data.current;
        
        displayCurrentWeather(data);
        displayForecast(data);
        addToHistory(data.location.name);
        
        return data;
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError();
        return null;
    } finally {
        // Reset button states
        searchBtn.innerHTML = '<i class="fas fa-search"></i>';
        locateBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
    }
}

// Display Current Weather
function displayCurrentWeather(data) {
    const { location, current } = data;
    const date = new Date(location.localtime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    document.getElementById('cityName').textContent = `${location.name}, ${location.country}`;
    document.getElementById('currentDate').textContent = date;
    document.getElementById('weatherDesc').textContent = current.condition.text;
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind_kph)} km/h`;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('pressure').textContent = `${current.pressure_mb} hPa`;
    document.getElementById('weatherIcon').src = `https:${current.condition.icon}`;

    // Advanced metrics
    document.getElementById('visibility').textContent = `${current.vis_km} km`;
    document.getElementById('precip').textContent = `${current.precip_mm} mm`;
    document.getElementById('uvIndex').textContent = current.uv;
    document.getElementById('cloudCover').textContent = `${current.cloud}%`;

    // Update temperature display based on current unit
    updateTemperatureDisplay();

    currentWeather.classList.remove('hidden');
    errorMsg.classList.add('hidden');
}

// Update temperature display based on current unit
function updateTemperatureDisplay() {
    if (!current) return;
    
    const currentTemp = document.getElementById('currentTemp');
    const feelsLike = document.getElementById('feelsLike');
    
    if (isCelsius) {
        currentTemp.textContent = `${Math.round(current.temp_c)}°C`;
        feelsLike.textContent = `${Math.round(current.feelslike_c)}°C`;
    } else {
        currentTemp.textContent = `${Math.round(current.temp_f)}°F`;
        feelsLike.textContent = `${Math.round(current.feelslike_f)}°F`;
    }
    
    // Update forecast temperatures if data exists
    if (data && data.forecast) {
        document.querySelectorAll('#forecastContainer [class*="gradient-text"]').forEach((el, i) => {
            const forecastDay = data.forecast.forecastday[i];
            el.textContent = isCelsius ? 
                `${Math.round(forecastDay.day.avgtemp_c)}°C` : 
                `${Math.round(forecastDay.day.avgtemp_f)}°F`;
        });
    }
}

// Display 5-Day Forecast
function displayForecast(data) {
    forecastContainer.innerHTML = ''; // Clear previous forecast
    const forecastDays = data.forecast.forecastday;

    forecastDays.forEach(day => {
        const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
        const temp = isCelsius ? Math.round(day.day.avgtemp_c) : Math.round(day.day.avgtemp_f);
        const tempUnit = isCelsius ? '°C' : '°F';
        const icon = day.day.condition.icon;
        const description = day.day.condition.text;

        const forecastCard = document.createElement('div');
        forecastCard.className = 'glass-card rounded-lg shadow p-4 text-center transform hover:scale-105 smooth-transition dark:glass-card';
        forecastCard.innerHTML = `
        <p class="font-semibold text-gray-700 dark:text-gray-500">${date}</p>
        <img src="https:${icon}" alt="${description}" class="mx-auto my-2 w-12 h-12">
        <p class="text-xl font-bold gradient-text">${temp}${tempUnit}</p>
        <p class="text-sm capitalize font-medium text-gray-600 dark:text-gray-500">${description}</p>
        `;

        forecastContainer.appendChild(forecastCard);
    });
}

// Show Error Message
function showError() {
    errorMsg.classList.remove('hidden');
    currentWeather.classList.add('hidden');
    forecastContainer.innerHTML = '';
    
    // Add placeholder cards back
    const placeholderHTML = `
        <div class="forecast-placeholder glass-card rounded-lg p-3 text-center animate-pulse h-32 dark:glass-card"></div>
        <div class="forecast-placeholder glass-card rounded-lg p-3 text-center animate-pulse h-32 dark:glass-card"></div>
        <div class="hidden sm:block forecast-placeholder glass-card rounded-lg p-3 text-center animate-pulse h-32 dark:glass-card"></div>
        <div class="hidden md:block forecast-placeholder glass-card rounded-lg p-3 text-center animate-pulse h-32 dark:glass-card"></div>
        <div class="hidden lg:block forecast-placeholder glass-card rounded-lg p-3 text-center animate-pulse h-32 dark:glass-card"></div>
    `;
    forecastContainer.innerHTML = placeholderHTML;
}

// Add to search history
function addToHistory(city) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
    // Add to beginning
    searchHistory.unshift(city);
    // Keep only last 5 items
    searchHistory = searchHistory.slice(0, 5);
    localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
    renderSearchHistory();
}

// Render search history
function renderSearchHistory() {
    historyList.innerHTML = searchHistory.map(city => `
        <button class="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2 dark:hover:bg-gray-700">
            <i class="fas fa-search text-gray-400"></i>
            <span class="dark:text-white">${city}</span>
        </button>
    `).join('');
    
    // Add event listeners to history items
    document.querySelectorAll('#historyList button').forEach(btn => {
        btn.addEventListener('click', () => {
            cityInput.value = btn.querySelector('span').textContent;
            searchBtn.click();
            historyDropdown.classList.add('hidden');
        });
    });
}

// Update theme icon
function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    themeToggle.innerHTML = isDark ? 
        '<i class="fas fa-sun text-yellow-400"></i>' : 
        '<i class="fas fa-moon text-blue-500"></i>';
}

// Event Listeners
searchBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!city) return;
    await fetchWeatherData(city);
});

locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const weatherData = await fetchWeatherData(`${lat},${lon}`);

        if (weatherData) {
        // Update input box with actual city name
        cityInput.value = `${weatherData.location.name}, ${weatherData.location.country}`;
        
        displayCurrentWeather(weatherData);
        displayForecast(weatherData);
        }
        }, () => {
        alert("Unable to retrieve your location. Please check your location settings.");
        locateBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
    });
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// Toggle temperature unit
unitToggle.addEventListener('click', () => {
    isCelsius = !isCelsius;
    unitToggle.querySelector('span').textContent = isCelsius ? '°C / °F' : '°F / °C';
    updateTemperatureDisplay();
});

// Toggle advanced view
viewToggle.addEventListener('click', () => {
    isAdvancedView = !isAdvancedView;
    viewToggle.querySelector('span').textContent = isAdvancedView ? 'Basic' : 'Advanced';
    advancedMetrics.classList.toggle('hidden', !isAdvancedView);
});

// Toggle theme
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
});

// Toggle search history
historyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    historyDropdown.classList.toggle('hidden');
    if (!historyDropdown.classList.contains('hidden')) {
        renderSearchHistory();
    }
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    historyDropdown.classList.add('hidden');
});

//Clear text from Search TextBox
clearBtn.addEventListener('click', () => {
    cityInput.value = '';
    cityInput.focus();
});


// Initialize the app
init();