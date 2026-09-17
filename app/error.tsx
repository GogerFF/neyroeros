"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="auth"><div className="panel">
    <h1>Что-то пошло не так</h1>
    <p>Мы уже зажигаем свет. Попробуйте обновить страницу.</p>
    {error.digest && <p className="category-hint">Код ошибки: {error.digest}</p>}
    <button onClick={reset}>Попробовать снова</button>
  </div></section>;
}
