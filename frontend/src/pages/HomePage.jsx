const APP_STORE_URL = 'https://apps.apple.com/it/app/fantastats-gp/id6808340219?l=en-GB'
const SCREENSHOTS = Array.from({ length: 8 }, (_, index) => ({
  src: `/app-screens/${String(index + 1).padStart(2, '0')}.png`,
  alt: `Schermata ${index + 1} di FantaStats GP`,
}))

function HomePage() {
  return (
    <section className="app-promo">
      <div className="promo-hero">
        <div className="contenitore app-promo-contenuto">
          <h1>TUTTI I DATI A PORTATA DI MANO</h1>
          <a className="app-store-button" href={APP_STORE_URL} rel="noreferrer" target="_blank" aria-label="Scarica FantaStats GP sull’App Store">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M16.7 12.9c0-2.8 2.3-4.1 2.4-4.2a5.2 5.2 0 0 0-4.1-2.2c-1.7-.2-3.4 1-4.3 1s-2.2-1-3.7-1C5.1 6.6 3.3 7.7 2.3 9.4c-2 3.5-.5 8.7 1.4 11.5 1 1.4 2.1 3 3.6 2.9 1.4-.1 2-1 3.7-1s2.2 1 3.7 1c1.6 0 2.6-1.4 3.5-2.8a12.5 12.5 0 0 0 1.6-3.3 4.8 4.8 0 0 1-3.1-4.8ZM13.9 4.7A4.7 4.7 0 0 0 15 1.3a4.8 4.8 0 0 0-3.2 1.6 4.4 4.4 0 0 0-1.2 3.3 4 4 0 0 0 3.3-1.5Z" /></svg>
            <span><small>Scarica su</small><strong>App Store</strong></span>
          </a>
        </div>
        <a className="scroll-cue" href="#screenshots" aria-label="Scorri alle schermate dell’app">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
        </a>
      </div>

      <div id="screenshots" className="promo-gallery" aria-label="Schermate di FantaStats GP">
        {SCREENSHOTS.map((screenshot) => (
          <img key={screenshot.src} src={screenshot.src} alt={screenshot.alt} loading="lazy" />
        ))}
      </div>
    </section>
  )
}

export default HomePage
