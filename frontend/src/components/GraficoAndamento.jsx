import { useEffect, useRef } from 'react'
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useLingua } from '../i18n/contestoLingua.js'

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
)

const colori = [
  { linea: '#ef2b24', punto: '#ef2b24' },
  { linea: '#f7f7f7', punto: '#f7f7f7' },
  { linea: '#8d8d8d', punto: '#8d8d8d' },
]

function GraficoAndamento({ titolo, descrizione, etichette, serie }) {
  const { t } = useLingua()
  const riferimentoCanvas = useRef(null)

  useEffect(() => {
    if (!riferimentoCanvas.current || !etichette.length || !serie.length) return

    const valoreMassimo = Math.max(
      20,
      ...serie.flatMap((elemento) =>
        elemento.valori.filter((valore) => Number.isFinite(valore)),
      ),
    )
    const grafico = new Chart(riferimentoCanvas.current, {
      type: 'line',
      data: {
        labels: etichette,
        datasets: serie.map((elemento, indice) => {
          const colore = colori[indice % colori.length]

          return {
            label: elemento.nome,
            data: elemento.valori,
            borderColor: colore.linea,
            backgroundColor: colore.punto,
            pointBackgroundColor: '#030303',
            pointBorderColor: colore.punto,
            pointBorderWidth: 2,
            pointHoverBackgroundColor: colore.punto,
            pointHoverBorderColor: '#030303',
            pointHoverRadius: 6,
            pointRadius: 4,
            borderWidth: 2,
            tension: 0.28,
            spanGaps: false,
          }
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: serie.length > 1,
            position: 'bottom',
            labels: {
              color: '#c5c5c5',
              boxHeight: 7,
              boxWidth: 22,
              padding: 20,
              usePointStyle: true,
              font: {
                family: 'Barlow Condensed',
                size: 13,
              },
            },
          },
          tooltip: {
            backgroundColor: '#111111',
            borderColor: '#393939',
            borderWidth: 1,
            displayColors: serie.length > 1,
            padding: 12,
            titleColor: '#f7f7f7',
            bodyColor: '#d0d0d0',
            callbacks: {
              label(contesto) {
                const valore = contesto.raw
                return valore === null
                  ? `${contesto.dataset.label}: ${t.datoNonDisponibile}`
                  : `${contesto.dataset.label}: P${valore}`
              },
            },
          },
        },
        scales: {
          x: {
            border: { color: '#393939' },
            grid: { display: false },
            ticks: {
              autoSkip: true,
              color: '#8f8f8f',
              maxRotation: 0,
              padding: 10,
              font: {
                family: 'Barlow Condensed',
                size: 12,
              },
            },
          },
          y: {
            min: 1,
            max: valoreMassimo,
            reverse: true,
            border: { display: false },
            grid: { color: '#202020' },
            ticks: {
              color: '#8f8f8f',
              padding: 10,
              stepSize: 1,
              callback: (valore) => `P${valore}`,
              font: {
                family: 'Barlow Condensed',
                size: 12,
              },
            },
          },
        },
      },
    })

    return () => grafico.destroy()
  }, [etichette, serie, t.datoNonDisponibile])

  return (
    <article className="grafico-andamento">
      <header>
        <h3>{titolo}</h3>
        <p>{descrizione}</p>
      </header>
      <div className="contenitore-canvas">
        <canvas
          ref={riferimentoCanvas}
          role="img"
          aria-label={`${titolo}. ${descrizione}`}
        >
          {t.fallbackGrafico(titolo)}
        </canvas>
      </div>
    </article>
  )
}

export default GraficoAndamento
