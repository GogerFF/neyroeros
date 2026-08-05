import { createStoryAction } from "@/app/actions";
import { requireUser } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n-server";

export default async function NewStory() {
  await requireUser();
  const locale = await getLocale();
  return <section className="auth wide"><form action={createStoryAction} className="panel" encType="multipart/form-data">
    <span className="eyebrow">Истории</span>
    <h1>Новый рассказ</h1>
    <input type="hidden" name="sourceLocale" value={locale}/>
    <label>Название<input name="title" minLength={2} maxLength={160} required/></label>
    <label>Краткое описание<textarea name="description" maxLength={1000}/></label>
    <label>Текст рассказа<textarea name="body" minLength={20} maxLength={100000} rows={18} required placeholder="Абзацы сохранятся в исходном виде."/></label>
    <label className="drop">Иллюстрации — до 30 файлов<input name="illustrations" type="file" accept="image/jpeg,image/png,image/webp" multiple/></label>
    <p className="category-hint">Изображения будут показаны в порядке выбора файлов.</p>
    <button>Сохранить рассказ</button>
  </form></section>;
}
