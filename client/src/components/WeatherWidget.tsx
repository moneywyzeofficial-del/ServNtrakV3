import { useWeather, getWeatherInfo } from "@/hooks/use-weather";
import { useLocation } from "wouter";
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Snowflake,
  Wind,
  Droplets,
  AlertTriangle,
  Moon,
  CloudMoon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, typeof Sun> = {
  sun: Sun,
  cloud: Cloud,
  "cloud-sun": CloudSun,
  "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-lightning": CloudLightning,
  "cloud-fog": CloudFog,
  snowflake: Snowflake,
};

const nightIconMap: Record<string, typeof Moon> = {
  sun: Moon,
  "cloud-sun": CloudMoon,
  cloud: Cloud,
  "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-lightning": CloudLightning,
  "cloud-fog": CloudFog,
  snowflake: Snowflake,
};

interface WeatherWidgetProps {
  className?: string;
  showAlerts?: boolean;
}

export function WeatherWidget({
  className,
  showAlerts = true,
}: WeatherWidgetProps) {
  const { data: weather, isLoading, error } = useWeather();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20",
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 animate-pulse" />
          <div className="space-y-2">
            <div className="w-16 h-6 bg-white/20 rounded animate-pulse" />
            <div className="w-24 h-4 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return null;
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weather.isDay
    ? iconMap[weatherInfo.icon] || Cloud
    : nightIconMap[weatherInfo.icon] || Moon;

  const isRainy = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 21].includes(weather.weatherCode);
  const isStormy = [19, 20, 23].includes(weather.weatherCode);
  const isClear = weather.weatherCode === 1;

  const iconBgClass = weather.isDay
    ? isClear
      ? "bg-gradient-to-br from-primary/30 to-primary/20"
      : isRainy
        ? "bg-gradient-to-br from-blue-400/30 to-blue-600/20"
        : isStormy
          ? "bg-gradient-to-br from-purple-400/30 to-gray-600/20"
          : "bg-gradient-to-br from-gray-300/30 to-gray-400/20"
    : "bg-gradient-to-br from-indigo-500/30 to-purple-600/20";

  const iconColorClass = weather.isDay
    ? isClear
      ? "text-primary"
      : isRainy
        ? "text-blue-300"
        : isStormy
          ? "text-purple-300"
          : "text-white"
    : "text-indigo-200";

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 cursor-pointer active:scale-[0.98] transition-transform"
        data-testid="weather-current"
        onClick={() => setLocation("/weather")}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              iconBgClass
            )}
          >
            <WeatherIcon className={cn("w-8 h-8", iconColorClass)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {weather.temperature}°
              </span>
              <span className="text-sm text-white/60">C</span>
            </div>
            <p className="text-sm text-white/80 mt-0.5 capitalize">
              {weatherInfo.description}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 items-end">
            {weather.windSpeed >= 10 && (
              <div
                className="flex items-center gap-1.5 text-white/70"
                data-testid="weather-wind"
              >
                <Wind className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {Math.round(weather.windSpeed)} km/h
                </span>
              </div>
            )}
            {weather.precipitation > 0 && (
              <div
                className="flex items-center gap-1.5 text-white/70"
                data-testid="weather-rain"
              >
                <Droplets className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {weather.precipitation} mm
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-white/50 text-center mt-3">
          Fonte: IPMA (Clique para ver previsão completa)
        </p>
      </div>

      {showAlerts && weather.alerts.length > 0 && (
        <div className="space-y-2" data-testid="weather-alerts">
          {weather.alerts.map((alert, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium backdrop-blur-md",
                alert.severity === "danger"
                  ? "bg-red-500/20 text-red-100 border border-red-400/30"
                  : "bg-destructive/30 text-destructive-foreground border border-destructive/40"
              )}
              data-testid={`weather-alert-${alert.type}`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WeatherWidgetCompact({ className }: { className?: string }) {
  const { data: weather, isLoading } = useWeather();

  if (isLoading || !weather) {
    return null;
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weather.isDay
    ? iconMap[weatherInfo.icon] || Cloud
    : nightIconMap[weatherInfo.icon] || Moon;

  const hasAlert = weather.alerts.length > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-white/90",
        hasAlert && "text-destructive-foreground",
        className
      )}
      data-testid="weather-compact"
    >
      <WeatherIcon className="w-4 h-4" />
      <span className="text-sm font-medium">{weather.temperature}°</span>
      {hasAlert && <AlertTriangle className="w-3 h-3 text-destructive-foreground" />}
    </div>
  );
}
