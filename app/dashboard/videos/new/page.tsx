import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { categoryLabel } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function NewVideo() {
  await requireUser();
  const [categories, locale] = await Promise.all([db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }), getLocale()]);
  return <section className="auth wide"><form action="/api/videos/create" method="post" className="panel" encType="multipart/form-data">
    <span className="eyebrow">Видео</span><h1>Загрузить видео</h1><p className="lead">MP4 или WebM до 30 МБ, от 5 секунд до 3 минут. После проверки модератором видео появится в каталоге.</p>
    <input type="hidden" name="sourceLocale" value={locale}/>
    <label className="drop">Видео MP4 / WebM — до 30 МБ<input name="file" type="file" accept="video/mp4,video/webm" required/></label>
    <label className="drop">Poster JPG / PNG / WebP — до 5 МБ<input name="poster" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
    <label>Длительность в секундах<input name="durationSec" type="number" min="5" max="180" required/></label>
    <label>Название<input name="title" minLength={2} maxLength={100} required/></label>
    <label>Описание<textarea name="description" minLength={20} maxLength={2000} required/></label>
    <label>Категория<select name="categoryId" required defaultValue=""><option value="" disabled>Выберите категорию</option>{categories.map(c=><option key={c.id} value={c.id}>{categoryLabel(c.slug,locale,c).name}</option>)}</select></label>
    <fieldset><legend>Обязательное подтверждение политики</legend><label><input type="checkbox" name="adults" required/> Все изображённые люди совершеннолетние</label><label><input type="checkbox" name="consensual" required/> Нет сексуального насилия или эксплуатации</label><label><input type="checkbox" name="noDeepfake" required/> Нет несанкционированных deepfake реальных людей</label></fieldset>
    <button>Сохранить черновик</button>
  </form></section>;
}
