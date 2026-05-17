/**
 * Unified Pricing Engine for GoTurf
 * Factors: Peak Hours, Weekend Surge, Demand-Based Surge, Weather, and Smart Timing
 */
export const calculateDynamicPrice = (turf, startTime, duration, date, bookedSlotCount = 0, totalSlots = 18, weather = 'Clear') => {
  const now = new Date();
  const bookingDate = new Date(date);
  const hour = parseInt(startTime.split(':')[0]);
  
  // 1. Peak hour multiplier
  const peakStart = parseInt(turf.peak_hours?.start?.split(':')[0] || "18");
  const peakEnd = parseInt(turf.peak_hours?.end?.split(':')[0] || "22");
  const isPeak = hour >= peakStart && hour < peakEnd;
  const peakMultiplier = isPeak ? (turf.peak_hour_multiplier || 1.3) : 1.0;

  // 2. Weekend surge
  const dayOfWeek = bookingDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendMultiplier = isWeekend ? 1.2 : 1.0;

  // 3. Demand-based pricing
  const occupancyRate = totalSlots > 0 ? bookedSlotCount / totalSlots : 0;
  let demandMultiplier = 1.0;
  if (occupancyRate >= 0.8) demandMultiplier = 1.3;
  else if (occupancyRate >= 0.5) demandMultiplier = 1.15;

  // 4. Weather-based pricing
  let weatherMultiplier = 1.0;
  const wm = turf.weather_multiplier || { sunny: 1.2, cloudy: 1.0, rainy: 0.8 };
  
  if (weather === 'Rain' || weather === 'Drizzle' || weather === 'Thunderstorm') {
    weatherMultiplier = wm.rainy || 0.8;
  } else if (weather === 'Clouds') {
    weatherMultiplier = wm.cloudy || 1.0;
  } else if (weather === 'Clear') {
    weatherMultiplier = wm.sunny || 1.2;
  }

  // 5. Smart Discount System (Booking Timing)
  const diffTime = bookingDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let timingMultiplier = 1.0;
  
  if (diffDays >= 7) timingMultiplier = 0.9; // Early booking
  else if (diffDays <= 0 && hour > now.getHours() + 2) timingMultiplier = 1.15; // Last-minute

  // 6. Early bird discount (6AM–10AM)
  const isEarlyBird = hour >= 6 && hour < 10;
  const earlyBirdMultiplier = isEarlyBird && !isPeak ? 0.85 : 1.0;

  const basePrice = (turf.price_per_hour || turf.pricePerHour || 1000) * duration;
  const combinedMultiplier = peakMultiplier * weekendMultiplier * demandMultiplier * weatherMultiplier * timingMultiplier * earlyBirdMultiplier;
  const finalPrice = Math.round(basePrice * combinedMultiplier);

  return {
    basePrice: turf.price_per_hour || turf.pricePerHour,
    totalBase: basePrice,
    peakMultiplier: Math.round(peakMultiplier * 100) / 100,
    weekendMultiplier: Math.round(weekendMultiplier * 100) / 100,
    demandMultiplier: Math.round(demandMultiplier * 100) / 100,
    weatherMultiplier: Math.round(weatherMultiplier * 100) / 100,
    timingMultiplier: Math.round(timingMultiplier * 100) / 100,
    earlyBirdMultiplier: Math.round(earlyBirdMultiplier * 100) / 100,
    combinedMultiplier: Math.round(combinedMultiplier * 100) / 100,
    finalPrice,
    isPeak,
    isWeekend,
    isEarlyBird,
    weatherCondition: weather,
    occupancyRate: Math.round(occupancyRate * 100),
  };
};

export const fetchWeather = async (lat, lng) => {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey || !lat || !lng) return 'Clear';
  
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`);
    const data = await res.json();
    return data.weather?.[0]?.main || "Clear";
  } catch (err) {
    console.warn('Weather fetch failed:', err.message);
    return 'Clear';
  }
};
