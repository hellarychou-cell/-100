import Link from "next/link";

export default function PublicPage() {
  return (
    <main className="public-home">
      <section className="public-home__canvas">
        <header className="public-home__header">
          <span>成她100</span>
          <Link aria-label="打开成她宣言" className="public-home__menu" href="/philosophy">
            <i /><i /><i />
          </Link>
        </header>
        <div aria-hidden className="public-home__branch public-home__branch--top" />
        <div aria-hidden className="public-home__halo" />
        <section className="public-home__content">
          <h1>100天，<br />把她还给她</h1>
          <p>回到自己，重建身心能量，<br />成为更自由、更笃定的你。</p>
          <Link className="public-home__cta" href="/auth?mode=register">
            <span aria-hidden>◐</span>开启我的100天旅程
          </Link>
        </section>
        <footer className="public-home__footer">
          <span aria-hidden className="public-home__branch public-home__branch--bottom" />
          <div><i />◆<i /></div>
          <p>遇见所望定，成为自己的光</p>
        </footer>
      </section>
    </main>
  );
}
