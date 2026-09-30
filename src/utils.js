// Breezo — all data + rule-based logic. No API keys, no AI services.

const GEO = (city, count = 1) =>
  `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=${count}`

export const SEARCH_COUNT = 5

/** Common nickname / old-name inputs mapped to the name the API knows. */
const CITY_ALIASES = {
  bangalore: 'Bengaluru',
  'bangalore city': 'Bengaluru',
  'bangalore urban district': 'Bengaluru',
  blr: 'Bengaluru',
  bombay: 'Mumbai',
  madras: 'Chennai',
  calcutta: 'Kolkata',
  'new york city': 'New York',
  nyc: 'New York',
  'san francisco bay area': 'San Francisco',
  'delhi ncr': 'Delhi',
}

export const normaliseQuery = (q) => {
  const t = (q || '').trim()
  return CITY_ALIASES[t.toLowerCase()] || t
}

const toPlace = (r, i = 0) => ({
  id: `${i}-${r.latitude},${r.longitude}`,
  name: r.name,
  state: r.admin1 ?? r.admin2 ?? '',
  country: r.country ?? '',
  latitude: r.latitude,
  longitude: r.longitude,
})

/** Stable sort that keeps the API's relevance order but floats India to the top. */
const indiaFirst = (a, b) => {
  const ia = a.country === 'India' ? 0 : 1
  const ib = b.country === 'India' ? 0 : 1
  return ia - ib
}

/** Up to 5 matching places, India first. Never throws. */
export async function searchCities(query) {
  const q = normaliseQuery(query)
  if (q.length < 2) return []
  try {
    const g = await fetch(GEO(q, SEARCH_COUNT))
    if (!g.ok) return []
    const gj = await g.json()
    const list = (gj?.results || []).map(toPlace)
    return list.sort(indiaFirst).slice(0, SEARCH_COUNT)
  } catch {
    return []
  }
}

const AIR = (lat, lon) =>
  `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
  `&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&hourly=us_aqi&forecast_days=3&timezone=auto`

const WX = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
  `&current=temperature_2m,relative_humidity_2m&timezone=auto`

export const AQI_LEVELS = [
  {
    max: 50,
    label: 'Good',
    color: '#15803D',
    onColor: '#FFFFFF',
    meaning: 'Air quality is clean. Everyone can breathe normally and exercise outdoors.',
  },
  {
    max: 100,
    label: 'Moderate',
    color: '#CA8A04',
    onColor: '#1F2937',
    meaning: 'Acceptable, but unusually sensitive people may feel mild discomfort.',
  },
  {
    max: 150,
    label: 'Unhealthy for Sensitive Groups',
    color: '#EA580C',
    onColor: '#FFFFFF',
    meaning: 'Sensitive groups should limit long or heavy outdoor exertion.',
  },
  {
    max: 200,
    label: 'Unhealthy',
    color: '#DC2626',
    onColor: '#FFFFFF',
    meaning: 'Everyone may feel effects. Keep outdoor activity short and light.',
  },
  {
    max: 300,
    label: 'Very Unhealthy',
    color: '#7E22CE',
    onColor: '#FFFFFF',
    meaning: 'Health alert. Avoid outdoor exertion and keep windows closed.',
  },
  {
    max: Infinity,
    label: 'Hazardous',
    color: '#7F1D1D',
    onColor: '#FFFFFF',
    meaning: 'Emergency conditions. Stay indoors with filtered air.',
  },
]

export function aqiInfo(aqi) {
  const n = Number.isFinite(aqi) ? aqi : 0
  return AQI_LEVELS.find((l) => n <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1]
}

const round = (v, d = 0) =>
  v === null || v === undefined || Number.isNaN(v) ? null : Math.round(v * 10 ** d) / 10 ** d

const FALLBACK_PLACES = {
  chennai: { name: 'Chennai', country: 'India', latitude: 13.0827, longitude: 80.2707 },
  delhi: { name: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
  mumbai: { name: 'Mumbai', country: 'India', latitude: 19.076, longitude: 72.8777 },
  bengaluru: { name: 'Bengaluru', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  london: { name: 'London', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276 },
  'new york': { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006 },
  singapore: { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  dubai: { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708 },
  paris: { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  beijing: { name: 'Beijing', country: 'China', latitude: 39.9042, longitude: 116.4074 },
  lahore: { name: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587 },
  dhaka: { name: 'Dhaka', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125 },
  lagos: { name: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 },
  jakarta: { name: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456 },
  'kuala lumpur': { name: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.139, longitude: 101.6869 },
  sydney: { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
  toronto: { name: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832 },
  berlin: { name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405 },
  amsterdam: { name: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041 },
  seoul: { name: 'Seoul', country: 'South Korea', latitude: 37.5665, longitude: 126.978 },
  'mexico city': { name: 'Mexico City', country: 'Mexico', latitude: 19.4326, longitude: -99.1332 },
  'sao paulo': { name: 'Sao Paulo', country: 'Brazil', latitude: -23.5505, longitude: -46.6333 },
  cairo: { name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357 },
  manila: { name: 'Manila', country: 'Philippines', latitude: 14.5995, longitude: 120.9842 },
  athens: { name: 'Athens', country: 'Greece', latitude: 37.9838, longitude: 23.7275 },
  lisbon: { name: 'Lisbon', country: 'Portugal', latitude: 38.7223, longitude: -9.1393 },
  oslo: { name: 'Oslo', country: 'Norway', latitude: 59.9139, longitude: 10.7522 },
}

function localPlace(city) {
  return FALLBACK_PLACES[(city || '').trim().toLowerCase()] || null
}

/** Deterministic pseudo-random in [0,1) so mock data is stable per place. */
function seeded(seedStr) {
  let h = 2166136261
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 100000) / 100000
  }
}

function buildMock(city) {
  const place = localPlace(city) || {
    name: (city || 'Chennai').trim(),
    country: 'Unknown',
    latitude: 13.08,
    longitude: 80.27,
  }
  const rnd = seeded(`${place.name}-${Math.round(place.latitude)}`)
  const hot = Math.abs(place.latitude) < 35
  const base = 28 + Math.floor(rnd() * 130)
  const now = new Date()
  now.setMinutes(0, 0, 0)

  const hourly = []
  for (let i = 0; i < 72; i++) {
    const d = new Date(now.getTime() + i * 3600 * 1000)
    const hour = d.getHours()
    // Morning and evening rush-hour bumps, midday dip.
    const rush = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20) ? 22 : 0
    const drift = Math.sin(((hour - 6) / 24) * Math.PI * 2) * 10
    const aqi = Math.max(6, Math.round(base + rush + drift + (rnd() - 0.5) * 14))
    hourly.push({ time: d.toISOString(), aqi })
  }

  const nowAqi = hourly[0].aqi
  const scale = nowAqi / 60
  return {
    place,
    isMock: true,
    aqi: nowAqi,
    pollutants: {
      pm25: round(Math.max(2, (nowAqi * 0.42) * scale * 0.5 + (hot ? 12 : 4))),
      pm10: round(Math.max(3, (nowAqi * 0.85) * scale * 0.5 + (hot ? 18 : 8))),
      no2: round(Math.max(2, (nowAqi * 0.3) * scale * 0.5 + 8)),
      o3: round(Math.max(3, (nowAqi * 0.35) * scale * 0.5 + 18)),
    },
    temperature: hot ? round(30 + rnd() * 7) : round(4 + rnd() * 18),
    humidity: Math.round(45 + rnd() * 35),
    hourly,
  }
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export async function loadAirData(target) {
  let place = null

  if (target && typeof target === 'object') {
    // Already resolved by the suggestion dropdown — skip geocoding.
    place = toPlace(target)
  } else {
    const clean = normaliseQuery(target) || 'Chennai'
    try {
      const g = await fetch(GEO(clean))
      if (!g.ok) throw new Error('geocoding ' + g.status)
      const gj = await g.json()
      const r = gj?.results?.[0]
      if (!r) {
        const err = new Error('city-not-found')
        err.code = 'CITY_NOT_FOUND'
        throw err
      }
      place = toPlace(r)
    } catch (e) {
      if (e.code === 'CITY_NOT_FOUND') throw e
      place = localPlace(clean)
      if (!place) return buildMock(clean)
    }
  }

  const cityLabel = place?.name || 'Chennai'

  const [airRes, wxRes] = await Promise.allSettled([fetch(AIR(place.latitude, place.longitude)), fetch(WX(place.latitude, place.longitude))])

  const air = airRes.status === 'fulfilled' && airRes.value.ok ? await airRes.value.json() : null
  const wx = wxRes.status === 'fulfilled' && wxRes.value.ok ? await wxRes.value.json() : null

  if (!air?.current || !Array.isArray(air?.hourly?.time)) return buildMock(cityLabel)

  const c = air.current
  const times = air.hourly.time
  const vals = air.hourly.us_aqi
  const hourly = times.map((t, i) => ({ time: t, aqi: num(vals?.[i]) })).filter((p) => p.aqi !== null)
  if (!hourly.length) return buildMock(cityLabel)

  const nowIso = c.time ? String(c.time) : times[0]
  const current = hourly.find((p) => p.time === nowIso) || hourly[0]
  const aqi = current.aqi

  return {
    place,
    isMock: false,
    aqi: Math.round(aqi),
    pollutants: {
      pm25: num(c.pm2_5),
      pm10: num(c.pm10),
      no2: num(c.nitrogen_dioxide),
      o3: num(c.ozone),
    },
    temperature: num(wx?.current?.temperature_2m),
    humidity: num(wx?.current?.relative_humidity_2m),
    hourly,
  }
}

/** Best (lowest AQI) and worst (highest AQI) hour within the next 24h. */
export function bestWorst(hourly) {
  if (!hourly?.length) return { best: null, worst: null }
  const next24 = hourly.slice(0, 24)
  let best = next24[0]
  let worst = next24[0]
  for (const p of next24) {
    if (p.aqi < best.aqi) best = p
    if (p.aqi > worst.aqi) worst = p
  }
  return { best, worst }
}

const hourLabel = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export const PROFILES = ['General', 'Child', 'Elderly', 'Asthma', 'Athlete']

/** Rule-based, deterministic. Exactly four tips per (profile, AQI band). */
export function buildTips(aqi, profile, best) {
  const band =
    aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : aqi <= 150 ? 'sensitive' : aqi <= 200 ? 'unhealthy' : 'severe'
  const bestText = best ? `around ${hourLabel(best.time)}` : 'during the cleanest hours of the day'

  const mask = {
    good: 'No mask needed — enjoy the clean air.',
    moderate: 'A light cloth or surgical mask is optional for long runs.',
    sensitive: 'Wear a good N95/FFP2 mask if you will be out for more than an hour.',
    unhealthy: 'Wear an N95/FFP2 mask whenever you step outside.',
    severe: 'Wear a well-fitted N95/FFP2 mask and limit time outdoors to essentials only.',
  }[band]

  const windows = {
    good: 'Good time to open windows and let fresh air circulate the house.',
    moderate: 'Open windows briefly in the morning, then close them when traffic peaks.',
    sensitive: 'Keep windows shut during rush hour; ventilate early morning instead.',
    unhealthy: 'Keep windows and doors closed. Use a filtered or fan-based cooler, not open windows.',
    severe: 'Keep everything sealed. Run an air purifier if you have one, and avoid fan-only ventilation.',
  }[band]

  const exerciseBase = {
    good: 'Exercise outdoors is fine — ideal conditions for a run or cycle.',
    moderate: 'Outdoor exercise is fine for most people; sensitive types should ease off.',
    sensitive: 'Prefer indoor or early-morning outdoor exercise. Skip hard outdoor sessions.',
    unhealthy: 'Skip outdoor exercise today. Move indoors or use a filtered gym.',
    severe: 'No outdoor exercise. Any activity should be indoors and gentle.',
  }[band]

  const profileTip = {
    General: {
      good: 'Plan errands and cycling in daylight — pollution is at its lowest right now.',
      moderate: 'Time heavy traffic-side errands for the middle of the day when levels dip.',
      sensitive: 'Keep outdoor plans short and carry water — dry, polluted air irritates airways.',
      unhealthy: 'Cancel outdoor plans that can wait and check on elderly neighbours.',
      severe: 'Stay home, keep medication handy, and check local advisories today.',
    },
    Child: {
      good: 'Outdoor play is safe today. Choose parks and gardens away from main roads.',
      moderate: 'Keep play sessions under an hour and avoid the school run at peak traffic hours.',
      sensitive: 'Bring children indoors during peaks. No running games at the roadside.',
      unhealthy: 'No outdoor play. Move homework, study and meals indoors with windows shut.',
      severe: 'Keep children fully indoors. Do not let them cycle or play in the open today.',
    },
    Elderly: {
      good: 'A gentle morning walk is safe. Keep water handy in the heat.',
      moderate: 'Walk early before 9am. Stop if you feel any chest tightness.',
      sensitive: 'Avoid the morning window entirely; take a short walk after 6pm instead.',
      unhealthy: 'Skip the walk today. Keep regular medication timings unchanged.',
      severe: 'Remain indoors, avoid exertion, and call a doctor for any breathing discomfort.',
    },
    Asthma: {
      good: 'Your usual medicines should be enough today. Still carry your reliever inhaler.',
      moderate: 'Take preventer medicine on schedule and keep the reliever inhaler in your pocket.',
      sensitive: 'Pre-use your reliever before going out and avoid busy roads. Carry it always.',
      unhealthy: 'Use your preventer as prescribed plus the reliever as needed. No outdoor exertion.',
      severe: 'Stay indoors with the reliever inhaler in hand. Seek help if symptoms persist.',
    },
    Athlete: {
      good: 'Ideal training day. Go hard outdoors if you like — conditions are on your side.',
      moderate: 'Good for steady outdoor training. Skip high-intensity intervals near traffic.',
      sensitive: 'Move the session indoors or to the early window, best near ' + bestText + '.',
      unhealthy: 'Skip outdoor training. Do strength or recovery work indoors instead.',
      severe: 'Total rest from outdoor training today. Recover indoors with good ventilation control.',
    },
  }[profile] || {}

  return [
    { icon: 'mask', title: 'Mask', text: mask },
    { icon: 'activity', title: 'Exercise', text: profileTip[band] || exerciseBase },
    { icon: 'windows', title: 'Windows', text: windows },
    { icon: 'clock', title: 'Best time outdoors', text: `Cleanest window in the next 24h is ${bestText} (AQI ${best ? best.aqi : '—'}).` },
  ].filter((t) => t.text)
}

export function climateRisk(aqi, temperature, humidity) {
  let points = 0
  const notes = []

  if (aqi > 150) {
    points += 2
    notes.push('severe AQI')
  } else if (aqi > 100) {
    points += 1
    notes.push('elevated AQI')
  }

  if (temperature !== null && temperature !== undefined) {
    if (temperature >= 35) {
      points += 1
      notes.push('heat stress')
    } else if (temperature <= 12) {
      points += 1
      notes.push('cold exposure')
    }
  }

  if (humidity !== null && humidity !== undefined && (humidity >= 80 || humidity <= 30)) {
    points += 1
    notes.push(humidity >= 80 ? 'heavy humidity' : 'dry air')
  }

  const level = points >= 3 ? 'High' : points >= 1 ? 'Medium' : 'Low'
  const explain = {
    Low: 'Comfortable conditions — no immediate air or heat related risk.',
    Medium: `Moderate risk from ${notes.join(' and ') || 'borderline readings'} — take normal precautions.`,
    High: `High risk driven by ${notes.join(' and ') || 'unsettled conditions'} — limit exposure and stay alert.`,
  }[level]

  return { level, explain }
}

export const POLLUTANT_META = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', note: 'Fine particles, deepest lung impact' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', note: 'Coarse dust and pollen' },
  { key: 'no2', label: 'NO2', unit: 'µg/m³', note: 'Traffic and combustion marker' },
  { key: 'o3', label: 'O3', unit: 'µg/m³', note: 'Ground-level ozone, midday peak' },
]
