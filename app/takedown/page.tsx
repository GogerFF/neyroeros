import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Takedown и права на изображение",
  description: "Политика удаления контента Neyroeros: дипфейк-лайкнесс, нарушения авторских прав, порядок takedown-запроса и срок ответа.",
  alternates: { canonical: "/takedown" },
};

const content = {
  ru: {
    eyebrow: "Правовая информация", title: "Takedown-политика и дипфейк-дисклеймер",
    disclaimerTitle: "Дисклеймер о likeness",
    disclaimer: "Все работы на Neyroeros созданы с помощью генеративных AI-моделей. Изображённые персонажи вымышлены; любое сходство с реальными людьми непреднамеренно. Загружая работы с узнаваемым сходством (celebrity likeness) с реальными людьми, авторы подтверждают, что у них нет прав на такое использование. Neyroeros не создаёт контент самостоятельно: платформа — канал публикации с ручной модерацией.",
    sexualTitle: "Сексуализированный likeness реальных людей",
    sexual: "Сексуализированные изображения реальных людей, размещённые без их согласия, запрещены правилами и удаляются при первом обращении. celebrity-дипфейки sexual-характера удаляются безусловно, без процедуры counter-notice.",
    dmcaTitle: "Авторские права (DMCA / takedown)",
    dmca: "Правообладатель может запросить удаление материала. Запрос должен включать: описание и URL материала; подтверждение прав; контактные данные; заявление о добросовестности претензии; подпись.",
    processTitle: "Как подать запрос",
    process: ["Отправьте письмо на sklyarenkoff@gmail.com с темой «Takedown».", "Мы отвечаем в течение 48 часов и удаляем материал в течение 72 часов при обоснованной претензии.", "При повторных нарушениях автор блокируется."],
    note: "Добросовестные ошибочные запросы не ведут к блокировке подачи. Злоупотребление процедурой (массовые необоснованные запросы) — ведёт.",
  },
  en: {
    eyebrow: "Legal", title: "Takedown policy and deepfake disclaimer",
    disclaimerTitle: "Likeness disclaimer",
    disclaimer: "All works on Neyroeros are generated with AI models. Depicted characters are fictional; any resemblance to real people is unintentional. By uploading works with recognizable likeness of real people, authors confirm they have no right to such use. Neyroeros does not create content itself: the platform is a publishing channel with human moderation.",
    sexualTitle: "Sexualized likeness of real people",
    sexual: "Sexualized images of real people published without their consent are prohibited by the rules and removed on first request. Sexual celebrity deepfakes are removed unconditionally, without a counter-notice procedure.",
    dmcaTitle: "Copyright (DMCA / takedown)",
    dmca: "A rights holder may request material removal. The request must include: a description and URL of the material; proof of rights; contact details; a good-faith statement; a signature.",
    processTitle: "How to submit a request",
    process: ["Send an email to sklyarenkoff@gmail.com with the subject “Takedown”.", "We respond within 48 hours and remove the material within 72 hours for a justified claim.", "Repeat infringers are banned."],
    note: "Good-faith mistaken requests do not lead to submission bans. Abuse of the process (mass unfounded requests) does.",
  },
  zh: {
    eyebrow: "法律信息", title: "下架政策与深度伪造免责声明",
    disclaimerTitle: "肖像免责声明",
    disclaimer: "Neyroeros 上的所有作品均由生成式 AI 模型创作。所描绘的角色均为虚构；与真实人物的任何相似均非故意。上传与真实人物具有可识别相似性的作品时，作者确认其无权进行此类使用。Neyroeros 本身不创作内容：平台是带有人工审核的发布渠道。",
    sexualTitle: "真实人物的性化肖像",
    sexual: "未经本人同意发布的真实人物性化图像被规则禁止，并在首次请求时删除。名人性质深度伪造无条件删除，不设反通知程序。",
    dmcaTitle: "版权（DMCA / 下架）",
    dmca: "权利人可以请求删除材料。请求必须包括：材料描述和 URL；权利证明；联系方式；善意声明；签名。",
    processTitle: "如何提交请求",
    process: ["发送邮件至 sklyarenkoff@gmail.com，主题为“Takedown”。", "我们在 48 小时内回复，并在合理申诉时于 72 小时内删除材料。", "重复侵权者将被封禁。"],
    note: "善意的错误请求不会导致提交封禁。滥用程序（大量无根据请求）则会。",
  },
};

export default async function TakedownPage() {
  const locale = await getLocale();
  const t = content[locale];
  return <section className="section static-page">
    <span className="eyebrow">{t.eyebrow}</span>
    <h1>{t.title}</h1>
    <div className="lead">
      <h2>{t.disclaimerTitle}</h2>
      <p>{t.disclaimer}</p>
      <h2>{t.sexualTitle}</h2>
      <p>{t.sexual}</p>
      <h2>{t.dmcaTitle}</h2>
      <p>{t.dmca}</p>
      <h2>{t.processTitle}</h2>
      <ol>{t.process.map((step, i) => <li key={i}>{step}</li>)}</ol>
      <p className="muted">{t.note}</p>
    </div>
  </section>;
}
