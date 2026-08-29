import { useEffect, useState } from 'react'
import { caricaPilota } from '../services/api.js'
import { Caricamento, ErrorePagina } from '../components/StatoPagina.jsx'
import IntestazioneDettaglio from '../components/IntestazioneDettaglio.jsx'
import AnalisiCircuito from '../components/AnalisiCircuito.jsx'
import IndicatoriProfilo from '../components/IndicatoriProfilo.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

function PilotaPage({ slug }) {
  const { lingua, t } = useLingua()
  const [dati, setDati] = useState(null)
  const [errore, setErrore] = useState('')

  useEffect(() => {
    let componenteAttivo = true
    setDati(null)
    setErrore('')

    caricaPilota(slug, lingua)
      .then((risultato) => {
        if (componenteAttivo) {
          setDati(risultato)
        }
      })
      .catch((problema) => {
        if (componenteAttivo) setErrore(problema.message)
      })

    return () => {
      componenteAttivo = false
    }
  }, [slug, lingua])

  if (errore) return <ErrorePagina messaggio={errore} />
  if (!dati) return <Caricamento />

  return (
    <>
      <IntestazioneDettaglio
        etichetta={t.profiloPilota}
        titolo={dati.pilota.nome}
        sottotitolo={`${dati.pilota.scuderia.nome} · #${dati.pilota.numero} · ${dati.pilota.nazionalita}`}
        sigla={dati.pilota.codice}
        statistiche={[
          {
            valore: `P${dati.pilota.classifica2026.posizione}`,
            etichetta: t.classifica2026,
          },
          {
            valore: dati.pilota.classifica2026.punti,
            etichetta: t.punti,
          },
        ]}
      />

      <div className="contenitore dettaglio-contenuto">
        <IndicatoriProfilo indicatori={dati.indicatori} />
        <AnalisiCircuito
          analisi={dati.analisi}
          andamentoStagioneCorrente={dati.andamentoStagioneCorrente}
          valutazioneFinale={dati.valutazioneFinale}
        />
      </div>
    </>
  )
}

export default PilotaPage
