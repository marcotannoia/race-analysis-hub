import { useEffect, useState } from 'react'
import { caricaScuderia } from '../services/api.js'
import { Caricamento, ErrorePagina } from '../components/StatoPagina.jsx'
import IntestazioneDettaglio from '../components/IntestazioneDettaglio.jsx'
import AnalisiCircuito from '../components/AnalisiCircuito.jsx'
import IndicatoriProfilo from '../components/IndicatoriProfilo.jsx'
import ProfiloTecnicoScuderia from '../components/ProfiloTecnicoScuderia.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

function ScuderiaPage({ slug }) {
  const { lingua, t } = useLingua()
  const [dati, setDati] = useState(null)
  const [errore, setErrore] = useState('')

  useEffect(() => {
    let componenteAttivo = true
    setDati(null)
    setErrore('')

    caricaScuderia(slug, lingua)
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

  const nomiPiloti = dati.piloti.map((pilota) => pilota.nome).join(' · ')

  return (
    <>
      <IntestazioneDettaglio
        etichetta={t.profiloScuderia}
        titolo={dati.scuderia.nome}
        sottotitolo={`${nomiPiloti} · ${dati.scuderia.nazionalita}`}
        sigla={dati.scuderia.nome.slice(0, 3).toUpperCase()}
        statistiche={[
          {
            valore: `P${dati.scuderia.classifica2026.posizione}`,
            etichetta: t.classifica2026,
          },
          {
            valore: dati.scuderia.classifica2026.punti,
            etichetta: t.punti,
          },
        ]}
      />

      <div className="contenitore dettaglio-contenuto">
        <ProfiloTecnicoScuderia profilo={dati.profiloTecnico} />
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

export default ScuderiaPage
