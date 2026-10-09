import { useQuery } from "@tanstack/react-query";

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  precipitation: number;
  humidity: number;
  alerts: WeatherAlert[];
  source: "ipma";
}

export interface WeatherAlert {
  type: "rain" | "wind" | "storm" | "sea" | "cold" | "heat" | "fog" | "snow";
  message: string;
  severity: "warning" | "danger";
}

export interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  precipitationProbability: number;
  windClass: number;
  windDirection: string;
}

export interface HourlyForecast {
  datetime: string;
  hour: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  windClass: number;
}

export interface DetailedWeatherData extends WeatherData {
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  todayForecast: {
    temperatureMin: number;
    temperatureMax: number;
    precipitationProbability: number;
    windDirection: string;
    windClass: number;
  } | null;
}

const IPMA_OBSERVATION_STATION = "1210739";
const IPMA_CITY_ID = "1110600";
const IPMA_WARNING_AREA = "LSB";

const IPMA_WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Sem informação", icon: "cloud" },
  1: { description: "Céu limpo", icon: "sun" },
  2: { description: "Céu pouco nublado", icon: "cloud-sun" },
  3: { description: "Céu parcialmente nublado", icon: "cloud-sun" },
  4: { description: "Céu muito nublado", icon: "cloud" },
  5: { description: "Céu nublado por nuvens altas", icon: "cloud" },
  6: { description: "Aguaceiros", icon: "cloud-rain" },
  7: { description: "Aguaceiros fracos", icon: "cloud-drizzle" },
  8: { description: "Aguaceiros fortes", icon: "cloud-rain" },
  9: { description: "Chuva", icon: "cloud-rain" },
  10: { description: "Chuva fraca", icon: "cloud-drizzle" },
  11: { description: "Chuva forte", icon: "cloud-rain" },
  12: { description: "Períodos de chuva", icon: "cloud-rain" },
  13: { description: "Períodos de chuva fraca", icon: "cloud-drizzle" },
  14: { description: "Períodos de chuva forte", icon: "cloud-rain" },
  15: { description: "Chuvisco", icon: "cloud-drizzle" },
  16: { description: "Neblina", icon: "cloud-fog" },
  17: { description: "Nevoeiro", icon: "cloud-fog" },
  18: { description: "Neve", icon: "snowflake" },
  19: { description: "Trovoada", icon: "cloud-lightning" },
  20: { description: "Aguaceiros com trovoada", icon: "cloud-lightning" },
  21: { description: "Granizo", icon: "cloud-rain" },
  22: { description: "Geada", icon: "snowflake" },
  23: { description: "Chuva com trovoada", icon: "cloud-lightning" },
  24: { description: "Nebulosidade convectiva", icon: "cloud" },
  25: { description: "Céu com períodos de nublado", icon: "cloud-sun" },
  26: { description: "Nevoeiro", icon: "cloud-fog" },
  27: { description: "Céu nublado", icon: "cloud" },
  28: { description: "Aguaceiros de neve", icon: "snowflake" },
  29: { description: "Chuva e neve", icon: "snowflake" },
  30: { description: "Chuva e neve", icon: "snowflake" },
};

const WIND_CLASS_LABELS: Record<number, string> = {
  1: "Fraco",
  2: "Moderado",
  3: "Forte",
  4: "Muito forte",
};

export function getWeatherInfo(code: number) {
  return IPMA_WEATHER_CODES[code] || { description: "Desconhecido", icon: "cloud" };
}

export function getWindClassLabel(windClass: number): string {
  return WIND_CLASS_LABELS[windClass] || "";
}

interface IPMAObservation {
  intensidadeVentoKM: number;
  temperatura: number;
  radiacao: number;
  idDireccVento: number;
  precAcumulada: number;
  intensidadeVento: number;
  humidade: number;
  pressao: number;
}

interface IPMAForecastDay {
  precipitaProb: string;
  tMin: string;
  tMax: string;
  predWindDir: string;
  idWeatherType: number;
  classWindSpeed: number;
  longitude: string;
  forecastDate: string;
  classPrecInt: number;
  latitude: string;
}

interface IPMAWarning {
  text: string;
  awarenessTypeName: string;
  idAreaAviso: string;
  startTime: string;
  awarenessLevelID: string;
  endTime: string;
}

function isCurrentlyDay(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 7 && hour < 20;
}

function mapWarningType(awarenessTypeName: string): WeatherAlert["type"] {
  const map: Record<string, WeatherAlert["type"]> = {
    "Precipitação": "rain",
    "Vento": "wind",
    "Trovoada": "storm",
    "Agitação Marítima": "sea",
    "Tempo Frio": "cold",
    "Tempo Quente": "heat",
    "Nevoeiro": "fog",
    "Neve": "snow",
  };
  return map[awarenessTypeName] || "wind";
}

function mapWarningSeverity(level: string): WeatherAlert["severity"] {
  return level === "red" || level === "orange" ? "danger" : "warning";
}

async function fetchIPMAObservation(): Promise<IPMAObservation | null> {
  try {
    const response = await fetch("https://api.ipma.pt/open-data/observation/meteorology/stations/observations.json");
    if (!response.ok) return null;

    const data = await response.json();
    const timestamps = Object.keys(data).sort();
    if (timestamps.length === 0) return null;

    for (let i = timestamps.length - 1; i >= 0; i--) {
      const stationData = data[timestamps[i]][IPMA_OBSERVATION_STATION];
      if (stationData && stationData.temperatura !== null && stationData.temperatura !== -99) {
        return stationData;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchIPMAForecast(): Promise<IPMAForecastDay[]> {
  const response = await fetch(`https://api.ipma.pt/open-data/forecast/meteorology/cities/daily/${IPMA_CITY_ID}.json`);
  if (!response.ok) throw new Error("Erro ao obter previsão IPMA");
  const data = await response.json();
  return data.data || [];
}

async function fetchIPMAWarnings(): Promise<IPMAWarning[]> {
  try {
    const response = await fetch("https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json");
    if (!response.ok) return [];
    const data: IPMAWarning[] = await response.json();

    const now = new Date();
    return data.filter(
      (w) =>
        w.idAreaAviso === IPMA_WARNING_AREA &&
        w.awarenessLevelID !== "green" &&
        new Date(w.endTime) > now
    );
  } catch {
    return [];
  }
}

interface IPMAHourlyEntry {
  dataPrev: string;
  idWeatherType: number;
  tMed: number;
  precipitaProb: string;
  classWindSpeed: number;
}

const LOURINHA_LAT = 39.25;
const LOURINHA_LON = -9.33;

const WMO_TO_IPMA_CODE: Record<number, number> = {
  0: 1,    // Clear sky → Céu limpo
  1: 2,    // Mainly clear → Céu pouco nublado
  2: 3,    // Partly cloudy → Céu parcialmente nublado
  3: 4,    // Overcast → Céu muito nublado
  45: 17,  // Fog → Nevoeiro
  48: 17,  // Depositing rime fog → Nevoeiro
  51: 15,  // Light drizzle → Chuvisco
  53: 15,  // Moderate drizzle → Chuvisco
  55: 15,  // Dense drizzle → Chuvisco
  61: 10,  // Slight rain → Chuva fraca
  63: 9,   // Moderate rain → Chuva
  65: 11,  // Heavy rain → Chuva forte
  71: 18,  // Slight snow → Neve
  73: 18,  // Moderate snow → Neve
  75: 18,  // Heavy snow → Neve
  77: 18,  // Snow grains → Neve
  80: 7,   // Slight rain showers → Aguaceiros fracos
  81: 6,   // Moderate rain showers → Aguaceiros
  82: 8,   // Violent rain showers → Aguaceiros fortes
  85: 28,  // Slight snow showers → Aguaceiros de neve
  86: 28,  // Heavy snow showers → Aguaceiros de neve
  95: 19,  // Thunderstorm → Trovoada
  96: 20,  // Thunderstorm with slight hail → Aguaceiros com trovoada
  99: 20,  // Thunderstorm with heavy hail → Aguaceiros com trovoada
};

function wmoToIpmaCode(wmoCode: number): number {
  return WMO_TO_IPMA_CODE[wmoCode] ?? 0;
}

function wmoToWindClass(windSpeed: number): number {
  if (windSpeed < 20) return 1;
  if (windSpeed < 40) return 2;
  if (windSpeed < 60) return 3;
  return 4;
}

async function fetchIPMAHourly(): Promise<HourlyForecast[]> {
  try {
    const response = await fetch(
      `https://api.ipma.pt/open-data/forecast/meteorology/cities/hourly/${IPMA_CITY_ID}.json`
    );
    if (!response.ok) throw new Error("IPMA hourly unavailable");
    const data = await response.json();
    const entries: IPMAHourlyEntry[] = data.data || [];
    const now = new Date();

    return entries
      .filter((e) => new Date(e.dataPrev) > now)
      .slice(0, 12)
      .map((e) => ({
        datetime: e.dataPrev,
        hour: new Date(e.dataPrev).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
        temperature: Math.round(e.tMed),
        weatherCode: e.idWeatherType,
        precipitationProbability: Math.round(parseFloat(e.precipitaProb) || 0),
        windClass: e.classWindSpeed,
      }));
  } catch {
    return fetchOpenMeteoHourly();
  }
}

async function fetchOpenMeteoHourly(): Promise<HourlyForecast[]> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LOURINHA_LAT}&longitude=${LOURINHA_LON}&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m&timezone=Europe/Lisbon&forecast_days=1`
    );
    if (!response.ok) return [];
    const data = await response.json();

    const times: string[] = data.hourly?.time || [];
    const temps: number[] = data.hourly?.temperature_2m || [];
    const precip: number[] = data.hourly?.precipitation_probability || [];
    const codes: number[] = data.hourly?.weathercode || [];
    const winds: number[] = data.hourly?.windspeed_10m || [];

    const now = new Date();

    return times
      .map((t, i) => ({
        datetime: t,
        date: new Date(t),
        hour: new Date(t).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
        temperature: Math.round(temps[i]),
        weatherCode: wmoToIpmaCode(codes[i]),
        precipitationProbability: Math.round(precip[i] || 0),
        windClass: wmoToWindClass(winds[i] || 0),
      }))
      .filter((e) => e.date > now)
      .slice(0, 12)
      .map(({ date: _, ...rest }) => rest);
  } catch {
    return [];
  }
}

function buildAlerts(warnings: IPMAWarning[]): WeatherAlert[] {
  return warnings.map((w) => ({
    type: mapWarningType(w.awarenessTypeName),
    message: w.text || `Aviso ${w.awarenessTypeName} (${w.awarenessLevelID === "orange" ? "Laranja" : w.awarenessLevelID === "red" ? "Vermelho" : "Amarelo"})`,
    severity: mapWarningSeverity(w.awarenessLevelID),
  }));
}

async function fetchWeather(): Promise<WeatherData> {
  const [observation, forecast, warnings] = await Promise.all([
    fetchIPMAObservation(),
    fetchIPMAForecast(),
    fetchIPMAWarnings(),
  ]);

  const today = forecast.find(
    (d) => d.forecastDate === new Date().toISOString().split("T")[0]
  );

  const temperature = observation
    ? Math.round(observation.temperatura)
    : today
      ? Math.round((parseFloat(today.tMin) + parseFloat(today.tMax)) / 2)
      : 0;

  const weatherCode = today?.idWeatherType ?? 0;
  const windSpeed = observation ? observation.intensidadeVentoKM : 0;
  const humidity = observation ? observation.humidade : 0;
  const precipitation = observation ? observation.precAcumulada : 0;

  return {
    temperature,
    weatherCode,
    windSpeed,
    isDay: isCurrentlyDay(),
    precipitation,
    humidity,
    alerts: buildAlerts(warnings),
    source: "ipma",
  };
}

async function fetchDetailedWeather(): Promise<DetailedWeatherData> {
  const [observation, forecast, warnings, hourly] = await Promise.all([
    fetchIPMAObservation(),
    fetchIPMAForecast(),
    fetchIPMAWarnings(),
    fetchIPMAHourly(),
  ]);

  const todayStr = new Date().toISOString().split("T")[0];
  const today = forecast.find((d) => d.forecastDate === todayStr);

  const temperature = observation
    ? Math.round(observation.temperatura)
    : today
      ? Math.round((parseFloat(today.tMin) + parseFloat(today.tMax)) / 2)
      : 0;

  const weatherCode = today?.idWeatherType ?? 0;
  const windSpeed = observation ? observation.intensidadeVentoKM : 0;
  const humidity = observation ? observation.humidade : 0;
  const precipitation = observation ? observation.precAcumulada : 0;

  const daily: DailyForecast[] = forecast.map((d) => ({
    date: d.forecastDate,
    temperatureMax: Math.round(parseFloat(d.tMax)),
    temperatureMin: Math.round(parseFloat(d.tMin)),
    weatherCode: d.idWeatherType,
    precipitationProbability: parseFloat(d.precipitaProb),
    windClass: d.classWindSpeed,
    windDirection: d.predWindDir,
  }));

  const todayForecast = today
    ? {
        temperatureMin: Math.round(parseFloat(today.tMin)),
        temperatureMax: Math.round(parseFloat(today.tMax)),
        precipitationProbability: parseFloat(today.precipitaProb),
        windDirection: today.predWindDir,
        windClass: today.classWindSpeed,
      }
    : null;

  return {
    temperature,
    weatherCode,
    windSpeed,
    isDay: isCurrentlyDay(),
    precipitation,
    humidity,
    alerts: buildAlerts(warnings),
    source: "ipma",
    daily,
    hourly,
    todayForecast,
  };
}

export function useWeather() {
  return useQuery({
    queryKey: ["weather-ipma"],
    queryFn: fetchWeather,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
  });
}

export function useDetailedWeather() {
  return useQuery({
    queryKey: ["weather-ipma-detailed"],
    queryFn: fetchDetailedWeather,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
  });
}
