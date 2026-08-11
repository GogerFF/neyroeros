import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Правила Neyroeros",
  description: "Правила 18+ AI-art платформы Neyroeros: возрастные ограничения, запреты, ручная модерация и ответственность авторов.",
  alternates: { canonical: "/rules" },
};

const content = {
  ru: { eyebrow:"Сообщество", title:"Правила", ageTitle:"1. Возрастные ограничения", age:"Платформа Neyroeros предназначена только для лиц старше 18 лет. Доступ подтверждается при входе на сайт.", policyTitle:"2. Контент-политика", prohibited:"Запрещены:", banned:["изображения несовершеннолетних (включая неоднозначный возраст);","сексуальное насилие или сцены без явного согласия;","несанкционированные дипфейки реальных людей;","материалы, нарушающие авторские права."], moderationTitle:"3. Модерация", moderation:"Все работы проходят ручную проверку куратором. Публикация занимает до 24 часов. Куратор оставляет за собой право отклонить любую работу без объяснения причин.", metadataTitle:"4. AI-метаданные", metadata:"AI-ассистент предлагает метаданные (название и описание) на основе анализа изображения. Решение о публикации метаданных принимает автор.", liabilityTitle:"5. Ответственность", liability:"Автор несёт полную ответственность за загружаемые изображения и видео. Neyroeros не проверяет право собственности на каждый материал." },
  en: { eyebrow:"Community", title:"Rules", ageTitle:"1. Age restrictions", age:"Neyroeros is intended exclusively for people aged 18 and over. Access is confirmed when entering the site.", policyTitle:"2. Content policy", prohibited:"The following are prohibited:", banned:["depictions of minors, including ambiguous age;","sexual violence or scenes without explicit consent;","unauthorized deepfakes of real people;","materials that infringe copyright."], moderationTitle:"3. Moderation", moderation:"All works are manually reviewed by a curator. Publication may take up to 24 hours. The curator reserves the right to reject any work without explanation.", metadataTitle:"4. AI metadata", metadata:"An AI assistant suggests metadata (title and description) based on image analysis. The author decides whether to use the suggested metadata.", liabilityTitle:"5. Responsibility", liability:"The author bears full responsibility for uploaded images and videos. Neyroeros does not verify ownership rights for every submission." },
  zh: { eyebrow:"社区", title:"规则", ageTitle:"1. 年龄限制", age:"Neyroeros 仅面向年满 18 周岁的人士。进入网站时需确认年龄。", policyTitle:"2. 内容政策", prohibited:"禁止以下内容：", banned:["未成年人的图像，包括年龄不明确的描绘；","性暴力或未经明确同意的场景；","未经授权的真实人物深度伪造；","侵犯版权的材料。"], moderationTitle:"3. 审核", moderation:"所有作品均由策展人进行人工审核。发布最多可能需要 24 小时。策展人保留无须说明理由而拒绝任何作品的权利。", metadataTitle:"4. AI 元数据", metadata:"AI 助手根据图像分析提出元数据建议（标题和描述）。是否采用由作者决定。", liabilityTitle:"5. 责任", liability:"作者对上传的图像和视频承担全部责任。Neyroeros 不会核查每一份材料的所有权。" },
};

export default async function Rules() {
  const locale = await getLocale(); const t = content[locale];
  return <section className="section" style={{ maxWidth: 800 }}><span className="eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><div className="lead" style={{ lineHeight: 1.9 }}>
    <h2>{t.ageTitle}</h2><p>{t.age}</p><h2>{t.policyTitle}</h2><p><strong>{t.prohibited}</strong></p><ul>{t.banned.map(item=><li key={item}>{item}</li>)}</ul><h2>{t.moderationTitle}</h2><p>{t.moderation}</p><h2>{t.metadataTitle}</h2><p>{t.metadata}</p><h2>{t.liabilityTitle}</h2><p>{t.liability}</p>
  </div></section>;
}
