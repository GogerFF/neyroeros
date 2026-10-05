import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { getTrafficStats, type RangeDays } from "@/lib/traffic";

export const dynamic = "force-dynamic";

type PagePropsAdmin = { searchParams: Promise<{ days?: string }> };

const CHANNEL_RU: Record<string, string> = {
  direct: "Прямой заход",
  search: "Поисковики",
  social: "Соцсети",
  referral: "Ссылки с сайтов",
  email: "Почта",
  video: "Видеохостинги",
  stock: "Стоковые сайты",
  internal: "Внутренние переходы",
  unknown: "Не распознан",
};

const DEVICE_RU: Record<string, string> = {
  desktop: "Компьютер",
  mobile: "Телефон",
  tablet: "Планшет",
  bot: "Бот",
  other: "Прочее",
};

const KIND_RU: Record<string, string> = {
  "Главная": "Главная",
  "Работа": "Страницы работ",
  "Категории": "Категории",
  "Теги": "Теги",
  "Коллекции": "Коллекции",
  "Истории": "Истории",
  "Видео": "Видео",
  "Авторы": "Авторы",
  "Кабинет": "Кабинет",
  "Админка": "Админка",
  "Вход": "Вход и регистрация",
  "Прочее": "Прочее",
};

/** Horizontal bars: the label list is long and a chart lib would be overkill. */
function Bars({ title, rows, total, translate }: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  total: number;
  translate?: (k: string) => string;
}) {
  if (!rows.length) return <div className="analytics-card"><h3>{title}</h3><p className="analytics-empty">Пока нет данных.</p></div>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return <div className="analytics-card">
    <h3>{title}</h3>
    <ul className="analytics-bars">
      {rows.map((r) => {
        const label = translate ? (translate(r.label) ?? r.label) : r.label;
        const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
        return <li key={r.label}>
          <span className="analytics-bar-label" title={label}>{label}</span>
          <span className="analytics-bar-track">
            <span className="analytics-bar-fill" style={{ width: `${Math.max(2, Math.round((r.value / max) * 100))}%` }} />
          </span>
          <span className="analytics-bar-value">{r.value.toLocaleString("ru-RU")} <em>{pct}%</em></span>
        </li>;
      })}
    </ul>
  </div>;
}

function Delta({ delta }: { delta: number | null }) {
  if (delta === null) return <em className="analytics-delta neutral">— нет базы для сравнения</em>;
  const up = delta >= 0;
  return <em className={`analytics-delta ${up ? "up" : "down"}`}>{up ? "▲" : "▼"} {Math.abs(delta)}% к прошлому периоду</em>;
}

function Sparkline({ series }: { series: Array<{ day: string; views: number; uniques: number }> }) {
  if (!series.length) return <p className="analytics-empty">Пока нет данных.</p>;
  const max = Math.max(...series.map((s) => s.views), 1);
  return <div className="analytics-spark">
    {series.map((s) => <div key={s.day} className="analytics-spark-col" title={`${s.day}: ${s.views} просмотров, ${s.uniques} уникальных`}>
      <span className="analytics-spark-bar" style={{ height: `${Math.max(3, Math.round((s.views / max) * 100))}%` }} />
      <span className="analytics-spark-label">{s.day.slice(8)}</span>
    </div>)}
  </div>;
}

export default async function TrafficAnalytics({ searchParams }: PagePropsAdmin) {
  await requireAdmin();
  const sp = await searchParams;
  const days: RangeDays = sp.days === "7" ? 7 : sp.days === "90" ? 90 : 30;
  const s = await getTrafficStats(days);

  return <section className="section analytics">
    <span className="eyebrow">Аналитика</span>
    <h1>Посещаемость</h1>
    <p className="analytics-note">
      Данные собираются на сервере по заголовкам запроса: источник перехода, устройство, браузер, ОС и страна.
      IP-адреса не сохраняются — посетитель определяется по анонимному хешу, как и в счётчике просмотров.
      Боты считаются отдельно и исключены из основных цифр.
    </p>

    <div className="analytics-ranges">
      {[7, 30, 90].map((d) => <Link key={d} className={`ghost ${days === d ? "is-active" : ""}`} href={`/admin/analytics?days=${d}`}>{d} дней</Link>)}
      <Link className="ghost" href="/admin">← Панель куратора</Link>
    </div>

    <div className="analytics-cards">
      <div className="analytics-card stat">
        <span className="stat-label">Просмотры</span>
        <strong className="stat-value">{s.totalViews.toLocaleString("ru-RU")}</strong>
        <Delta delta={s.delta} />
      </div>
      <div className="analytics-card stat">
        <span className="stat-label">Уникальные посетители</span>
        <strong className="stat-value">{s.uniqueVisitors.toLocaleString("ru-RU")}</strong>
        <em className="analytics-delta neutral">за {days} дней</em>
      </div>
      <div className="analytics-card stat">
        <span className="stat-label">Новые и вернувшиеся</span>
        <strong className="stat-value">{s.newViewers.toLocaleString("ru-RU")} <small>/ {s.returningViewers.toLocaleString("ru-RU")}</small></strong>
        <em className="analytics-delta neutral">посетителей: новые / вернувшиеся</em>
      </div>
      <div className="analytics-card stat">
        <span className="stat-label">Боты</span>
        <strong className="stat-value">{s.botViews.toLocaleString("ru-RU")}</strong>
        <em className="analytics-delta neutral">краулеры и проверки</em>
      </div>
    </div>

    <div className="analytics-card">
      <h3>Просмотры по дням</h3>
      <Sparkline series={s.series} />
    </div>

    <div className="analytics-grid">
      <Bars title="Откуда пришли" rows={s.bySource} total={s.totalViews} />
      <Bars title="Каналы перехода" rows={s.byChannel} total={s.totalViews} translate={(k) => CHANNEL_RU[k] ?? k} />
      <Bars title="Разделы сайта" rows={s.byKind} total={s.totalViews} translate={(k) => KIND_RU[k] ?? k} />
      <Bars title="Устройства" rows={s.byDevice} total={s.totalViews} translate={(k) => DEVICE_RU[k] ?? k} />
      <Bars title="Операционные системы" rows={s.byOs} total={s.totalViews} />
      <Bars title="Браузеры" rows={s.byBrowser} total={s.totalViews} />
      {s.byCountry.length > 0 && <Bars title="Страны" rows={s.byCountry} total={s.totalViews} />}
    </div>

    <div className="analytics-card">
      <h3>Самые посещаемые страницы</h3>
      <ul className="analytics-paths">
        {s.topPaths.map((p) => <li key={p.path}>
          <Link href={p.path === "/" ? "/" : p.path}>{p.path}</Link>
          <span>{p.value.toLocaleString("ru-RU")}</span>
        </li>)}
        {!s.topPaths.length && <li className="analytics-empty">Пока нет данных.</li>}
      </ul>
    </div>
  </section>;
}