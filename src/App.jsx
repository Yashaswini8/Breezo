import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock,
  Droplets,
  Info,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  Thermometer,
  Wind,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AQI_LEVELS,
  POLLUTANT_META,
  PROFILES,
  aqiInfo,
  bestWorst,
  buildTips,
  climateRisk,
  loadAirData,
} from './utils'

const CARD =
  'rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] p-5'
const HEAD = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400'

const cx = (...a) => a.filter(Boolean).join(' ')

const fmtHour = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--'
  }
}
const fmtDay = (iso) => {
  try {
    return new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
const show = (v, unit) => (v === null || v === undefined ? '—' : `${v} ${unit}`)

function Skeleton({ className = '' }) {
  return <div className={cx('breezo-skeleton rounded-lg bg-slate-200', className)} />
}

function LoadingView() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-56 lg:col-span-2" />
        <Skeleton className="h-56" />
        <div className="grid grid-cols-2 gap-4 lg:col-span-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <p className="mt-6 text-center text-sm text-slate-400">Reading the air around you…</p>
    </main>
  )
}

function AqiCard({ data, info }) {
  const pct = Math.min(100, Math.max(0, (data.aqi / 300) * 100))
  return (
    <section className={cx(CARD, 'lg:col-span-2')}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={HEAD}>Current air quality index</h2>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: info.color, color: info.onColor }}
        >
          {info.label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
        <span
          className="text-7xl font-extrabold leading-none tracking-tight"
          style={{ color: info.color }}
        >
          {data.aqi}
        </span>
        <div className="pb-1">
          <p className="text-sm font-semibold text-[#0F172A]">US AQI right now</p>
          <p className="text-xs text-slate-500">
            {data.place.name}
            {data.place.country ? `, ${data.place.country}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative flex h-2.5 w-full gap-1">
          {AQI_LEVELS.map((l, i) => (
            <div
              key={l.label}
              className="h-full flex-1 rounded-full"
              style={{ background: l.color, opacity: i <= AQI_LEVELS.findIndex((x) => x.label === info.label) ? 1 : 0.22 }}
            />
          ))}
          <div
            className="absolute -top-1 h-4.5 w-1 rounded bg-[#0F172A]"
            style={{ left: `calc(${pct}% - 2px)` }}
            title={`AQI ${data.aqi}`}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400">
          <span>0</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
          <span>300+</span>
        </div>
      </div>

      <p className="mt-4 border-t border-[#E2E8F0] pt-4 text-sm leading-relaxed text-slate-600">
        {info.meaning}
      </p>
    </section>
  )
}

function ClimateCard({ risk, temperature, humidity }) {
  const tone = { Low: '#15803D', Medium: '#CA8A04', High: '#DC2626' }[risk.level]
  return (
    <section className={CARD}>
      <h2 className={HEAD}>Climate risk</h2>
      <div className="mt-4 flex items-center gap-2">
        <ShieldCheck size={18} style={{ color: tone }} />
        <span
          className="rounded-full px-3 py-1 text-sm font-bold"
          style={{ background: tone, color: '#FFFFFF' }}
        >
          {risk.level}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{risk.explain}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-4">
        <div className="rounded-lg border border-[#E2E8F0] p-3">
          <div className="flex items-center gap-1.5 text-[#0F172A]">
            <Thermometer size={14} className="text-navy" />
            <span className="text-sm font-semibold">{show(temperature, '°C')}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Temperature</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] p-3">
          <div className="flex items-center gap-1.5 text-[#0F172A]">
            <Droplets size={14} className="text-navy" />
            <span className="text-sm font-semibold">{show(humidity, '%')}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Humidity</p>
        </div>
      </div>
    </section>
  )
}

function PollutantCard({ label, unit, note, value }) {
  return (
    <div className={CARD}>
      <div className="flex items-center gap-2">
        <Wind size={14} className="text-navy" />
        <h3 className={HEAD}>{label}</h3>
      </div>
      <p className="mt-3 text-2xl font-bold text-[#0F172A]">
        {value === null || value === undefined ? '—' : value}
        <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{note}</p>
    </div>
  )
}

function ForecastCard({ hourly, best, worst, info }) {
  const chart = useMemo(
    () =>
      hourly.slice(0, 72).map((p) => ({
        label: fmtHour(p.time),
        aqi: p.aqi,
        day: fmtDay(p.time),
      })),
    [hourly],
  )
  const maxY = Math.max(60, ...chart.map((c) => c.aqi)) + 20

  return (
    <section className={cx(CARD, 'lg:col-span-2')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={HEAD}>72-hour AQI forecast</h2>
        <span className="text-xs text-slate-500">{chart.length} hourly readings</span>
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart} margin={{ top: 12, right: 12, bottom: 4, left: -18 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748B' }}
              interval={5}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              domain={[0, maxY]}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(_, payload) => (payload?.length ? payload[0].payload.day : '')}
              formatter={(v) => [`AQI ${v}`, '']}
              contentStyle={{
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                fontSize: 12,
                color: '#0F172A',
              }}
            />
            <ReferenceLine
              y={50}
              stroke="#15803D"
              strokeDasharray="4 4"
              label={{ value: 'AQI 50', position: 'insideTopRight', fontSize: 10, fill: '#15803D' }}
            />
            <Line
              type="monotone"
              dataKey="aqi"
              stroke={info.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: info.color }}
            />
            {best && (
              <ReferenceDot
                x={fmtHour(best.time)}
                y={best.aqi}
                r={5}
                fill="#1E3A8A"
                stroke="#FFFFFF"
                strokeWidth={2}
                label={{ value: 'Best', position: 'top', fontSize: 10, fill: '#1E3A8A', fontWeight: 700 }}
              />
            )}
            {worst && (
              <ReferenceDot
                x={fmtHour(worst.time)}
                y={worst.aqi}
                r={5}
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth={2}
                label={{ value: 'Worst', position: 'top', fontSize: 10, fill: '#DC2626', fontWeight: 700 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E2E8F0] pt-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E2E8F0] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
            <CalendarDays size={13} /> Best hour to go out
          </p>
          <p className="mt-1.5 text-sm font-bold text-[#0F172A]">
            {best ? fmtHour(best.time) : '—'}
            <span className="ml-1.5 font-medium text-slate-500">AQI {best?.aqi ?? '—'}</span>
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
            <AlertTriangle size={13} /> Worst hour to go out
          </p>
          <p className="mt-1.5 text-sm font-bold text-[#0F172A]">
            {worst ? fmtHour(worst.time) : '—'}
            <span className="ml-1.5 font-medium text-slate-500">AQI {worst?.aqi ?? '—'}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

const TIP_ICON = { mask: Wind, activity: Activity, windows: Leaf, clock: Clock }

function TipsCard({ aqi, profile, setProfile, best }) {
  const tips = useMemo(() => buildTips(aqi, profile, best), [aqi, profile, best])
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={HEAD}>Personalised tips</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="profile" className="text-xs font-medium text-slate-500">
            Profile
          </label>
          <select
            id="profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#0F172A] outline-none focus:border-navy"
          >
            {PROFILES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {tips.map((t) => {
          const Icon = TIP_ICON[t.icon] || Info
          return (
            <li key={t.title} className="rounded-lg border border-[#E2E8F0] p-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy">
                <Icon size={13} />
                {t.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t.text}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function AlertBanner({ data, info }) {
  return (
    <div
      className="rounded-xl px-4 py-3 sm:px-5"
      style={{ background: '#DC2626', color: '#FFFFFF' }}
      role="alert"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <AlertTriangle size={20} className="shrink-0" />
        <p className="text-sm font-bold uppercase tracking-wide">
          Air quality alert — {info.label} in {data.place.name}
        </p>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#DC2626]">
          AQI {data.aqi}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed">
        AQI above 150. Avoid outdoor exercise, keep windows closed, wear an N95 mask outdoors and
        move all physical activity indoors. Children, elderly people and anyone with asthma should
        stay in filtered indoor air.
      </p>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState('General')

  const fetchCity = useCallback(async (city) => {
    setLoading(true)
    setError('')
    try {
      const d = await loadAirData(city)
      setData(d)
    } catch (e) {
      setData(null)
      setError(
        e?.code === 'CITY_NOT_FOUND'
          ? `We could not find “${city}”. Try a nearby major city like Chennai, Delhi or London.`
          : 'Something went wrong while loading air data. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCity('Chennai')
  }, [fetchCity])

  const onSearch = (e) => {
    e.preventDefault()
    const city = query.trim()
    if (city) fetchCity(city)
  }

  const info = useMemo(() => aqiInfo(data?.aqi), [data])
  const { best, worst } = useMemo(() => bestWorst(data?.hourly || []), [data])
  const risk = useMemo(
    () => climateRisk(data?.aqi, data?.temperature, data?.humidity),
    [data],
  )
  const alertOn = data && data.aqi > 150

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Leaf size={24} className="text-navy" />
            <div>
              <h1 className="text-lg font-extrabold leading-tight tracking-tight text-[#0F172A]">
                Breezo
              </h1>
              <p className="text-[11px] leading-tight text-slate-500">
                Breathe easy. Know your air.
              </p>
            </div>
          </div>

          <form onSubmit={onSearch} className="flex w-full max-w-sm items-center gap-2 sm:w-auto">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a city…"
                aria-label="Search a city"
                className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-sm text-[#0F172A] outline-none placeholder:text-slate-400 focus:border-navy"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1B3370] disabled:opacity-50"
            >
              {loading ? '…' : 'Search'}
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {error ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <AlertTriangle size={28} className="mx-auto text-[#DC2626]" />
            <h2 className="mt-3 text-lg font-bold text-[#0F172A]">City not available</h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">{error}</p>
            <button
              onClick={() => {
                setQuery('')
                fetchCity('Chennai')
              }}
              className="mt-5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B3370]"
            >
              Back to Chennai
            </button>
          </div>
        ) : loading && !data ? (
          <LoadingView />
        ) : data ? (
          <div className="space-y-4">
            {alertOn && <AlertBanner data={data} info={info} />}

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <MapPin size={15} className="text-navy" />
              <span className="font-semibold text-[#0F172A]">
                {data.place.name}
                {data.place.country ? `, ${data.place.country}` : ''}
              </span>
              <span>·</span>
              <span>{data.latitude ? data.latitude.toFixed(2) : ''}</span>
              {data.isMock && (
                <span className="rounded-full border border-[#E2E8F0] bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Demo data
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <AqiCard data={data} info={info} />
              <ClimateCard risk={risk} temperature={data.temperature} humidity={data.humidity} />
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {POLLUTANT_META.map((p) => (
                <PollutantCard
                  key={p.key}
                  label={p.label}
                  unit={p.unit}
                  note={p.note}
                  value={data.pollutants[p.key]}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ForecastCard hourly={data.hourly} best={best} worst={worst} info={info} />
              <TipsCard aqi={data.aqi} profile={profile} setProfile={setProfile} best={best} />
            </div>

            <p className="flex items-start gap-2 pt-2 text-xs leading-relaxed text-slate-400">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                Breezo uses the free Open-Meteo air quality and weather models. Values are modelled
                estimates, not official station readings. Tips are generated by simple rules — no AI
                and no personal data leaves your browser.
              </span>
            </p>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-slate-400 sm:px-6">
          Breezo — Breathe easy. Know your air. · Clean Air &amp; Climate Resilience track.
        </div>
      </footer>
    </div>
  )
}
