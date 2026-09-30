/**
 * ============================================================================
 * JAVASCRIPT - APLICAÇÃO DE PREVISÃO DO TEMPO
 * ============================================================================
 * Olá! Este código foi estruturado de forma didática, limpa e modular.
 * Aqui utilizamos JavaScript moderno (ES6+), async/await para requisições assíncronas
 * e a API gratuita do Open-Meteo (que não requer cadastro nem chave secreta de API).
 */

// ----------------------------------------------------------------------------
// 1. MAPEAMENTO DE CÓDIGOS DE CLIMA (WMO Weather Codes)
// A API Open-Meteo retorna códigos numéricos para representar o tempo.
// Esta tabela converte o número em uma descrição legível em português e um emoji/ícone.
// ----------------------------------------------------------------------------
const WEATHER_CODES = {
  0: { description: 'Céu Limpo', iconDay: '☀️', iconNight: '🌙' },
  1: { description: 'Principalmente Ensolarado', iconDay: '🌤️', iconNight: '🌤️' },
  2: { description: 'Parcialmente Nublado', iconDay: '⛅', iconNight: '⛅' },
  3: { description: 'Nublado / Encoberto', iconDay: '☁️', iconNight: '☁️' },
  45: { description: 'Nevoeiro', iconDay: '🌫️', iconNight: '🌫️' },
  48: { description: 'Nevoeiro com Geada', iconDay: '🌫️', iconNight: '🌫️' },
  51: { description: 'Garoa Leve', iconDay: '🌦️', iconNight: '🌦️' },
  53: { description: 'Garoa Moderada', iconDay: '🌦️', iconNight: '🌦️' },
  55: { description: 'Garoa Densa', iconDay: '🌧️', iconNight: '🌧️' },
  56: { description: 'Garoa Congelante Leve', iconDay: '🌨️', iconNight: '🌨️' },
  57: { description: 'Garoa Congelante Densa', iconDay: '🌨️', iconNight: '🌨️' },
  61: { description: 'Chuva Fraca', iconDay: '🌧️', iconNight: '🌧️' },
  63: { description: 'Chuva Moderada', iconDay: '🌧️', iconNight: '🌧️' },
  65: { description: 'Chuva Forte', iconDay: '🌧️', iconNight: '🌧️' },
  66: { description: 'Chuva Congelante Leve', iconDay: '🌨️', iconNight: '🌨️' },
  67: { description: 'Chuva Congelante Forte', iconDay: '🌨️', iconNight: '🌨️' },
  71: { description: 'Neve Fraca', iconDay: '❄️', iconNight: '❄️' },
  73: { description: 'Neve Moderada', iconDay: '❄️', iconNight: '❄️' },
  75: { description: 'Neve Intensa', iconDay: '❄️', iconNight: '❄️' },
  77: { description: 'Grãos de Neve', iconDay: '❄️', iconNight: '❄️' },
  80: { description: 'Pancadas de Chuva Leves', iconDay: '🌦️', iconNight: '🌦️' },
  81: { description: 'Pancadas de Chuva Moderadas', iconDay: '🌧️', iconNight: '🌧️' },
  82: { description: 'Pancadas de Chuva Violentas', iconDay: '⛈️', iconNight: '⛈️' },
  85: { description: 'Pancadas de Neve Leves', iconDay: '🌨️', iconNight: '🌨️' },
  86: { description: 'Pancadas de Neve Fortes', iconDay: '🌨️', iconNight: '🌨️' },
  95: { description: 'Tempestade com Trovões', iconDay: '⛈️', iconNight: '⛈️' },
  96: { description: 'Tempestade com Granizo Leve', iconDay: '⛈️', iconNight: '⛈️' },
  99: { description: 'Tempestade com Granizo Forte', iconDay: '⛈️', iconNight: '⛈️' }
};

/**
 * Retorna as informações visuais e textuais do clima de acordo com o código WMO.
 * @param {number} code - Código retornado pela API
 * @param {number} isDay - 1 se for dia, 0 se for noite
 */
function getWeatherInfo(code, isDay = 1) {
  const info = WEATHER_CODES[code] || { description: 'Desconhecido', iconDay: '🌡️', iconNight: '🌡️' };
  return {
    description: info.description,
    icon: isDay ? info.iconDay : info.iconNight
  };
}

// ----------------------------------------------------------------------------
// 2. SELEÇÃO DE ELEMENTOS DO DOM (DOCUMENT OBJECT MODEL)
// Guardamos referências dos elementos HTML para manipular o conteúdo via JS.
// ----------------------------------------------------------------------------
const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const btnSearch = document.getElementById('btn-search');
const btnGeo = document.getElementById('btn-geolocation');
const quickChips = document.getElementById('quick-chips');

const errorBox = document.getElementById('error-box');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading-spinner');
const weatherContent = document.getElementById('weather-content');

// Elementos do Clima Atual
const cityNameEl = document.getElementById('city-name');
const countryBadgeEl = document.getElementById('country-badge');
const currentDateEl = document.getElementById('current-date');
const weatherIconMainEl = document.getElementById('weather-icon-main');
const currentTempEl = document.getElementById('current-temp');
const weatherDescriptionEl = document.getElementById('weather-description');

// Métricas detalhadas
const metricApparentEl = document.getElementById('metric-apparent');
const metricHumidityEl = document.getElementById('metric-humidity');
const metricWindEl = document.getElementById('metric-wind');
const metricPrecipitationEl = document.getElementById('metric-precipitation');

// Container da previsão de 5 dias
const forecastCardsEl = document.getElementById('forecast-cards');

// ----------------------------------------------------------------------------
// 3. GERENCIAMENTO DE ESTADO E INTERFACE (FEEDBACK VISUAL)
// Funções para exibir loading, esconder erros e atualizar a tela.
// ----------------------------------------------------------------------------

/**
 * Ativa ou desativa o indicador de carregamento
 * @param {boolean} isLoading 
 */
function setLoading(isLoading) {
  if (isLoading) {
    loadingSpinner.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    btnSearch.disabled = true;
    hideError();
  } else {
    loadingSpinner.classList.add('hidden');
    weatherContent.classList.remove('hidden');
    btnSearch.disabled = false;
  }
}

/**
 * Exibe uma mensagem de erro estilizada para o usuário
 * @param {string} msg 
 */
function showError(msg) {
  errorMessage.textContent = msg;
  errorBox.classList.remove('hidden');
  loadingSpinner.classList.add('hidden');
  btnSearch.disabled = false;
}

/**
 * Esconde a mensagem de erro
 */
function hideError() {
  errorBox.classList.add('hidden');
}

// ----------------------------------------------------------------------------
// 4. FORMATAÇÃO DE DATAS
// Utilizamos a API nativa Intl.DateTimeFormat para ter datas elegantes em PT-BR.
// ----------------------------------------------------------------------------

/**
 * Formata a data atual por extenso (ex: "Domingo, 13 de Setembro de 2026")
 */
function formatCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formatted = new Intl.DateTimeFormat('pt-BR', options).format(now);
  // Deixa a primeira letra maiúscula
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Retorna o nome do dia da semana a partir de uma string ISO (ex: "Seg", "Ter")
 * @param {string} dateString - Formato 'YYYY-MM-DD'
 */
function formatDayOfWeek(dateString) {
  // Adiciona horário T12:00:00 para evitar desvios de fuso horário ao criar a data
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '');
}

/**
 * Formata uma data para dia e mês (ex: "14/09")
 * @param {string} dateString - Formato 'YYYY-MM-DD'
 */
function formatShortDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

// ----------------------------------------------------------------------------
// 5. CONSUMO DAS APIS (GEOCODING & PREVISÃO DO TEMPO)
// ----------------------------------------------------------------------------

/**
 * 1º Passo: Busca as coordenadas (latitude e longitude) a partir do nome da cidade.
 * Utiliza a Open-Meteo Geocoding API.
 * @param {string} cityName 
 * @returns {Promise<Object>} Dados de localização encontrados
 */
async function fetchCityCoordinates(cityName) {
  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error('Falha ao conectar com o serviço de busca de cidades.');
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`A cidade "${cityName}" não foi encontrada. Verifique o nome e tente novamente.`);
  }

  const city = data.results[0];
  return {
    name: city.name,
    country: city.country || '',
    countryCode: city.country_code || '',
    state: city.admin1 || '',
    latitude: city.latitude,
    longitude: city.longitude
  };
}

/**
 * 2º Passo: Busca o clima atual e os próximos 5 dias com base nas coordenadas.
 * Utiliza a Open-Meteo Forecast API.
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Dados climáticos completos
 */
async function fetchWeatherData(latitude, longitude) {
  const currentParams = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'is_day',
    'precipitation',
    'weather_code',
    'wind_speed_10m'
  ].join(',');

  const dailyParams = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min'
  ].join(',');

  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${currentParams}&daily=${dailyParams}&timezone=auto`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error('Falha ao buscar os dados da previsão do tempo.');
  }

  return await response.json();
}

/**
 * Busca reversa de localização: Descobre o nome da cidade a partir de Latitude e Longitude (GPS).
 * Utiliza a API pública BigDataCloud (gratuita e sem chave).
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<Object>}
 */
async function reverseGeocode(lat, lon) {
  try {
    const endpoint = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.city || data.locality || 'Sua Localização',
        country: data.countryName || 'Local',
        countryCode: data.countryCode || 'GPS'
      };
    }
  } catch (err) {
    console.warn('Não foi possível obter o nome reverso da cidade, usando padrão.', err);
  }

  return {
    name: 'Sua Localização',
    country: 'Atual',
    countryCode: 'GPS'
  };
}

// ----------------------------------------------------------------------------
// 6. RENDERIZAÇÃO DOS DADOS NA TELA
// Atualiza os elementos visuais com as informações recebidas da API.
// ----------------------------------------------------------------------------

/**
 * Renderiza o Cartão Principal (Clima Atual)
 * @param {Object} current - Dados do clima atual
 * @param {Object} location - Dados da cidade
 */
function renderCurrentWeather(current, location) {
  // Localização
  cityNameEl.textContent = location.name;
  countryBadgeEl.textContent = location.countryCode ? location.countryCode.toUpperCase() : 'BR';
  currentDateEl.textContent = formatCurrentDate();

  // Informações do tempo
  const weather = getWeatherInfo(current.weather_code, current.is_day);
  weatherIconMainEl.textContent = weather.icon;
  currentTempEl.textContent = Math.round(current.temperature_2m);
  weatherDescriptionEl.textContent = weather.description;

  // Métricas detalhadas
  metricApparentEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
  metricHumidityEl.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  metricWindEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  metricPrecipitationEl.textContent = `${current.precipitation || 0} mm`;
}

/**
 * Renderiza os 5 cards da previsão dos próximos dias
 * @param {Object} daily - Dados diários retornados da API
 */
function renderForecast(daily) {
  forecastCardsEl.innerHTML = '';

  // Pegamos os próximos 5 dias (ignorando o índice 0 que é o dia de hoje)
  const daysCount = Math.min(6, daily.time.length);

  for (let i = 1; i < daysCount; i++) {
    const dateStr = daily.time[i];
    const weatherCode = daily.weather_code[i];
    const tempMax = Math.round(daily.temperature_2m_max[i]);
    const tempMin = Math.round(daily.temperature_2m_min[i]);
    const weather = getWeatherInfo(weatherCode, 1);

    const dayName = formatDayOfWeek(dateStr);
    const shortDate = formatShortDate(dateStr);

    // Cria o elemento do card
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <div class="forecast-date">${shortDate}</div>
      <div class="forecast-icon" aria-hidden="true">${weather.icon}</div>
      <div class="forecast-temp-range">
        <span class="forecast-temp-max">${tempMax}°</span>
        <span class="forecast-temp-min">${tempMin}°</span>
      </div>
      <div class="forecast-condition">${weather.description}</div>
    `;

    forecastCardsEl.appendChild(card);
  }
}

// ----------------------------------------------------------------------------
// 7. FUNÇÃO COORDENADORA PRINCIPAL
// Orquestra a busca, loading, tratamento de erros e renderização.
// ----------------------------------------------------------------------------

/**
 * Busca e exibe a previsão do tempo para uma cidade digitada
 * @param {string} cityName 
 */
async function loadWeatherForCity(cityName) {
  if (!cityName || cityName.trim() === '') {
    showError('Por favor, digite o nome de uma cidade.');
    return;
  }

  try {
    setLoading(true);

    // 1. Obter coordenadas da cidade
    const location = await fetchCityCoordinates(cityName.trim());

    // 2. Obter dados meteorológicos
    const weatherData = await fetchWeatherData(location.latitude, location.longitude);

    // 3. Renderizar na tela
    renderCurrentWeather(weatherData.current, location);
    renderForecast(weatherData.daily);

    // Limpa o input
    cityInput.value = '';
    cityInput.blur();

  } catch (error) {
    console.error('Erro ao consultar o clima:', error);
    showError(error.message || 'Ocorreu um erro inesperado ao consultar a previsão.');
  } finally {
    setLoading(false);
  }
}

/**
 * Busca e exibe a previsão a partir da Geolocalização (GPS)
 * @param {number} lat 
 * @param {number} lon 
 */
async function loadWeatherForCoordinates(lat, lon) {
  try {
    setLoading(true);

    // 1. Obter o nome amigável da cidade
    const location = await reverseGeocode(lat, lon);

    // 2. Obter dados meteorológicos
    const weatherData = await fetchWeatherData(lat, lon);

    // 3. Renderizar na tela
    renderCurrentWeather(weatherData.current, location);
    renderForecast(weatherData.daily);

  } catch (error) {
    console.error('Erro ao obter clima por GPS:', error);
    showError('Não foi possível obter a previsão para sua localização atual.');
  } finally {
    setLoading(false);
  }
}

// ----------------------------------------------------------------------------
// 8. EVENT LISTENERS (OUVINTES DE EVENTOS)
// Respondem às interações do usuário (cliques, envios de formulário).
// ----------------------------------------------------------------------------

// Envio do formulário de busca
form.addEventListener('submit', (e) => {
  e.preventDefault(); // Impede o recarregamento padrão da página
  const query = cityInput.value;
  loadWeatherForCity(query);
});

// Clique no botão "Meu Local" (Geolocalização)
btnGeo.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Seu navegador não suporta geolocalização.');
    return;
  }

  setLoading(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      loadWeatherForCoordinates(latitude, longitude);
    },
    (error) => {
      console.warn('Erro de geolocalização:', error);
      let errorMsg = 'Permissão de localização negada ou indisponível.';
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = 'Você negou a permissão de localização no navegador.';
      }
      showError(errorMsg);
      setLoading(false);
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
});

// Clique nas cidades rápidas sugeridas (Chips)
quickChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  const selectedCity = chip.getAttribute('data-city');
  if (selectedCity) {
    loadWeatherForCity(selectedCity);
  }
});

// ----------------------------------------------------------------------------
// 9. INICIALIZAÇÃO DA APLICAÇÃO
// Ao abrir a página pela primeira vez, carrega uma cidade padrão (São Paulo).
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Carrega São Paulo como cidade inicial padrão
  loadWeatherForCity('São Paulo');
});
