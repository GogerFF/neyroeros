import { getLocale } from "@/lib/i18n-server";

const content = {
  ru: {
    eyebrow: "О проекте", title: "О Neyroeros", intro: "Neyroeros — кураторская галерея AI-искусства для взрослых, где воображение встречается с алгоритмами.",
    how: "Как это работает", steps: ["Художник загружает работу, созданную с помощью AI.", "AI-ассистент предлагает метаданные — название и описание.", "Куратор просматривает работу и принимает решение о публикации.", "Работа появляется в галерее и доступна для просмотра, оценки и обсуждения."],
    who: "Кто мы", whoText: "Проект объединяет AI-художников и ценителей цифрового искусства. Мы верим, что AI — это инструмент, расширяющий границы творчества, а не заменяющий его.",
    privacy: "Политика конфиденциальности", privacyText: "Мы храним email и отображаемое имя авторов исключительно для работы платформы. Изображения хранятся на защищённых серверах. Данные не передаются третьим лицам и не используются для рекламы.",
    contacts: "Контакты", contactText: "По вопросам сотрудничества, удаления контента и иным запросам:",
  },
  en: {
    eyebrow: "About", title: "About Neyroeros", intro: "Neyroeros is a curated gallery of adult AI art where imagination meets algorithms.",
    how: "How it works", steps: ["An artist uploads work created with AI.", "An AI assistant suggests metadata — a title and description.", "A curator reviews the work and decides whether to publish it.", "The work appears in the gallery for viewing, rating, and discussion."],
    who: "Who we are", whoText: "The project brings together AI artists and admirers of digital art. We believe AI is a tool that expands the boundaries of creativity, rather than replacing it.",
    privacy: "Privacy policy", privacyText: "We store authors’ email addresses and display names solely to operate the platform. Images are stored on protected servers. Data is not shared with third parties or used for advertising.",
    contacts: "Contact", contactText: "For partnerships, content removal, or other requests:",
  },
  zh: {
    eyebrow: "关于项目", title: "关于 Neyroeros", intro: "Neyroeros 是一个成人 AI 艺术精选画廊，让想象力与算法在此相遇。",
    how: "运作方式", steps: ["艺术家上传由 AI 创作的作品。", "AI 助手建议元数据——标题与描述。", "策展人审核作品并决定是否发布。", "作品出现在画廊中，供浏览、评价与讨论。"],
    who: "我们是谁", whoText: "项目汇聚 AI 艺术家与数字艺术爱好者。我们相信，AI 是拓展创作边界的工具，而不是替代创作者本身。",
    privacy: "隐私政策", privacyText: "我们仅为平台运行保存作者的邮箱和显示名称。图片存储在受保护的服务器上。数据不会提供给第三方，也不会用于广告。",
    contacts: "联系方式", contactText: "如有合作、内容删除或其他请求，请联系：",
  },
};

export default async function About() {
  const locale = await getLocale(); const t = content[locale];
  return <section className="section" style={{ maxWidth: 800 }}><span className="eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><div className="lead" style={{ lineHeight: 1.9 }}>
    <p><strong>Neyroeros</strong> — {t.intro.replace("Neyroeros — ", "")}</p>
    <h2>{t.how}</h2><ol>{t.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <h2>{t.who}</h2><p>{t.whoText}</p>
    <h2>{t.privacy}</h2><p>{t.privacyText}</p>
    <h2>{t.contacts}</h2><p>{t.contactText} <a href="mailto:sklyarenkoff@gmail.com" style={{ color: "var(--accent)" }}>sklyarenkoff@gmail.com</a>.</p>
  </div></section>;
}
