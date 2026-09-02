#!/usr/bin/env python3
"""Genera le traduzioni editoriali con Azure Translator.

Lo script e solo amministrativo: legge la chiave da ``backend/.env``, salva
progressivamente una cache locale e non viene mai richiamato dalle API
pubbliche o dal frontend. Le traduzioni gia approvate funzionano come memoria,
quindi vengono inviati ad Azure soltanto i testi italiani nuovi o modificati.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import unicodedata
from pathlib import Path
from typing import Any


LINGUE = ("it", "en", "fr", "pt", "es", "de")
LINGUE_DA_TRADURRE = tuple(lingua for lingua in LINGUE if lingua != "it")
LINGUE_AZURE = {"en": "en", "fr": "fr", "pt": "pt-PT", "es": "es", "de": "de"}
ENDPOINT_PREDEFINITO = "https://api.cognitive.microsofttranslator.com"
CACHE_PREDEFINITA = Path(__file__).resolve().parents[1] / ".translation-cache" / "azure.json"
TOKEN_PROTETTI = set()

CAMPI_LOCALIZZABILI = {
    "piloti": ("nazionalita",),
    "scuderie": ("nazionalita",),
    "gare": (
        "nome",
        "circuito",
        "paese",
        "etichettaExcel",
        "contestoStorico",
        "pilotiFavoriti",
        "scuderieFavorite",
        "outsider",
        "potenzialiDifficolta",
        "gommeStrategia",
        "rischi",
        "confidenza",
    ),
    "analisiGare": (
        "risultatiGara",
        "notaBene",
        "andamentoPerAnno",
        "risultatiQualifica",
        "passoGara",
        "gestioneGomme",
        "considerazioniFinali",
        "affidabilita",
        "aggiornamentiInArrivo",
        "penalita",
    ),
    "analisiScuderie": (
        "risultatiGara",
        "notaBene",
        "andamentoPerAnno",
        "risultatiQualifica",
        "passoGara",
        "gestioneGomme",
        "considerazioniFinali",
        "affidabilita",
        "aggiornamentiInArrivo",
    ),
}

FRASI_DETERMINISTICHE = {
    "QUALIFICHE NON DISPUTATE SU QUESTO CIRCUITO": {
        "en": "QUALIFYING NOT HELD AT THIS CIRCUIT",
        "fr": "QUALIFICATIONS NON DISPUTÉES SUR CE CIRCUIT",
        "pt": "QUALIFICAÇÃO NÃO DISPUTADA NESTE CIRCUITO",
        "es": "CLASIFICACIÓN NO DISPUTADA EN ESTE CIRCUITO",
        "de": "QUALIFYING NICHT AUF DIESER STRECKE AUSGETRAGEN",
    },
    "GP NON DISPUTATO SU QUESTO CIRCUITO": {
        "en": "GRAND PRIX NOT HELD AT THIS CIRCUIT",
        "fr": "GRAND PRIX NON DISPUTÉ SUR CE CIRCUIT",
        "pt": "GRANDE PRÉMIO NÃO DISPUTADO NESTE CIRCUITO",
        "es": "GRAN PREMIO NO DISPUTADO EN ESTE CIRCUITO",
        "de": "GRAND PRIX NICHT AUF DIESER STRECKE AUSGETRAGEN",
    },
    "NON PRESENTE IN F1": {
        "en": "NOT COMPETING IN F1",
        "fr": "ABSENT DE LA F1",
        "pt": "NÃO PARTICIPAVA NA F1",
        "es": "NO PARTICIPABA EN LA F1",
        "de": "NICHT IN DER F1 VERTRETEN",
    },
    "NON CORSO IN F1": {
        "en": "DID NOT RACE IN F1",
        "fr": "N'A PAS COURU EN F1",
        "pt": "NÃO CORREU NA F1",
        "es": "NO COMPITIÓ EN F1",
        "de": "NICHT IN DER F1 ANGETRETEN",
    },
    "NON CORSO": {
        "en": "DID NOT RACE",
        "fr": "N'A PAS COURU",
        "pt": "NÃO CORREU",
        "es": "NO COMPITIÓ",
        "de": "NICHT ANGETRETEN",
    },
    "NON DISPUTATO SU QUESTO CIRCUITO": {
        "en": "NOT HELD AT THIS CIRCUIT",
        "fr": "NON DISPUTÉ SUR CE CIRCUIT",
        "pt": "NÃO DISPUTADO NESTE CIRCUITO",
        "es": "NO DISPUTADO EN ESTE CIRCUITO",
        "de": "NICHT AUF DIESER STRECKE AUSGETRAGEN",
    },
    "NON DISPUTATE SU QUESTO CIRCUITO": {
        "en": "NOT HELD AT THIS CIRCUIT",
        "fr": "NON DISPUTÉES SUR CE CIRCUIT",
        "pt": "NÃO DISPUTADAS NESTE CIRCUITO",
        "es": "NO DISPUTADAS EN ESTE CIRCUITO",
        "de": "NICHT AUF DIESER STRECKE AUSGETRAGEN",
    },
}

GLOSSARIO = {
    "it": (),
    "en": (
        (r"\brace pace\b", "race pace"),
        (r"\bnew bottom\b", "new floor"),
        (r"\btyre management\b|\btire management\b", "tyre management"),
        (r"\btires\b", "tyres"),
        (r"\btire\b", "tyre"),
        (r"\broyal step\b", "genuine pace"),
        (r"\brounds? per set\b", "laps per tyre set"),
        (r"\bdouble McLaren\b", "McLaren one-two"),
        (r"\bhard roads\b", "hard tyres"),
        (r"\bSafety car\b", "Safety Car"),
        (r"\bVirtual safety car\b", "Virtual Safety Car"),
    ),
    "fr": (
        (r"\bvoiture de sécurité\b", "Safety Car"),
        (r"\bvoiture de securite\b", "Safety Car"),
        (r"\bnouveau fond\b", "nouveau fond plat"),
        (r"\brythme de course\b", "rythme de course"),
    ),
    "pt": (
        (r"\bcarro de segurança\b", "Safety Car"),
        (r"\bnovo fundo\b", "novo assoalho"),
        (r"\britmo da corrida\b", "ritmo de corrida"),
        (r"\bgestão de pneus\b", "gestão dos pneus"),
    ),
    "es": (
        (r"\bcoche de seguridad\b", "Safety Car"),
        (r"\bmanejo de los neumáticos\b", "gestión de neumáticos"),
        (r"\britmo de la carrera\b", "ritmo de carrera"),
        (r"\bgestión de los neumáticos\b", "gestión de neumáticos"),
    ),
    "de": (
        (r"\bSicherheitsauto\b", "Safety Car"),
        (r"\bneuer Boden\b", "neuer Unterboden"),
        (r"\bRennschritt\b", "Rennpace"),
        (r"\bReifenverwaltung\b", "Reifenmanagement"),
    ),
}

CORREZIONI_CONTESTUALI = {
    "en": (
        (r"\bfirst eleven games\b", "first eleven races"),
        (r"\bgames?\b", "races"),
        (r"\bPilots' experience\b", "The drivers' experience"),
        (r"\bpure power tracks\b", "power-sensitive circuits"),
        (r"\blow load\b", "low downforce"),
        (r"\bbottom of the (?:field|game)\b", "back of the grid"),
        (r"\bwindow of use\b", "operating window"),
        (r"\bfront confidence\b", "front-end confidence"),
        (r"\btrack fit\b", "Circuit suitability"),
        (r"\bMedium confidence\b", "Medium confidence"),
        (r"\baverage arrival\b", "average finishing position"),
        (r"\bclassification mainly by qualifying and pace\b", "the order was determined mainly by qualifying position and race pace"),
        (r"\bNo retired\b", "No retirements"),
        (r"\bmanagement was ordered on a one-stop race\b", "tyre management was tidy on a one-stop strategy"),
        (r"\bwas conditioned by\b", "was shaped by"),
        (r"\bthe episodes\b", "the incidents"),
        (r"\bpodium area\b", "podium contention"),
        (r"\bsports management\b", "strategic execution"),
        (r"\bspeed error in (?:the )?pit lane\b", "speeding infringement in the pit lane"),
        (r"\bauthentic pace\b", "genuine pace"),
        (r"\bthe Soft(?! tyres?\b)\b", "the Soft tyres"),
        (r"\bSoft tyres tyres?\b", "Soft tyres"),
        (r"\bfloor wear and tear\b", "excessive plank wear"),
        (r"\bThe match was built\b", "The race was built"),
        (r"\btechnical sheet\b", "technical specification"),
        (r"\bsupport changes\b", "changes of direction"),
        (r"\bmost solid references\b", "strongest circuits"),
        (r"\bregular pace\b", "consistent pace"),
        (r"\bresult in qualifying\b", "qualifying result"),
        (r"\bkept the tyres alive\b", "preserved the tyres"),
        (r"\bNeutral/variable individual picture\b", "Neutral or mixed individual picture"),
        (r"\bNo F1 recent samples on the track\b", "No recent F1 samples at this circuit"),
        (r"\bevaluation cannot be individualized\b", "an individual assessment is not possible"),
        (r"\bPosition holding and recovery suggest an overall effective management\b", "Holding position and making progress suggest effective overall management"),
        (r"\bDegradation is often limited and time lost in the pits\b", "Degradation is often limited and pit-lane time loss is high"),
        (r"\bthe front left can become the limit\b", "the front-left tyre can become the limiting factor"),
        (r"\bFavorite almost everywhere\b", "A favourite at almost every circuit"),
        (r"\bThe drivers['’] experience is the main help\b", "Driver experience is the main asset"),
        (r"\bChronometric degradation\b", "Lap-time degradation"),
        (r"\bNot very abrasive surface but\b", "The surface is not very abrasive, but"),
        (r"\bStart, PU reliability and qualifying position\b", "Starts, PU reliability and qualifying position"),
        (r"\bthe Hard is often the reference\b", "the Hard tyre is often the benchmark"),
        (r"\bSoft and Medium can work well\b", "The Soft and Medium compounds can work well"),
        (r"\bpassing comebacks\b", "comebacks built through overtaking"),
        (r"\bmountain comebacks\b", "strong comebacks"),
        (r"\bpace and strategy converted\b", "converted their pace and strategy into results"),
        (r"\btheundercut\b", "the undercut"),
        (r"\. the undercut\b", ". The undercut"),
        (r"\s+([.,;:])", r"\1"),
    ),
    "fr": (
        (r"\bunion personnelle\b", "unité de puissance"),
        (r"\bPU\b", "unité de puissance"),
        (r"\bmatchs?\b", "courses"),
        (r"\bMon préféré presque partout\b", "favorite sur presque tous les circuits"),
        (r"\bpistes? purement puissantes\b", "circuits exigeants en puissance"),
        (r"\bgrains\b", "graining"),
        (r"\bsous-minage\b", "undercut"),
        (r"\bposition qualificative\b", "position en qualifications"),
        (r"\bfenêtre d’utilisation\b", "fenêtre de fonctionnement"),
        (r"\b(?:la )?moto historique\b", "les données historiques"),
        (r"\bsurface compromise\b", "fond plat endommagé"),
        (r"\bpassage immédiat les pneus intermédiaires\b", "passage immédiat aux pneus intermédiaires"),
        (r"\bpénalité accordée\b", "pénalité infligée"),
        (r"\bpas royal\b", "rythme réel"),
        (r"\bmanches par série\b", "tours par train de pneus"),
        (r"\bdouble McLaren\b", "doublé McLaren"),
        (r"\bduo-deux McLaren\b", "doublé McLaren"),
        (r"\bRussell['’]erreur\b", "l’erreur de Russell"),
        (r"\bP(\d{1,2})bien\b", r"P\1 bien"),
        (r"\b(?:le|la|une) undercut\b", "l’undercut"),
        (r"\bà la undercut\b", "à l’undercut"),
        (r"\baprès la undercut\b", "après l’undercut"),
        (r"\bsous-crochet\b", "undercut"),
        (r"\b(a|aurait|avait|n['’]a pas) unité de puissance\b", r"\1 pu"),
        (r"\btout au long de (?:la|le) stint\b", "tout au long du stint"),
        (r"\ble stint finale est devenue\b", "le stint final est devenu"),
        (r"\blimites stint\b", "limites du stint"),
        (r"\broutes difficiles\b", "pneus durs"),
        (r"\bAucun F1 échantillons récents sur la piste\b", "Aucun échantillon récent de F1 sur ce circuit"),
        (r"\bImage individuelle neutre/variable\b", "Bilan individuel neutre ou variable"),
        (r"\bCadre neutre\b", "Contexte neutre"),
        (r"\b(?:Au départ|Au début), unité de puissance la fiabilité\b", "Au départ, la fiabilité de l’unité de puissance"),
        (r"\bla fiabilité unité de puissance\b", "la fiabilité de l’unité de puissance"),
        (r"\baucun pneu n['’]a défectueux\b", "aucun problème récurrent lié aux pneus"),
        (r"\bbonne dégradation récente et bonne\b", "dégradation récemment bien maîtrisée"),
        (r"\bune appui\b", "un appui"),
        (r"\bToute nouvelle supplémentaire\b", "Toute nouveauté supplémentaire"),
        (r"\ble abandon\b", "l’abandon"),
        (r"\bderniers courses\b", "dernières courses"),
        (r"\bposition sur la voie\b", "position en piste"),
        (r"\bclimatisation\b", "refroidissement"),
        (r"\ble upgrade\b", "l’upgrade"),
        (r"\bl’aide principale\b", "le principal atout"),
        (r"\btour volant\b", "tour rapide"),
        (r"\bpaquet majeur\b", "évolution majeure"),
        (r"\bun simple stop\b", "un seul arrêt"),
        (r"\bla circulation\b", "le trafic"),
        (r"\bvitesse sur le podium\b", "rythme permettant de viser le podium"),
        (r"\bun courses\b", "une course"),
        (r"\bcelui de Alonso\b", "celui d’Alonso"),
        (r"\berreur de excès de vitesse\b", "excès de vitesse"),
        (r"\bLe choix opportun les pneus intermédiaires\b", "Le choix opportun des pneus intermédiaires"),
        (r"\b(?:le\s+)?(?:Le pneu\s+)+Hard est souvent\b", "le pneu Hard est souvent"),
        (r"(?<!pneu )\bHard est souvent\b", "le pneu Hard est souvent"),
        (r"\bpit lane\b", "voie des stands"),
        (r"\bFAVORITE\s+—", "FAVORI —"),
        (r"\ble stint final est devenu trop longue\b", "Le stint final est devenu trop long"),
        (r"\bLes pneus sont restés un soutien pour le retour\b", "Les pneus ont permis de soutenir la remontée"),
        (r"\bremontées aériennes\b", "remontées"),
        (r"\bretours? en montagne\b", "remontées"),
        (r"\bVerstappen, Piastri et Norris rythme et stratégie transformés\b", "Verstappen, Piastri et Norris ont converti leur rythme et leur stratégie en résultat"),
        (r"\bL’évolution de l’asphalte et des pistes est inconnue\b", "L’évolution de l’asphalte et de la piste reste incertaine"),
        (r"\bsurtout en vent\b", "surtout par vent fort"),
        (r"\bAsphalte historiquement difficile, la chaleur et l’humidité transfèrent\b", "Un asphalte historiquement exigeant, associé à la chaleur et à l’humidité, transfère"),
        (r"\bSurface pas très abrasive mais contraintes thermiques élevées\b", "Surface peu abrasive, mais fortes contraintes thermiques"),
        (r"\bLes bosses et les charges mixtes peuvent pousser vers deux arrêts\b", "Les bosses et les charges mixtes peuvent favoriser une stratégie à deux arrêts"),
        (r"\bLa dégradation chronométrique\b", "La perte de performance au tour"),
        (r"\b(?:Le pneu\s+)+avant gauche, les bordures\b", "Le pneu avant gauche, les bordures"),
        (r"(?<!pneu )\bAvant gauche, les bordures\b", "Le pneu avant gauche, les bordures"),
        (r"\bla refroidissement\b", "le refroidissement"),
        (r"\bposition de qualification\b", "position sur la grille"),
        (r"\bDégradation normalement faible ; La difficulté\b", "Dégradation normalement faible ; la difficulté"),
        (r"\bLe maintien de position et la remontée suggèrent une gestion globale efficace\b", "Le maintien de la position et la remontée indiquent une gestion globalement efficace"),
        (r"\bLa dégradation est souvent limitée et le temps perdu dans les stands : un arrêt unique est normalement privilégié, mais l’avant gauche peut devenir la limite\b", "La dégradation est souvent limitée et la perte de temps aux stands élevée : un seul arrêt est généralement privilégié, mais le pneu avant gauche peut devenir le facteur limitant"),
        (r"\bfavorite sur presque tous les circuits\b", "l’équipe fait partie des favorites sur presque tous les circuits"),
        (r"\bMéfiez-vous des circuits exigeants en puissance\b", "Prudence sur les circuits exigeants en puissance"),
        (r"\bL’apprentissage, la warm-up, les charges latérales et l’adaptation rapide à la suspension seront décisives\b", "L’apprentissage, la mise en température, les charges latérales et l’adaptation rapide des réglages seront décisifs"),
        (r"\bSouvent une forte dégradation thermique\b", "Dégradation thermique souvent élevée"),
        (r"\bdu graining avant\b", "du graining sur les pneus avant"),
        (r"\bque la cause soit isolée dans les pneus\b", "d’attribuer la cause uniquement aux pneumatiques"),
        (r"\baucun problème récurrent lié aux pneus ; La performance\b", "aucun problème récurrent lié aux pneus ; la performance"),
        (r"\bLa fiabilité et la fenêtre\b", "La fiabilité et la fenêtre de fonctionnement"),
        (r"\bfenêtre de fonctionnement de fonctionnement\b", "fenêtre de fonctionnement"),
        (r"\bLe pneu avant gauche, les bordures et les limites du stint sont essentielles\b", "Le pneu avant gauche, les bordures et les limites du stint sont essentiels"),
        (r"\. l’abandon\b", ". L’abandon"),
        (r"\bdeux des trois derniers course\b", "deux des trois dernières courses"),
        (r"\blaundercut\b", "l’undercut"),
        (r"\bLeclerc profité de l’undercut\b", "Leclerc a profité de l’undercut"),
        (r"\bL’undercut et un rythme constant\b", "L’undercut et un rythme constant"),
        (r"\bl’undercut subie\b", "l’undercut subi"),
        (r"\bFerraripotentiel\b", "potentiel de la Ferrari"),
        (r"\bavant qu’un tableau utile ne puisse émerger\b", "avant qu’une tendance significative puisse se dégager"),
        (r"\bLes pneus étaient maintenus en bon état\b", "Les pneus ont été préservés"),
        (r"\beffondrement du complexe\b", "effondrement des pneumatiques"),
        (r"\bchangements de support\b", "changements de direction"),
        (r"\bforce aérodynamique efficace\b", "appui aérodynamique efficace"),
        (r"^l’abandon\b", "L’abandon"),
        (r"\bMcLaren occupé définitivement\b", "McLaren occupait solidement"),
    ),
    "pt": (
        (r"\bprimeiros onze jogos\b", "primeiras onze corridas"),
        (r"\bjogos?\b", "corridas"),
        (r"\bprimeiros onze corridas\b", "primeiras onze corridas"),
        (r"\bfundo do jogo\b", "fundo da grelha"),
        (r"\bpistas? de puro poder\b", "circuitos exigentes em potência"),
        (r"\bproduzir grão\b", "provocar graining"),
        (r"\bbaixa carga\b", "baixa carga aerodinâmica"),
        (r"\bjanela de uso\b", "janela de funcionamento"),
        (r"\bclassificação principalmente por qualificação e ritmo\b", "ordem definida sobretudo pela qualificação e pelo ritmo de corrida"),
        (r"\bsuperfície comprometida\b", "assoalho danificado"),
        (r"\bpasso real\b", "ritmo real"),
        (r"\brondas por conjunto\b", "voltas por conjunto de pneus"),
        (r"\bdupla McLaren\b", "dobradinha da McLaren"),
        (r"\b(?:a|uma) undercut\b", "o undercut"),
        (r"\bpela undercut\b", "pelo undercut"),
        (r"\bAundercut\b", "O undercut"),
        (r"\bdurante tod[ao] o stint\b", "durante todo o stint"),
        (r"\b(?:a|uma) stint\b", "o stint"),
        (r"\bGasly gerir\b", "Gasly geriu"),
        (r"\bAlonso tive\b", "Alonso teve"),
        (r"\ba abandono\b", "o abandono"),
        (r"\búltimos três corridas\b", "últimas três corridas"),
        (r"\bNão F1 amostras recentes na faixa\b", "Não existem amostras recentes de F1 neste circuito"),
        (r"\bQuadro neutro\b", "Contexto neutro"),
        (r"\b(?:Início|No início), PU fiabilidade\b", "No arranque, a fiabilidade da PU"),
        (r"\bAvanços e cargas mistas podem empurrar para dois registos\b", "As irregularidades e as cargas mistas podem favorecer duas paragens"),
        (r"\bpasso autêntico\b", "ritmo real"),
        (r"\bO carro manteve os pneus vivos\b", "O carro preservou os pneus"),
        (r"\bImagem individual neutra/variável\b", "Balanço individual neutro ou variável"),
        (r"\bposição de qualificação\b", "posição na qualificação"),
        (r"\bA escolha (?:oportuna|atempada) os pneus intermédios\b", "A escolha atempada dos pneus intermédios"),
        (r"\b(?:o\s+)?(?:O pneu\s+)+Hard é frequentemente\b", "o pneu Hard é frequentemente"),
        (r"(?<!pneu )\bHard é frequentemente\b", "o pneu Hard é frequentemente"),
        (r"\ba graining foi limitada\b", "o graining foi limitado"),
        (r"\bgranulado foi limitado\b", "graining foi limitado"),
        (r"\bCuidado com as circuitos\b", "Atenção aos circuitos"),
        (r"\bos McLaren\b", "os carros da McLaren"),
        (r"\bpit lane\b", "via das boxes"),
        (r"\bda longa stint\b", "do longo stint"),
        (r"\bna longa stint\b", "no longo stint"),
        (r"\ba longa stint\b", "o longo stint"),
        (r"\ba sua abandono\b", "o seu abandono"),
        (r"\bda abandono\b", "do abandono"),
        (r"\bdupla abandono\b", "duplo abandono"),
        (r"\bdos últimas três corridas\b", "das últimas três corridas"),
        (r"\bdo prancha do fundo\b", "da prancha do fundo"),
        (r"\bFrente esquerdo, os lancilhos e os limites stint\b", "O pneu dianteiro esquerdo, os lancis e os limites do stint"),
        (r"\brecuperações? de passe\b", "remontadas"),
        (r"\bregressos? de montanha\b", "remontadas"),
        (r"\bVerstappen, Piastri e Norris ritmo e estratégia convertidos\b", "Verstappen, Piastri e Norris converteram o ritmo e a estratégia em resultado"),
        (r"\bmontado novamente no P(\d{1,2})-P(\d{1,2})\b", r"recuperou de P\1 para P\2"),
        (r"\bO alcatrão e a evolução das pistas são desconhecidas\b", "O asfalto e a evolução da pista são incógnitas"),
        (r"\bgrão dianteiro\b", "graining nos pneus dianteiros"),
        (r"\bfiabilidade PU riscos (?:mantêm-se|subsistem)\b", "persistem riscos na fiabilidade da PU"),
        (r"\bA experiência dos pilotos é a principal ajuda\b", "A experiência dos pilotos é o principal trunfo"),
        (r"\bNenhum pneu defeituoso\b", "Nenhum problema recorrente com os pneus"),
        (r"\bNo arranque, a fiabilidade da PU e posição\b", "No arranque, a fiabilidade da PU e a posição"),
        (r"\bA manutenção e recuperação da posição sugerem uma gestão global eficaz\b", "Manter e recuperar posições sugere uma gestão globalmente eficaz"),
        (r"\bA degradação é frequentemente limitada e o tempo perdido nas boxes: normalmente prefere-se uma única paragem, mas a frente esquerda pode tornar-se o limite\b", "A degradação é frequentemente limitada e o tempo perdido nas boxes é elevado: normalmente prefere-se uma única paragem, mas o pneu dianteiro esquerdo pode tornar-se o fator limitante"),
        (r"\bFavorito quase em todo o lado\b", "A equipa é favorita em quase todos os circuitos"),
        (r"\bO alcatrão historicamente desafiante, o calor e a humidade transferem\b", "O asfalto é historicamente exigente; o calor e a humidade transferem"),
        (r"\bcontam mais do que degradação pura\b", "contam mais do que a degradação pura"),
        (r"\bFrequentemente elevada degradação térmica\b", "Degradação térmica frequentemente elevada"),
        (r"\bSoft e Medium podem funcionar bem\b", "Os compostos Soft e Medium podem funcionar bem"),
        (r"\bA degradação cronométrica\b", "A perda de desempenho por volta"),
        (r"\ba causa fique isolada nos pneus\b", "a causa seja atribuída apenas aos pneus"),
        (r"\bFrio e pouca aderência podem causar graining nos pneus dianteiros e subviragem\b", "O frio e a baixa aderência podem provocar graining nos pneus dianteiros e subviragem"),
        (r"\bAlcatrão liso\b", "Asfalto liso"),
        (r"\. o abandono\b", ". O abandono"),
        (r"\bdois dos últimos três corrida\b", "duas das últimas três corridas"),
    ),
    "es": (
        (r"\bprimeros once partidos\b", "primeras once carreras"),
        (r"\bpartidos?\b", "carreras"),
        (r"\bprimeros once carreras\b", "primeras once carreras"),
        (r"\bpistas? de pura potencia\b", "circuitos sensibles a la potencia"),
        (r"\bproducir granos\b", "provocar graining"),
        (r"\bbaja carga\b", "baja carga aerodinámica"),
        (r"\bventana de uso\b", "ventana de funcionamiento"),
        (r"\bclasificación principalmente por clasificación y ritmo\b", "orden definido principalmente por la posición de salida y el ritmo de carrera"),
        (r"\bsuperficie comprometida\b", "fondo plano dañado"),
        (r"\bRussell error en la última vuelta Hamilton promovió al podio\b", "el error de Russell en la última vuelta permitió a Hamilton subir al podio"),
        (r"\bpaso real\b", "ritmo real"),
        (r"\basaltos por set\b", "vueltas por juego de neumáticos"),
        (r"\bdoble McLaren\b", "doblete de McLaren"),
        (r"\bponchaduras?\b", "pinchazos"),
        (r"\b(?:la|una) undercut\b", "el undercut"),
        (r"\b(?:la|una) stint\b", "el stint"),
        (r"\bdurante tod[ao] el stint\b", "durante todo el stint"),
        (r"\ba abandono\b", "el abandono"),
        (r"\búltimos tres combates\b", "últimas tres carreras"),
        (r"\bNo hay F1 muestras recientes en la pista\b", "No hay muestras recientes de F1 en este circuito"),
        (r"\bImagen individual de neutro/variable\b", "Balance individual neutro o variable"),
        (r"\bMarco neutral\b", "Contexto neutral"),
        (r"\b(?:Start|Al empezar|Al principio), PU fiabilidad\b", "En la salida, la fiabilidad de la PU"),
        (r"\bdos registros\b", "dos paradas"),
        (r"\bposición en la vía\b", "posición en pista"),
        (r"\bcualificación\b", "clasificación"),
        (r"\bpreguntar más a los neumáticos\b", "exigir más a los neumáticos"),
        (r"\bEl coche mantuvo los neumáticos activos\b", "El coche preservó los neumáticos"),
        (r"\bLa elección oportuna los neumáticos intermedios\b", "La elección oportuna de los neumáticos intermedios"),
        (r"\bgraining delantera\b", "graining delantero"),
        (r"\b(?:el\s+)?(?:El neumático\s+)+Hard suele\b", "el neumático Hard suele"),
        (r"(?<!neumático )\bHard suele\b", "el neumático Hard suele"),
        (r"\bla graining fue limitada\b", "el graining fue limitado"),
        (r"\bgranado fue limitado\b", "graining fue limitado"),
        (r"\bCuidado con las circuitos\b", "Atención a los circuitos"),
        (r"\blos McLaren\b", "los coches de McLaren"),
        (r"\b(?:La|la) abandono\b", "El abandono"),
        (r"\bde El abandono\b", "del abandono"),
        (r"\btras El abandono\b", "tras el abandono"),
        (r"\bdos de los últimas tres carreras\b", "dos de las últimas tres carreras"),
        (r"\bremontadas por pases\b", "remontadas"),
        (r"\bregresos? de montaña\b", "remontadas"),
        (r"\bVerstappen, Piastri y Norris ritmo y estrategia convertidos\b", "Verstappen, Piastri y Norris convirtieron el ritmo y la estrategia en resultado"),
        (r"\b(?:obstáculo|interferencia) en pit lane\b", "impeding en el pit lane"),
        (r"\bEl asfalto y la evolución de las pistas son desconocidos\b", "El asfalto y la evolución de la pista son incógnitas"),
        (r"\bgrano delantero\b", "graining delantero"),
        (r"\bLa experiencia de los pilotos es la principal ayuda\b", "La experiencia de los pilotos es la principal baza"),
        (r"\bEn la salida, la fiabilidad de la PU y posición\b", "En la salida, la fiabilidad de la PU y la posición"),
        (r"\bEl mantenimiento y recuperación de posición sugieren una gestión global eficaz\b", "Mantener y recuperar posiciones indica una gestión globalmente eficaz"),
        (r"\bLa degradación suele ser limitada y se pierde tiempo en boxes: normalmente se prefiere una sola parada, pero el delantero izquierdo puede convertirse en el límite\b", "La degradación suele ser limitada y la pérdida de tiempo en boxes elevada: normalmente se prefiere una sola parada, pero el neumático delantero izquierdo puede convertirse en el factor limitante"),
        (r"\bFavorito casi en todas partes\b", "El equipo parte como favorito en casi todos los circuitos"),
        (r"\bHistóricamente complicado, el asfalto, el calor y la humedad transfieren\b", "El asfalto es históricamente exigente; el calor y la humedad transfieren"),
        (r"\bcuentan más que degradación pura\b", "cuentan más que la degradación pura"),
        (r"\bA menudo una alta degradación térmica\b", "Degradación térmica a menudo elevada"),
        (r"\bSoft y Medium pueden funcionar bien\b", "Los compuestos Soft y Medium pueden funcionar bien"),
        (r"\bLa degradación cronométrica\b", "La pérdida de rendimiento por vuelta"),
        (r"\bla causa quede aislada en los neumáticos\b", "la causa se atribuya únicamente a los neumáticos"),
        (r"\bEl frío y la poca adherencia\b", "El frío y el bajo agarre"),
        (r"\blaundercut\b", "el undercut"),
        (r"\. el undercut\b", ". El undercut"),
        (r"\bEl abandono fue causada\b", "El abandono fue causado"),
        (r"\bprovocó El abandono\b", "provocó el abandono"),
    ),
    "de": (
        (r"\bersten elf Spielen\b", "ersten elf Rennen"),
        (r"\bSpiele?\b", "Rennen"),
        (r"\bPower-Tracks\b", "leistungsabhängigen Strecken"),
        (r"\bKörnerbildung\b", "Graining"),
        (r"\bPiloten\b", "Fahrer"),
        (r"\bgeringe Last\b", "geringen Abtrieb"),
        (r"\bNutzungsfenster\b", "Arbeitsfenster"),
        (r"\bMittleres Selbstbewusstsein\b", "Mittlere Konfidenz"),
        (r"\bWenig Selbstvertrauen\b", "Geringe Konfidenz"),
        (r"\bköniglichen Schritt\b", "echte Rennpace"),
        (r"\bRunden pro Satz\b", "Runden pro Reifensatz"),
        (r"\bdoppelte McLaren\b", "McLaren-Doppelsieg"),
        (r"\bDoppel-McLaren\b", "McLaren-Doppelsieg"),
        (r"\bHaltestelle\b", "Boxenstopp"),
        (r"\bKlassifikation\b", "Ergebnis"),
        (r"\bSpiels\b", "Rennens"),
        (r"\bhistorischen Motorrads\b", "historischen Daten"),
        (r"\bSchlittschuhs?\b", "Unterbodenplanke"),
        (r"\bStraftritte?\b", "Strafen"),
        (r"\bStraftritt\b", "Strafe"),
        (r"\bundercut zu \.\b", "einen Undercut zu versuchen."),
        (r"\bKontaktaufnahmen\b", "Kontakte"),
        (r"\bder undercut\b", "der Undercut"),
        (r"\bdie undercut\b", "der Undercut"),
        (r"\bdem undercut\b", "dem Undercut"),
        (r"\bim pit lane\b", "in der Boxengasse"),
        (r"\b(?:von|aus) pit lane\b", "aus der Boxengasse"),
        (r"\bpit lane\b", "Boxengasse"),
        (r"\bZwischen(?:strecken|produkte|fahrer)\b", "Intermediates"),
        (r"\bPodiumsbereich\b", "Podiumskampf"),
        (r"\bregelmäßiges Tempo\b", "konstantes Tempo"),
        (r"\bGeschwindigkeitsfehler\b", "Geschwindigkeitsverstoß"),
        (r"\bSportmanagement\b", "strategische Ausführung"),
        (r"\bauthentische Geschwindigkeit\b", "echte Rennpace"),
        (r"\bRahmen neutral\b", "neutraler Kontext"),
        (r"\b(?:Power Unit|Antriebseinheit) die Zuverlässigkeit\b", "die Zuverlässigkeit der Power Unit"),
        (r"\bkeine Reifen ausgefallen\b", "keine reifenbedingten Ausfälle"),
        (r"\bguten Traktion\b", "gute Traktion"),
        (r"\b(?:gewinkelten|schrägen) Kurven\b", "überhöhten Kurven"),
        (r"\bUnterstützungswechseln\b", "Richtungswechseln"),
        (r"\btechnisches Blatt\b", "technische Spezifikation"),
        (r"\bDie rechtzeitige Auswahl der Intermediates\b", "Die rechtzeitige Wahl der Intermediates"),
        (r"\bein einzelner Halt\b", "ein einziger Boxenstopp"),
        (r"\bder Unterbodenplanke\b", "der Unterbodenplanke"),
        (r"\bDie Reifenabbau\b", "Der Reifenabbau"),
        (r"\breine Reifenabbau\b", "reinen Reifenabbau"),
        (r"\bKeine F1 aktuellen Proben auf der Strecke\b", "Keine aktuellen F1-Daten für diese Strecke"),
        (r"\bNeutrales/variables Einzelbild\b", "Neutrales oder wechselhaftes individuelles Bild"),
        (r"\bDas Halten der Position und die Wiederherstellung\b", "Das Halten der Position und das Aufholen"),
        (r"\b(?:Gute jüngste|Guter kürzlicher) Reifenabbau\b", "In letzter Zeit gut kontrollierter Reifenabbau"),
        (r"\bBalancefenster und Zuverlässigkeit PU Risiken (?:bestehen|bleiben bestehen)\b", "Risiken beim Balancefenster und bei der Zuverlässigkeit der PU bleiben bestehen"),
        (r"\bNeutraler Rahmen\b", "Neutraler Kontext"),
        (r"\bSei vorsichtig bei\b", "Vorsicht auf"),
        (r"\bDie Erfahrung der Fahrer ist die wichtigste Hilfe\b", "Die Erfahrung der Fahrer ist die wichtigste Stärke"),
        (r"\bHauptgrenze\b", "Hauptlimit"),
        (r"\bnach (?:dem )?upgrade\b", "nach dem Upgrade"),
        (r"\bStart, PU Zuverlässigkeit\b", "Start, PU-Zuverlässigkeit"),
        (r"\bchronometrische Degradierung\b", "Rundenzeitabbau"),
        (r"\bder Hard ist oft die Referenz\b", "der Hard-Reifen ist oft die Referenz"),
        (r"\bKörnung\b", "Graining"),
        (r"\bStint Grenzen\b", "Stint-Grenzen"),
        (r"\bwarm-up\b", "Aufwärmphase"),
        (r"\bÜberhol-Comebacks\b", "Aufholjagden"),
        (r"\bumgesetztes Tempo und Strategie\b", "setzten ihr Tempo und ihre Strategie in Ergebnisse um"),
        (r"\bNeutrales oder wechselhaftes individuelles Bild\b", "Neutrale oder wechselhafte individuelle Bilanz"),
        (r"\bDer Reifenabbau ist oft begrenzt und die Zeit in den Boxen verloren: Ein einzelner Stopp wird normalerweise bevorzugt, aber der vordere linke Stopp kann die Grenze sein\b", "Der Reifenabbau ist häufig begrenzt und der Zeitverlust in der Boxengasse hoch: Normalerweise wird ein einziger Stopp bevorzugt, aber der linke Vorderreifen kann zum limitierenden Faktor werden"),
        (r"\bFavorit fast überall\b", "Auf fast allen Strecken ein Favorit"),
        (r"\bDie Bewertung kann nicht individualisiert werden\b", "Eine individuelle Bewertung ist nicht möglich"),
        (r"\bDie Reifenabbau ist normalerweise gering\b", "Der Reifenabbau ist normalerweise gering"),
        (r"\bDie Schwierigkeit besteht darin, beim Bremsen Temperatur und Selbstvertrauen zu halten\b", "Die Herausforderung besteht darin, Reifentemperatur und Vertrauen beim Bremsen zu erhalten"),
        (r"\bNicht sehr abrasive Oberfläche, aber\b", "Wenig abrasive Oberfläche, aber"),
        (r"\bDie Position auf der Strecke und ein stabiles Fenster zählen mehr als reinen Reifenabbau\b", "Die Position auf der Strecke und ein stabiles Arbeitsfenster zählen mehr als der reine Reifenabbau"),
        (r"\bUnebenheiten und gemischte Lasten können auf zwei Stopps zusteuern\b", "Unebenheiten und gemischte Lasten können eine Zweistoppstrategie begünstigen"),
        (r"\bDer Reifenabbau wird oft reduziert\b", "Der Reifenabbau ist häufig gering"),
        (r"\bSoft und Medium funktionieren gut\b", "Die Soft- und Medium-Reifen funktionieren gut"),
        (r"\bStart, PU-Zuverlässigkeit und Qualifikationsposition\b", "Startphase, PU-Zuverlässigkeit und Qualifyingposition"),
        (r"\bDie Ergebnisse deuten auf Schwierigkeiten oder Positionsverlust hin, aber Unfälle und das Auto verhindern, dass die Ursache in den Reifen isoliert wird\b", "Die Ergebnisse deuten auf Schwierigkeiten oder Positionsverluste hin, doch Unfälle und das Auto verhindern, dass die Ursache allein den Reifen zugeschrieben werden kann"),
        (r"\bDie Gesamtleistung bleibt die Hauptlimit\b", "Die Gesamtleistung bleibt das Hauptlimit"),
        (r"\bmehr als der reinen Reifenabbau\b", "mehr als der reine Reifenabbau"),
        (r"\bDie Rundenzeitabbau\b", "Der Rundenzeitabbau"),
        (r"\bEpisoden\b", "Zwischenfälle"),
        (r"\bzwei der letzten drei Rennen abgesagt haben\b", "zwei der letzten drei Rennen zunichtegemacht haben"),
        (r"\bderundercut\b", "der Undercut"),
    ),
}

TRADUZIONI_ESATTE = {
    "American": {
        "it": "Statunitense", "en": "American", "fr": "Américaine",
        "pt": "Norte-americana", "es": "Estadounidense", "de": "US-amerikanisch",
    },
    "Argentine": {
        "it": "Argentina", "en": "Argentine", "fr": "Argentine",
        "pt": "Argentina", "es": "Argentina", "de": "Argentinisch",
    },
    "Italian": {
        "it": "Italiana", "en": "Italian", "fr": "Italienne",
        "pt": "Italiana", "es": "Italiana", "de": "Italienisch",
    },
    "British": {
        "it": "Britannica", "en": "British", "fr": "Britannique",
        "pt": "Britânica", "es": "Británica", "de": "Britisch",
    },
    "French": {
        "it": "Francese", "en": "French", "fr": "Française",
        "pt": "Francesa", "es": "Francesa", "de": "Französisch",
    },
    "Spanish": {
        "it": "Spagnola", "en": "Spanish", "fr": "Espagnole",
        "pt": "Espanhola", "es": "Española", "de": "Spanisch",
    },
    "Dutch": {
        "it": "Olandese", "en": "Dutch", "fr": "Néerlandaise",
        "pt": "Neerlandesa", "es": "Neerlandesa", "de": "Niederländisch",
    },
    "Canadian": {
        "it": "Canadese", "en": "Canadian", "fr": "Canadienne",
        "pt": "Canadiana", "es": "Canadiense", "de": "Kanadisch",
    },
    "Thai": {
        "it": "Thailandese", "en": "Thai", "fr": "Thaïlandaise",
        "pt": "Tailandesa", "es": "Tailandesa", "de": "Thailändisch",
    },
    "Brazilian": {
        "it": "Brasiliana", "en": "Brazilian", "fr": "Brésilienne",
        "pt": "Brasileira", "es": "Brasileña", "de": "Brasilianisch",
    },
    "German": {
        "it": "Tedesca", "en": "German", "fr": "Allemande",
        "pt": "Alemã", "es": "Alemana", "de": "Deutsch",
    },
    "Australian": {
        "it": "Australiana", "en": "Australian", "fr": "Australienne",
        "pt": "Australiana", "es": "Australiana", "de": "Australisch",
    },
    "Austrian": {
        "it": "Austriaca", "en": "Austrian", "fr": "Autrichienne",
        "pt": "Austríaca", "es": "Austríaca", "de": "Österreichisch",
    },
    "Finnish": {
        "it": "Finlandese", "en": "Finnish", "fr": "Finlandaise",
        "pt": "Finlandesa", "es": "Finlandesa", "de": "Finnisch",
    },
    "Mexican": {
        "it": "Messicana", "en": "Mexican", "fr": "Mexicaine",
        "pt": "Mexicana", "es": "Mexicana", "de": "Mexikanisch",
    },
    "Monegasque": {
        "it": "Monegasca", "en": "Monegasque", "fr": "Monégasque",
        "pt": "Monegasca", "es": "Monegasca", "de": "Monegassisch",
    },
    "New Zealander": {
        "it": "Neozelandese", "en": "New Zealander", "fr": "Néo-zélandaise",
        "pt": "Neozelandesa", "es": "Neozelandesa", "de": "Neuseeländisch",
    },
    "Japanese": {
        "it": "Giapponese", "en": "Japanese", "fr": "Japonaise",
        "pt": "Japonesa", "es": "Japonesa", "de": "Japanisch",
    },
}

TRADUZIONI_GARE_ESATTE = {
    "Gran Premio d'Olanda": {
        "it": "Gran Premio d'Olanda", "en": "Dutch Grand Prix",
        "fr": "Grand Prix des Pays-Bas", "pt": "Grande Prémio dos Países Baixos",
        "es": "Gran Premio de los Países Bajos", "de": "Großer Preis der Niederlande",
    },
    "Gran Premio d'Italia": {
        "it": "Gran Premio d'Italia", "en": "Italian Grand Prix",
        "fr": "Grand Prix d'Italie", "pt": "Grande Prémio de Itália",
        "es": "Gran Premio de Italia", "de": "Großer Preis von Italien",
    },
    "Gran Premio di Spagna": {
        "it": "Gran Premio di Spagna", "en": "Spanish Grand Prix",
        "fr": "Grand Prix d'Espagne", "pt": "Grande Prémio de Espanha",
        "es": "Gran Premio de España", "de": "Großer Preis von Spanien",
    },
    "Gran Premio dell'Azerbaigian": {
        "it": "Gran Premio dell'Azerbaigian", "en": "Azerbaijan Grand Prix",
        "fr": "Grand Prix d'Azerbaïdjan", "pt": "Grande Prémio do Azerbaijão",
        "es": "Gran Premio de Azerbaiyán", "de": "Großer Preis von Aserbaidschan",
    },
    "Gran Premio del Bahrein": {
        "it": "Gran Premio del Bahrein", "en": "Bahrain Grand Prix",
        "fr": "Grand Prix de Bahreïn", "pt": "Grande Prémio do Barém",
        "es": "Gran Premio de Baréin", "de": "Großer Preis von Bahrain",
    },
    "Gran Premio di Singapore": {
        "it": "Gran Premio di Singapore", "en": "Singapore Grand Prix",
        "fr": "Grand Prix de Singapour", "pt": "Grande Prémio de Singapura",
        "es": "Gran Premio de Singapur", "de": "Großer Preis von Singapur",
    },
    "Gran Premio degli Stati Uniti": {
        "it": "Gran Premio degli Stati Uniti", "en": "United States Grand Prix",
        "fr": "Grand Prix des États-Unis", "pt": "Grande Prémio dos Estados Unidos",
        "es": "Gran Premio de Estados Unidos", "de": "Großer Preis der USA",
    },
    "Gran Premio di Città del Messico": {
        "it": "Gran Premio di Città del Messico", "en": "Mexico City Grand Prix",
        "fr": "Grand Prix de Mexico", "pt": "Grande Prémio da Cidade do México",
        "es": "Gran Premio de Ciudad de México", "de": "Großer Preis von Mexiko-Stadt",
    },
    "Gran Premio di San Paolo": {
        "it": "Gran Premio di San Paolo", "en": "São Paulo Grand Prix",
        "fr": "Grand Prix de São Paulo", "pt": "Grande Prémio de São Paulo",
        "es": "Gran Premio de São Paulo", "de": "Großer Preis von São Paulo",
    },
    "Gran Premio di Las Vegas": {
        "it": "Gran Premio di Las Vegas", "en": "Las Vegas Grand Prix",
        "fr": "Grand Prix de Las Vegas", "pt": "Grande Prémio de Las Vegas",
        "es": "Gran Premio de Las Vegas", "de": "Großer Preis von Las Vegas",
    },
    "Gran Premio del Qatar": {
        "it": "Gran Premio del Qatar", "en": "Qatar Grand Prix",
        "fr": "Grand Prix du Qatar", "pt": "Grande Prémio do Catar",
        "es": "Gran Premio de Catar", "de": "Großer Preis von Katar",
    },
    "Gran Premio di Abu Dhabi": {
        "it": "Gran Premio di Abu Dhabi", "en": "Abu Dhabi Grand Prix",
        "fr": "Grand Prix d'Abou Dabi", "pt": "Grande Prémio de Abu Dhabi",
        "es": "Gran Premio de Abu Dabi", "de": "Großer Preis von Abu Dhabi",
    },
    "Olanda": {"it": "Olanda", "en": "Netherlands", "fr": "Pays-Bas", "pt": "Países Baixos", "es": "Países Bajos", "de": "Niederlande"},
    "Italia": {"it": "Italia", "en": "Italy", "fr": "Italie", "pt": "Itália", "es": "Italia", "de": "Italien"},
    "Spagna": {"it": "Spagna", "en": "Spain", "fr": "Espagne", "pt": "Espanha", "es": "España", "de": "Spanien"},
    "Azerbaigian": {"it": "Azerbaigian", "en": "Azerbaijan", "fr": "Azerbaïdjan", "pt": "Azerbaijão", "es": "Azerbaiyán", "de": "Aserbaidschan"},
    "Malesia": {"it": "Malesia", "en": "Malaysia", "fr": "Malaisie", "pt": "Malásia", "es": "Malasia", "de": "Malaysia"},
    "Singapore": {"it": "Singapore", "en": "Singapore", "fr": "Singapour", "pt": "Singapura", "es": "Singapur", "de": "Singapur"},
    "Stati Uniti": {"it": "Stati Uniti", "en": "United States", "fr": "États-Unis", "pt": "Estados Unidos", "es": "Estados Unidos", "de": "Vereinigte Staaten"},
    "Messico": {"it": "Messico", "en": "Mexico", "fr": "Mexique", "pt": "México", "es": "México", "de": "Mexiko"},
    "Brasile": {"it": "Brasile", "en": "Brazil", "fr": "Brésil", "pt": "Brasil", "es": "Brasil", "de": "Brasilien"},
    "Qatar": {"it": "Qatar", "en": "Qatar", "fr": "Qatar", "pt": "Catar", "es": "Catar", "de": "Katar"},
    "Emirati Arabi Uniti": {"it": "Emirati Arabi Uniti", "en": "United Arab Emirates", "fr": "Émirats arabes unis", "pt": "Emirados Árabes Unidos", "es": "Emiratos Árabes Unidos", "de": "Vereinigte Arabische Emirate"},
    "OLANDA — ZANDVOORT": {"it": "OLANDA — ZANDVOORT", "en": "NETHERLANDS — ZANDVOORT", "fr": "PAYS-BAS — ZANDVOORT", "pt": "PAÍSES BAIXOS — ZANDVOORT", "es": "PAÍSES BAJOS — ZANDVOORT", "de": "NIEDERLANDE — ZANDVOORT"},
    "ITALIA — MONZA": {"it": "ITALIA — MONZA", "en": "ITALY — MONZA", "fr": "ITALIE — MONZA", "pt": "ITÁLIA — MONZA", "es": "ITALIA — MONZA", "de": "ITALIEN — MONZA"},
    "SPAGNA — MADRING": {"it": "SPAGNA — MADRING", "en": "SPAIN — MADRING", "fr": "ESPAGNE — MADRING", "pt": "ESPANHA — MADRING", "es": "ESPAÑA — MADRING", "de": "SPANIEN — MADRING"},
    "AZERBAIGIAN — BAKU": {"it": "AZERBAIGIAN — BAKU", "en": "AZERBAIJAN — BAKU", "fr": "AZERBAÏDJAN — BAKOU", "pt": "AZERBAIJÃO — BAKU", "es": "AZERBAIYÁN — BAKÚ", "de": "ASERBAIDSCHAN — BAKU"},
    "GP BAHREIN — SEPANG": {"it": "GP BAHREIN — SEPANG", "en": "BAHRAIN GP — SEPANG", "fr": "GP DE BAHREÏN — SEPANG", "pt": "GP DO BARÉM — SEPANG", "es": "GP DE BARÉIN — SEPANG", "de": "BAHRAIN-GP — SEPANG"},
    "SINGAPORE — MARINA BAY": {"it": "SINGAPORE — MARINA BAY", "en": "SINGAPORE — MARINA BAY", "fr": "SINGAPOUR — MARINA BAY", "pt": "SINGAPURA — MARINA BAY", "es": "SINGAPUR — MARINA BAY", "de": "SINGAPUR — MARINA BAY"},
    "USA — AUSTIN": {"it": "USA — AUSTIN", "en": "USA — AUSTIN", "fr": "ÉTATS-UNIS — AUSTIN", "pt": "ESTADOS UNIDOS — AUSTIN", "es": "ESTADOS UNIDOS — AUSTIN", "de": "USA — AUSTIN"},
    "MESSICO — CITTÀ DEL MESSICO": {"it": "MESSICO — CITTÀ DEL MESSICO", "en": "MEXICO — MEXICO CITY", "fr": "MEXIQUE — MEXICO", "pt": "MÉXICO — CIDADE DO MÉXICO", "es": "MÉXICO — CIUDAD DE MÉXICO", "de": "MEXIKO — MEXIKO-STADT"},
    "BRASILE — INTERLAGOS": {"it": "BRASILE — INTERLAGOS", "en": "BRAZIL — INTERLAGOS", "fr": "BRÉSIL — INTERLAGOS", "pt": "BRASIL — INTERLAGOS", "es": "BRASIL — INTERLAGOS", "de": "BRASILIEN — INTERLAGOS"},
    "USA — LAS VEGAS": {"it": "USA — LAS VEGAS", "en": "USA — LAS VEGAS", "fr": "ÉTATS-UNIS — LAS VEGAS", "pt": "ESTADOS UNIDOS — LAS VEGAS", "es": "ESTADOS UNIDOS — LAS VEGAS", "de": "USA — LAS VEGAS"},
    "QATAR — LUSAIL": {"it": "QATAR — LUSAIL", "en": "QATAR — LUSAIL", "fr": "QATAR — LUSAIL", "pt": "CATAR — LUSAIL", "es": "CATAR — LUSAIL", "de": "KATAR — LUSAIL"},
    "ABU DHABI — YAS MARINA": {"it": "ABU DHABI — YAS MARINA", "en": "ABU DHABI — YAS MARINA", "fr": "ABOU DABI — YAS MARINA", "pt": "ABU DHABI — YAS MARINA", "es": "ABU DABI — YAS MARINA", "de": "ABU DHABI — YAS MARINA"},
}

TRADUZIONI_ESATTE.update(TRADUZIONI_GARE_ESATTE)


# I riepiloghi storici sono testi editoriali brevi ma densi di nessi causali.
# Azure tendeva a tradurre letteralmente espressioni come ``vinse per passo`` o
# ``rimonto P17-P5``. Manteniamo quindi qui la versione revisionata, legata al
# testo italiano sorgente: se l'editoriale cambia, la chiave non corrisponde piu
# e il nuovo contenuto torna automaticamente nel normale flusso di traduzione.
TRADUZIONI_CONTESTI_STORICI = {
    "2023: Pioggia intermittente e bandiera rossa alterarono strategie e classifica; Gasly ereditò il podio anche per la penalità a Pérez.\n2024: Gara asciutta a una sosta: Norris vinse con passo netto; Leclerc salì sul podio con undercut e difesa.\n2025: Tre Safety Car; il ritiro di Norris dal P2 promosse Hadjar sul podio, comunque qualificato P4 e molto solido.": {
        "it": "2023: Pioggia intermittente e bandiera rossa alterarono strategie e classifica; Gasly ereditò il podio anche per la penalità a Pérez.\n2024: Gara asciutta a una sosta: Norris vinse con passo netto; Leclerc salì sul podio con undercut e difesa.\n2025: Tre Safety Car; il ritiro di Norris dal P2 promosse Hadjar sul podio, comunque qualificato P4 e molto solido.",
        "en": "2023: Intermittent rain and a red flag reshaped the strategies and the classification; Gasly also inherited a podium because of Pérez's penalty.\n2024: A dry one-stop race: Norris won with clearly superior pace; Leclerc reached the podium through an undercut and strong defence.\n2025: Three Safety Car periods; Norris's retirement from P2 promoted Hadjar to the podium, although Hadjar had already qualified P4 and driven a very solid race.",
        "fr": "2023 : La pluie intermittente et un drapeau rouge ont bouleversé les stratégies et le classement ; Gasly a également hérité d'un podium grâce à la pénalité infligée à Pérez.\n2024 : Course sèche à un seul arrêt : Norris s'est imposé avec un rythme nettement supérieur ; Leclerc est monté sur le podium grâce à un undercut et à une défense solide.\n2025 : Trois interventions de la Safety Car ; l'abandon de Norris alors qu'il occupait la P2 a offert le podium à Hadjar, qui s'était toutefois qualifié P4 et avait réalisé une course très solide.",
        "pt": "2023: A chuva intermitente e uma bandeira vermelha alteraram as estratégias e a classificação; Gasly também herdou um lugar no pódio devido à penalização de Pérez.\n2024: Corrida seca com uma só paragem: Norris venceu com um ritmo claramente superior; Leclerc chegou ao pódio graças a um undercut e a uma defesa sólida.\n2025: Três períodos de Safety Car; o abandono de Norris quando seguia em P2 promoveu Hadjar ao pódio, embora este já tivesse partido de P4 e realizado uma corrida muito sólida.",
        "es": "2023: La lluvia intermitente y una bandera roja alteraron las estrategias y la clasificación; Gasly también heredó un puesto en el podio por la penalización a Pérez.\n2024: Carrera en seco a una sola parada: Norris ganó con un ritmo claramente superior; Leclerc subió al podio gracias a un undercut y a una sólida defensa.\n2025: Tres periodos de Safety Car; el abandono de Norris cuando rodaba P2 promovió a Hadjar al podio, aunque este ya había clasificado P4 y había completado una carrera muy sólida.",
        "de": "2023: Wechselhafter Regen und eine rote Flagge veränderten Strategien und Ergebnis; auch Gasly erbte wegen der Strafe gegen Pérez einen Podestplatz.\n2024: Trockenes Einstopp-Rennen: Norris gewann mit klar überlegenem Tempo; Leclerc erreichte das Podium durch einen Undercut und eine starke Verteidigung.\n2025: Drei Safety-Car-Phasen; der Ausfall des auf P2 liegenden Norris brachte Hadjar aufs Podium, wobei dieser bereits P4 qualifiziert und ein sehr starkes Rennen gefahren war.",
    },
    "2023: Sainz partì in pole, ma Red Bull aveva più passo; Verstappen e Pérez lo superarono in pista.\n2024: Leclerc vinse con una coraggiosa sosta unica, mentre McLaren scelse due soste temendo il degrado.\n2025: Verstappen vinse con margine; degrado quasi nullo e singola sosta nettamente favorita.": {
        "it": "2023: Sainz partì in pole, ma Red Bull aveva più passo; Verstappen e Pérez lo superarono in pista.\n2024: Leclerc vinse con una coraggiosa sosta unica, mentre McLaren scelse due soste temendo il degrado.\n2025: Verstappen vinse con margine; degrado quasi nullo e singola sosta nettamente favorita.",
        "en": "2023: Sainz started from pole, but Red Bull had stronger race pace; Verstappen and Pérez overtook him on track.\n2024: Leclerc won with a bold one-stop strategy, while McLaren chose two stops because it feared tyre degradation.\n2025: Verstappen won by a comfortable margin; tyre degradation was almost nonexistent and a one-stop strategy was clearly favoured.",
        "fr": "2023 : Sainz est parti en pole, mais Red Bull avait un meilleur rythme de course ; Verstappen et Pérez l'ont dépassé en piste.\n2024 : Leclerc s'est imposé avec une audacieuse stratégie à un seul arrêt, tandis que McLaren en a choisi deux par crainte de la dégradation des pneus.\n2025 : Verstappen s'est imposé avec une nette avance ; la dégradation des pneus était presque inexistante et la stratégie à un seul arrêt était clairement la plus avantageuse.",
        "pt": "2023: Sainz partiu da pole, mas a Red Bull tinha melhor ritmo de corrida; Verstappen e Pérez ultrapassaram-no em pista.\n2024: Leclerc venceu com uma arrojada estratégia de uma só paragem, enquanto a McLaren optou por duas por receio da degradação dos pneus.\n2025: Verstappen venceu com uma margem confortável; a degradação dos pneus foi quase inexistente e a estratégia de uma só paragem foi claramente a mais favorável.",
        "es": "2023: Sainz salió desde la pole, pero Red Bull tenía mejor ritmo de carrera; Verstappen y Pérez lo adelantaron en pista.\n2024: Leclerc ganó con una atrevida estrategia a una sola parada, mientras McLaren eligió dos por temor a la degradación de los neumáticos.\n2025: Verstappen ganó con un amplio margen; la degradación de los neumáticos fue casi inexistente y la estrategia a una parada resultó claramente favorecida.",
        "de": "2023: Sainz startete von der Pole, aber Red Bull hatte die bessere Rennpace; Verstappen und Pérez überholten ihn auf der Strecke.\n2024: Leclerc gewann mit einer mutigen Einstoppstrategie, während McLaren aus Sorge vor Reifenabbau zwei Stopps wählte.\n2025: Verstappen gewann mit komfortablem Vorsprung; der Reifenabbau war nahezu nicht vorhanden und eine Einstoppstrategie klar im Vorteil.",
    },
    "2023: NON CORSO: il Madring non era nel calendario F1.\n2024: NON CORSO: il Madring non era nel calendario F1.\n2025: NON CORSO: il Madring non era nel calendario F1.": {
        "it": "2023: NON CORSO: il Madring non era nel calendario F1.\n2024: NON CORSO: il Madring non era nel calendario F1.\n2025: NON CORSO: il Madring non era nel calendario F1.",
        "en": "2023: NOT HELD: Madring was not on the F1 calendar.\n2024: NOT HELD: Madring was not on the F1 calendar.\n2025: NOT HELD: Madring was not on the F1 calendar.",
        "fr": "2023 : NON DISPUTÉ : le Madring ne figurait pas au calendrier de la F1.\n2024 : NON DISPUTÉ : le Madring ne figurait pas au calendrier de la F1.\n2025 : NON DISPUTÉ : le Madring ne figurait pas au calendrier de la F1.",
        "pt": "2023: NÃO DISPUTADO: o Madring não fazia parte do calendário da F1.\n2024: NÃO DISPUTADO: o Madring não fazia parte do calendário da F1.\n2025: NÃO DISPUTADO: o Madring não fazia parte do calendário da F1.",
        "es": "2023: NO DISPUTADO: el Madring no formaba parte del calendario de F1.\n2024: NO DISPUTADO: el Madring no formaba parte del calendario de F1.\n2025: NO DISPUTADO: el Madring no formaba parte del calendario de F1.",
        "de": "2023: NICHT AUSGETRAGEN: Madring war nicht Teil des F1-Kalenders.\n2024: NICHT AUSGETRAGEN: Madring war nicht Teil des F1-Kalenders.\n2025: NICHT AUSGETRAGEN: Madring war nicht Teil des F1-Kalenders.",
    },
    "2023: Pérez beneficiò della Safety Car dopo la sosta anticipata di Verstappen, poi mantenne passo e controllo.\n2024: Il contatto Pérez-Sainz nel finale consegnò a Russell un P3 fortuito; Norris rimontò P15-P4.\n2025: Verstappen dominò; Piastri uscì al primo giro e Sainz trasformò la P2 in griglia in un meritato podio Williams.": {
        "it": "2023: Pérez beneficiò della Safety Car dopo la sosta anticipata di Verstappen, poi mantenne passo e controllo.\n2024: Il contatto Pérez-Sainz nel finale consegnò a Russell un P3 fortuito; Norris rimontò P15-P4.\n2025: Verstappen dominò; Piastri uscì al primo giro e Sainz trasformò la P2 in griglia in un meritato podio Williams.",
        "en": "2023: Pérez benefited from the Safety Car after Verstappen's early stop, then maintained the required pace and remained in control.\n2024: The late Pérez-Sainz collision handed Russell a fortunate P3; Norris recovered from P15 to P4.\n2025: Verstappen dominated; Piastri retired on the opening lap and Sainz converted P2 on the grid into a well-deserved podium for Williams.",
        "fr": "2023 : Pérez a profité de la Safety Car après l'arrêt anticipé de Verstappen, puis a conservé le rythme nécessaire et le contrôle de la course.\n2024 : L'accrochage entre Pérez et Sainz en fin de course a offert une P3 chanceuse à Russell ; Norris est remonté de la P15 à la P4.\n2025 : Verstappen a dominé ; Piastri a abandonné dès le premier tour et Sainz a transformé sa P2 sur la grille en un podium amplement mérité pour Williams.",
        "pt": "2023: Pérez beneficiou da Safety Car após a paragem antecipada de Verstappen e depois manteve o ritmo necessário e o controlo da corrida.\n2024: A colisão entre Pérez e Sainz no final entregou a Russell uma afortunada P3; Norris recuperou de P15 para P4.\n2025: Verstappen dominou; Piastri abandonou na primeira volta e Sainz transformou a P2 na grelha num pódio plenamente merecido para a Williams.",
        "es": "2023: Pérez se benefició del Safety Car tras la parada temprana de Verstappen y después mantuvo el ritmo necesario y el control de la carrera.\n2024: El choque entre Pérez y Sainz en el tramo final entregó a Russell una afortunada P3; Norris remontó de P15 a P4.\n2025: Verstappen dominó; Piastri abandonó en la primera vuelta y Sainz convirtió la P2 de la parrilla en un merecido podio para Williams.",
        "de": "2023: Pérez profitierte nach Verstappens frühem Stopp vom Safety Car und hielt anschließend das nötige Tempo sowie die Kontrolle über das Rennen.\n2024: Die späte Kollision zwischen Pérez und Sainz bescherte Russell einen glücklichen P3; Norris kämpfte sich von P15 auf P4 vor.\n2025: Verstappen dominierte; Piastri schied in der ersten Runde aus und Sainz verwandelte Startplatz P2 in ein hochverdientes Podium für Williams.",
    },
    "2023: NON CORSO: Sepang non era nel calendario F1.\n2024: NON CORSO: Sepang non era nel calendario F1.\n2025: NON CORSO: Sepang non era nel calendario F1.": {
        "it": "2023: NON CORSO: Sepang non era nel calendario F1.\n2024: NON CORSO: Sepang non era nel calendario F1.\n2025: NON CORSO: Sepang non era nel calendario F1.",
        "en": "2023: NOT HELD: Sepang was not on the F1 calendar.\n2024: NOT HELD: Sepang was not on the F1 calendar.\n2025: NOT HELD: Sepang was not on the F1 calendar.",
        "fr": "2023 : NON DISPUTÉ : Sepang ne figurait pas au calendrier de la F1.\n2024 : NON DISPUTÉ : Sepang ne figurait pas au calendrier de la F1.\n2025 : NON DISPUTÉ : Sepang ne figurait pas au calendrier de la F1.",
        "pt": "2023: NÃO DISPUTADO: Sepang não fazia parte do calendário da F1.\n2024: NÃO DISPUTADO: Sepang não fazia parte do calendário da F1.\n2025: NÃO DISPUTADO: Sepang não fazia parte do calendário da F1.",
        "es": "2023: NO DISPUTADO: Sepang no formaba parte del calendario de F1.\n2024: NO DISPUTADO: Sepang no formaba parte del calendario de F1.\n2025: NO DISPUTADO: Sepang no formaba parte del calendario de F1.",
        "de": "2023: NICHT AUSGETRAGEN: Sepang war nicht Teil des F1-Kalenders.\n2024: NICHT AUSGETRAGEN: Sepang war nicht Teil des F1-Kalenders.\n2025: NICHT AUSGETRAGEN: Sepang war nicht Teil des F1-Kalenders.",
    },
    "2023: Sainz controllò il ritmo e usò il DRS di Norris; l'errore di Russell all'ultimo giro promosse Hamilton sul podio.\n2024: Norris dominò; prima edizione senza neutralizzazioni e singola sosta chiaramente più rapida.\n2025: Russell vinse da una pole sorprendente; nessun ritiro, classifica soprattutto da qualifica e passo.": {
        "it": "2023: Sainz controllò il ritmo e usò il DRS di Norris; l'errore di Russell all'ultimo giro promosse Hamilton sul podio.\n2024: Norris dominò; prima edizione senza neutralizzazioni e singola sosta chiaramente più rapida.\n2025: Russell vinse da una pole sorprendente; nessun ritiro, classifica soprattutto da qualifica e passo.",
        "en": "2023: Sainz controlled the pace and used Norris's DRS; Russell's final-lap mistake promoted Hamilton to the podium.\n2024: Norris dominated; it was the first edition without a Safety Car or Virtual Safety Car, and a one-stop strategy was clearly faster.\n2025: Russell won from a surprise pole position; with no retirements, the order was determined mainly by qualifying position and race pace.",
        "fr": "2023 : Sainz a maîtrisé le rythme et utilisé le DRS de Norris ; l'erreur de Russell dans le dernier tour a permis à Hamilton de monter sur le podium.\n2024 : Norris a dominé ; il s'agissait de la première édition sans Safety Car ni Virtual Safety Car, et la stratégie à un seul arrêt était clairement la plus rapide.\n2025 : Russell s'est imposé après une pole position inattendue ; sans aucun abandon, l'ordre a surtout été déterminé par les qualifications et le rythme de course.",
        "pt": "2023: Sainz controlou o ritmo e utilizou o DRS de Norris; o erro de Russell na última volta promoveu Hamilton ao pódio.\n2024: Norris dominou; foi a primeira edição sem Safety Car nem Virtual Safety Car, e a estratégia de uma só paragem foi claramente a mais rápida.\n2025: Russell venceu após uma pole position surpreendente; sem abandonos, a ordem foi determinada sobretudo pela qualificação e pelo ritmo de corrida.",
        "es": "2023: Sainz controló el ritmo y utilizó el DRS de Norris; el error de Russell en la última vuelta promovió a Hamilton al podio.\n2024: Norris dominó; fue la primera edición sin Safety Car ni Virtual Safety Car, y la estrategia a una sola parada fue claramente la más rápida.\n2025: Russell ganó tras lograr una pole position sorprendente; sin abandonos, el orden quedó determinado principalmente por la clasificación y el ritmo de carrera.",
        "de": "2023: Sainz kontrollierte das Tempo und nutzte Norris' DRS; Russells Fehler in der letzten Runde brachte Hamilton aufs Podium.\n2024: Norris dominierte; es war die erste Austragung ohne Safety Car oder Virtual Safety Car, und eine Einstoppstrategie war eindeutig schneller.\n2025: Russell gewann nach einer überraschenden Pole-Position; da es keine Ausfälle gab, wurde die Reihenfolge vor allem durch Startposition und Rennpace bestimmt.",
    },
    "2023: Hamilton P2 e Leclerc P6 furono squalificati per usura del fondo; Norris e Sainz vennero promossi.\n2024: Ferrari ottenne una doppietta di passo; la penalità a Norris promosse Verstappen sul podio.\n2025: Verstappen dominò; Leclerc sfruttò la Soft al via e difese un podio meritato.": {
        "it": "2023: Hamilton P2 e Leclerc P6 furono squalificati per usura del fondo; Norris e Sainz vennero promossi.\n2024: Ferrari ottenne una doppietta di passo; la penalità a Norris promosse Verstappen sul podio.\n2025: Verstappen dominò; Leclerc sfruttò la Soft al via e difese un podio meritato.",
        "en": "2023: Hamilton in P2 and Leclerc in P6 were disqualified because of excessive plank wear; Norris and Sainz were promoted.\n2024: Ferrari secured a one-two through genuine pace; Norris's penalty promoted Verstappen to the podium.\n2025: Verstappen dominated; Leclerc used the Soft tyre to his advantage at the start and defended a well-deserved podium.",
        "fr": "2023 : Hamilton, P2, et Leclerc, P6, ont été disqualifiés en raison d'une usure excessive du patin du fond plat ; Norris et Sainz ont gagné des positions.\n2024 : Ferrari a signé un doublé grâce à son rythme réel ; la pénalité infligée à Norris a offert le podium à Verstappen.\n2025 : Verstappen a dominé ; Leclerc a exploité les pneus Soft au départ et défendu un podium pleinement mérité.",
        "pt": "2023: Hamilton, em P2, e Leclerc, em P6, foram desclassificados devido ao desgaste excessivo da prancha do fundo; Norris e Sainz subiram na classificação.\n2024: A Ferrari conseguiu uma dobradinha graças ao seu ritmo real; a penalização de Norris promoveu Verstappen ao pódio.\n2025: Verstappen dominou; Leclerc tirou partido dos pneus Soft no arranque e defendeu um pódio plenamente merecido.",
        "es": "2023: Hamilton, P2, y Leclerc, P6, fueron descalificados por el desgaste excesivo del patín del fondo plano; Norris y Sainz ascendieron posiciones.\n2024: Ferrari logró un doblete gracias a su ritmo real; la penalización a Norris promovió a Verstappen al podio.\n2025: Verstappen dominó; Leclerc aprovechó el neumático Soft en la salida y defendió un podio plenamente merecido.",
        "de": "2023: Hamilton auf P2 und Leclerc auf P6 wurden wegen übermäßiger Abnutzung der Unterbodenplanke disqualifiziert; Norris und Sainz rückten auf.\n2024: Ferrari erzielte aus eigener Stärke einen Doppelsieg; die Strafe gegen Norris brachte Verstappen aufs Podium.\n2025: Verstappen dominierte; Leclerc nutzte den Soft-Reifen am Start und verteidigte einen hochverdienten Podestplatz.",
    },
    "2023: Pérez uscì alla prima curva; la bandiera rossa favorì la seconda sosta di Verstappen, mentre Norris rimontò P17-P5.\n2024: Sainz vinse per passo; Verstappen ricevette due penalità da dieci secondi.\n2025: Norris dominò; una VSC tardiva aiutò Leclerc a conservare il P2, Bearman salì P9-P4.": {
        "it": "2023: Pérez uscì alla prima curva; la bandiera rossa favorì la seconda sosta di Verstappen, mentre Norris rimontò P17-P5.\n2024: Sainz vinse per passo; Verstappen ricevette due penalità da dieci secondi.\n2025: Norris dominò; una VSC tardiva aiutò Leclerc a conservare il P2, Bearman salì P9-P4.",
        "en": "2023: Pérez retired at the first corner; the red flag benefited Verstappen's second stop, while Norris recovered from P17 to P5.\n2024: Sainz won on merit through superior pace; Verstappen received two ten-second penalties.\n2025: Norris dominated; a late VSC helped Leclerc retain P2, while Bearman climbed from P9 to P4.",
        "fr": "2023 : Pérez a abandonné dès le premier virage ; le drapeau rouge a favorisé le deuxième arrêt de Verstappen, tandis que Norris est remonté de la P17 à la P5.\n2024 : Sainz s'est imposé au mérite grâce à un rythme supérieur ; Verstappen a reçu deux pénalités de dix secondes.\n2025 : Norris a dominé ; une VSC tardive a aidé Leclerc à conserver la P2, tandis que Bearman est remonté de la P9 à la P4.",
        "pt": "2023: Pérez abandonou na primeira curva; a bandeira vermelha favoreceu a segunda paragem de Verstappen, enquanto Norris recuperou de P17 para P5.\n2024: Sainz venceu por mérito graças a um ritmo superior; Verstappen recebeu duas penalizações de dez segundos.\n2025: Norris dominou; uma VSC tardia ajudou Leclerc a conservar a P2, enquanto Bearman subiu de P9 para P4.",
        "es": "2023: Pérez abandonó en la primera curva; la bandera roja favoreció la segunda parada de Verstappen, mientras Norris remontó de P17 a P5.\n2024: Sainz ganó por méritos propios gracias a un ritmo superior; Verstappen recibió dos penalizaciones de diez segundos.\n2025: Norris dominó; un VSC tardío ayudó a Leclerc a conservar la P2, mientras Bearman remontó de P9 a P4.",
        "de": "2023: Pérez schied in der ersten Kurve aus; die rote Flagge begünstigte Verstappens zweiten Stopp, während Norris sich von P17 auf P5 vorkämpfte.\n2024: Sainz gewann aus eigener Stärke dank überlegener Pace; Verstappen erhielt zwei Zehn-Sekunden-Strafen.\n2025: Norris dominierte; ein spätes VSC half Leclerc, P2 zu behalten, während Bearman von P9 auf P4 vorfuhr.",
    },
    "2023: Norris ebbe passo reale da P2; Alonso difese il P3 da Pérez per 0,053 s, senza fortuna decisiva.\n2024: Pioggia e bandiera rossa regalarono il cambio gomme gratuito a Verstappen e alle Alpine; il doppio podio Alpine fu favorito ma ben eseguito.\n2025: Antonelli difese un meritato P2; Verstappen rimontò dalla pit lane nonostante una foratura.": {
        "it": "2023: Norris ebbe passo reale da P2; Alonso difese il P3 da Pérez per 0,053 s, senza fortuna decisiva.\n2024: Pioggia e bandiera rossa regalarono il cambio gomme gratuito a Verstappen e alle Alpine; il doppio podio Alpine fu favorito ma ben eseguito.\n2025: Antonelli difese un meritato P2; Verstappen rimontò dalla pit lane nonostante una foratura.",
        "en": "2023: Norris had genuine pace from P2; Alonso defended P3 from Pérez by 0.053 seconds, without decisive good fortune.\n2024: Rain and the red flag gave Verstappen and the Alpine drivers a free tyre change; Alpine's double podium was assisted by circumstances but well executed.\n2025: Antonelli defended a well-deserved P2; Verstappen recovered from the pit lane despite a puncture.",
        "fr": "2023 : Norris avait un rythme réel depuis la P2 ; Alonso a défendu la P3 face à Pérez pour 0,053 s, sans bénéficier d'un coup de chance décisif.\n2024 : La pluie et le drapeau rouge ont offert un changement de pneus gratuit à Verstappen et aux pilotes Alpine ; les circonstances ont favorisé le double podium d'Alpine, mais l'équipe l'a parfaitement exécuté.\n2025 : Antonelli a défendu une P2 pleinement méritée ; Verstappen est remonté depuis la voie des stands malgré une crevaison.",
        "pt": "2023: Norris mostrou ritmo real a partir da P2; Alonso defendeu a P3 de Pérez por 0,053 s, sem depender de sorte decisiva.\n2024: A chuva e a bandeira vermelha ofereceram uma troca de pneus gratuita a Verstappen e aos pilotos da Alpine; as circunstâncias favoreceram o duplo pódio da Alpine, mas a equipa executou-o muito bem.\n2025: Antonelli defendeu uma P2 plenamente merecida; Verstappen recuperou a partir da via das boxes apesar de um furo.",
        "es": "2023: Norris mostró un ritmo real desde la P2; Alonso defendió la P3 frente a Pérez por 0,053 s, sin depender de un golpe de suerte decisivo.\n2024: La lluvia y la bandera roja regalaron un cambio de neumáticos a Verstappen y a los pilotos de Alpine; las circunstancias favorecieron el doble podio de Alpine, pero el equipo lo ejecutó muy bien.\n2025: Antonelli defendió una P2 plenamente merecida; Verstappen remontó desde el pit lane pese a un pinchazo.",
        "de": "2023: Norris hatte von P2 aus echte Pace; Alonso verteidigte P3 mit 0,053 Sekunden Vorsprung gegen Pérez, ohne entscheidendes Glück.\n2024: Regen und rote Flagge ermöglichten Verstappen und den Alpine-Piloten einen kostenlosen Reifenwechsel; die Umstände begünstigten Alpines Doppelpodium, das Team setzte seine Chance jedoch sehr gut um.\n2025: Antonelli verteidigte einen hochverdienten P2; Verstappen kämpfte sich trotz eines Reifenschadens aus der Boxengasse nach vorn.",
    },
    "2023: Safety Car e contatti aiutarono Pérez, Ocon e Stroll; Leclerc perse il vantaggio strategico con gomme più vecchie.\n2024: Mercedes fu nettamente superiore al freddo; Hamilton rimontò P10-P2 con passo autentico.\n2025: Le McLaren furono squalificate per usura del pattino: Russell e Antonelli ereditarono P2 e P3.": {
        "it": "2023: Safety Car e contatti aiutarono Pérez, Ocon e Stroll; Leclerc perse il vantaggio strategico con gomme più vecchie.\n2024: Mercedes fu nettamente superiore al freddo; Hamilton rimontò P10-P2 con passo autentico.\n2025: Le McLaren furono squalificate per usura del pattino: Russell e Antonelli ereditarono P2 e P3.",
        "en": "2023: The Safety Car and several incidents helped Pérez, Ocon and Stroll; Leclerc lost his strategic advantage on older tyres.\n2024: Mercedes was clearly superior in the cold conditions; Hamilton recovered from P10 to P2 through genuine pace.\n2025: Both McLaren cars were disqualified for excessive plank wear: Russell and Antonelli inherited P2 and P3.",
        "fr": "2023 : La Safety Car et plusieurs incidents ont aidé Pérez, Ocon et Stroll ; Leclerc a perdu son avantage stratégique avec des pneus plus anciens.\n2024 : Mercedes était nettement supérieure dans le froid ; Hamilton est remonté de la P10 à la P2 grâce à son rythme réel.\n2025 : Les deux McLaren ont été disqualifiées pour usure excessive du patin du fond plat : Russell et Antonelli ont hérité des P2 et P3.",
        "pt": "2023: A Safety Car e vários incidentes ajudaram Pérez, Ocon e Stroll; Leclerc perdeu a sua vantagem estratégica com pneus mais usados.\n2024: A Mercedes foi claramente superior nas condições frias; Hamilton recuperou de P10 para P2 graças ao seu ritmo real.\n2025: Os dois carros da McLaren foram desclassificados por desgaste excessivo da prancha do fundo: Russell e Antonelli herdaram a P2 e a P3.",
        "es": "2023: El Safety Car y varios incidentes ayudaron a Pérez, Ocon y Stroll; Leclerc perdió su ventaja estratégica con neumáticos más usados.\n2024: Mercedes fue claramente superior en condiciones frías; Hamilton remontó de P10 a P2 gracias a su ritmo real.\n2025: Los dos McLaren fueron descalificados por el desgaste excesivo del patín del fondo plano: Russell y Antonelli heredaron la P2 y la P3.",
        "de": "2023: Das Safety Car und mehrere Zwischenfälle halfen Pérez, Ocon und Stroll; Leclerc verlor mit älteren Reifen seinen strategischen Vorteil.\n2024: Mercedes war unter den kalten Bedingungen klar überlegen; Hamilton fuhr dank echter Pace von P10 auf P2 vor.\n2025: Beide McLaren wurden wegen übermäßiger Abnutzung der Unterbodenplanke disqualifiziert: Russell und Antonelli erbten P2 und P3.",
    },
    "2023: Limite di 18 giri per set impose tre soste; il contatto Hamilton-Russell favorì la doppietta McLaren dietro Verstappen.\n2024: Penalità a Norris e forature dopo i detriti favorirono Leclerc, Piastri, Gasly e Zhou.\n2025: La Safety Car al giro 7 premiò chi si fermò; McLaren restò fuori e perse la vittoria, Sainz ottenne un P3 atipico ma meritato.": {
        "it": "2023: Limite di 18 giri per set impose tre soste; il contatto Hamilton-Russell favorì la doppietta McLaren dietro Verstappen.\n2024: Penalità a Norris e forature dopo i detriti favorirono Leclerc, Piastri, Gasly e Zhou.\n2025: La Safety Car al giro 7 premiò chi si fermò; McLaren restò fuori e perse la vittoria, Sainz ottenne un P3 atipico ma meritato.",
        "en": "2023: An 18-lap limit per tyre set required three stops; the Hamilton-Russell collision helped McLaren secure a double podium behind Verstappen.\n2024: Norris's penalty and punctures caused by debris benefited Leclerc, Piastri, Gasly and Zhou.\n2025: The Safety Car on lap 7 rewarded those who stopped; McLaren stayed out and lost the victory, while Sainz secured an unusual but deserved P3.",
        "fr": "2023 : La limite de 18 tours par train de pneus a imposé trois arrêts ; l'accrochage entre Hamilton et Russell a favorisé le double podium de McLaren derrière Verstappen.\n2024 : La pénalité de Norris et les crevaisons causées par des débris ont profité à Leclerc, Piastri, Gasly et Zhou.\n2025 : La Safety Car au 7e tour a récompensé ceux qui se sont arrêtés ; McLaren est restée en piste et a perdu la victoire, tandis que Sainz a obtenu une P3 inhabituelle mais méritée.",
        "pt": "2023: O limite de 18 voltas por conjunto de pneus impôs três paragens; o contacto entre Hamilton e Russell favoreceu o duplo pódio da McLaren atrás de Verstappen.\n2024: A penalização de Norris e os furos causados por detritos beneficiaram Leclerc, Piastri, Gasly e Zhou.\n2025: A Safety Car na volta 7 beneficiou quem parou; a McLaren permaneceu em pista e perdeu a vitória, enquanto Sainz conquistou uma P3 invulgar, mas merecida.",
        "es": "2023: El límite de 18 vueltas por juego de neumáticos obligó a realizar tres paradas; el choque entre Hamilton y Russell favoreció el doble podio de McLaren por detrás de Verstappen.\n2024: La penalización a Norris y los pinchazos causados por los restos beneficiaron a Leclerc, Piastri, Gasly y Zhou.\n2025: El Safety Car de la vuelta 7 benefició a quienes se detuvieron; McLaren permaneció en pista y perdió la victoria, mientras Sainz logró una P3 atípica pero merecida.",
        "de": "2023: Eine Begrenzung auf 18 Runden pro Reifensatz erzwang drei Stopps; die Kollision zwischen Hamilton und Russell begünstigte McLarens Doppelpodium hinter Verstappen.\n2024: Norris' Strafe und durch Trümmerteile verursachte Reifenschäden kamen Leclerc, Piastri, Gasly und Zhou zugute.\n2025: Das Safety Car in Runde 7 belohnte diejenigen, die stoppten; McLaren blieb draußen und verlor den Sieg, während Sainz einen ungewöhnlichen, aber verdienten P3 erzielte.",
    },
    "2023: La penalità a Pérez lo retrocesse dal P2 al P4 e consegnò il podio a Russell.\n2024: Leclerc P19-P3 e Hamilton P16-P4 furono rimonte di passo; Piastri fu penalizzato dopo i contatti.\n2025: Nessun podio fortuito: Verstappen, Piastri e Norris convertirono passo e strategia.": {
        "it": "2023: La penalità a Pérez lo retrocesse dal P2 al P4 e consegnò il podio a Russell.\n2024: Leclerc P19-P3 e Hamilton P16-P4 furono rimonte di passo; Piastri fu penalizzato dopo i contatti.\n2025: Nessun podio fortuito: Verstappen, Piastri e Norris convertirono passo e strategia.",
        "en": "2023: Pérez's penalty dropped him from P2 to P4 and handed Russell a podium.\n2024: Leclerc's recovery from P19 to P3 and Hamilton's from P16 to P4 were driven by genuine pace; Piastri was penalised after making contact.\n2025: There were no fortunate podiums: Verstappen, Piastri and Norris converted their pace and strategies into the final result.",
        "fr": "2023 : La pénalité de Pérez l'a fait reculer de la P2 à la P4 et a offert le podium à Russell.\n2024 : Les remontées de Leclerc, de la P19 à la P3, et de Hamilton, de la P16 à la P4, reposaient sur un rythme réel ; Piastri a été pénalisé après plusieurs contacts.\n2025 : Aucun podium chanceux : Verstappen, Piastri et Norris ont concrétisé leur rythme et leur stratégie.",
        "pt": "2023: A penalização de Pérez fê-lo cair de P2 para P4 e entregou o pódio a Russell.\n2024: As recuperações de Leclerc, de P19 para P3, e de Hamilton, de P16 para P4, resultaram de ritmo real; Piastri foi penalizado após vários contactos.\n2025: Não houve pódios fortuitos: Verstappen, Piastri e Norris converteram o seu ritmo e as suas estratégias no resultado final.",
        "es": "2023: La penalización a Pérez lo hizo caer de P2 a P4 y entregó el podio a Russell.\n2024: Las remontadas de Leclerc, de P19 a P3, y de Hamilton, de P16 a P4, se debieron a su ritmo real; Piastri fue penalizado tras varios contactos.\n2025: No hubo podios fortuitos: Verstappen, Piastri y Norris materializaron su ritmo y sus estrategias en el resultado final.",
        "de": "2023: Die Strafe gegen Pérez warf ihn von P2 auf P4 zurück und brachte Russell aufs Podium.\n2024: Leclercs Aufholjagd von P19 auf P3 und Hamiltons Fahrt von P16 auf P4 beruhten auf echter Pace; Piastri wurde nach mehreren Kontakten bestraft.\n2025: Es gab keine glücklichen Podestplätze: Verstappen, Piastri und Norris setzten ihr Tempo und ihre Strategien in das entsprechende Ergebnis um.",
    },
}

TRADUZIONI_ESATTE.update(TRADUZIONI_CONTESTI_STORICI)


TRADUZIONI_NOTE_BREVI = {
    "2024: rimonta di 10 posizioni; Il contatto Pérez-Sainz nel finale consegnò a Russell un P3 fortuito; Norris rimontò P15-P4.": {
        "it": "2024: rimonta di 10 posizioni; Il contatto Pérez-Sainz nel finale consegnò a Russell un P3 fortuito; Norris rimontò P15-P4.",
        "en": "2024: recovered 10 positions; the late Pérez-Sainz collision handed Russell a fortunate P3, while Norris climbed from P15 to P4.",
        "fr": "2024 : remontée de 10 positions ; l'accrochage entre Pérez et Sainz en fin de course a offert une P3 chanceuse à Russell, tandis que Norris est remonté de la P15 à la P4.",
        "pt": "2024: recuperação de 10 posições; a colisão entre Pérez e Sainz no final entregou a Russell uma afortunada P3, enquanto Norris subiu de P15 para P4.",
        "es": "2024: remontada de 10 posiciones; el choque entre Pérez y Sainz en el tramo final entregó a Russell una afortunada P3, mientras Norris subió de P15 a P4.",
        "de": "2024: 10 Plätze aufgeholt; die späte Kollision zwischen Pérez und Sainz bescherte Russell einen glücklichen P3, während Norris von P15 auf P4 vorfuhr.",
    },
    "2024: rimonta di 11 posizioni; Il contatto Pérez-Sainz nel finale consegnò a Russell un P3 fortuito; Norris rimontò P15-P4.": {
        "it": "2024: rimonta di 11 posizioni; Il contatto Pérez-Sainz nel finale consegnò a Russell un P3 fortuito; Norris rimontò P15-P4.",
        "en": "2024: recovered 11 positions; the late Pérez-Sainz collision handed Russell a fortunate P3, while Norris climbed from P15 to P4.",
        "fr": "2024 : remontée de 11 positions ; l'accrochage entre Pérez et Sainz en fin de course a offert une P3 chanceuse à Russell, tandis que Norris est remonté de la P15 à la P4.",
        "pt": "2024: recuperação de 11 posições; a colisão entre Pérez e Sainz no final entregou a Russell uma afortunada P3, enquanto Norris subiu de P15 para P4.",
        "es": "2024: remontada de 11 posiciones; el choque entre Pérez y Sainz en el tramo final entregó a Russell una afortunada P3, mientras Norris subió de P15 a P4.",
        "de": "2024: 11 Plätze aufgeholt; die späte Kollision zwischen Pérez und Sainz bescherte Russell einen glücklichen P3, während Norris von P15 auf P4 vorfuhr.",
    },
    "2024: rimonta di 9 posizioni; Sainz vinse per passo; Verstappen ricevette due penalità da dieci secondi.": {
        "it": "2024: rimonta di 9 posizioni; Sainz vinse per passo; Verstappen ricevette due penalità da dieci secondi.",
        "en": "2024: recovered 9 positions; Sainz won on merit through superior pace, while Verstappen received two ten-second penalties.",
        "fr": "2024 : remontée de 9 positions ; Sainz s'est imposé au mérite grâce à un rythme supérieur, tandis que Verstappen a reçu deux pénalités de dix secondes.",
        "pt": "2024: recuperação de 9 posições; Sainz venceu por mérito graças a um ritmo superior, enquanto Verstappen recebeu duas penalizações de dez segundos.",
        "es": "2024: remontada de 9 posiciones; Sainz ganó por méritos propios gracias a un ritmo superior, mientras Verstappen recibió dos penalizaciones de diez segundos.",
        "de": "2024: 9 Plätze aufgeholt; Sainz gewann aus eigener Stärke dank überlegener Pace, während Verstappen zwei Zehn-Sekunden-Strafen erhielt.",
    },
}

TRADUZIONI_ESATTE.update(TRADUZIONI_NOTE_BREVI)


# Revisione umana dei passaggi piu visibili del GP attuale. Sono override
# versionati per testo sorgente, quindi restano validi solo finche l'italiano
# approvato non cambia.
TRADUZIONI_GP_ATTUALE_REVISIONATE = {
    "Il risultato di gara è stato condizionato dal contatto con Leclerc, per il quale Antonelli ha ricevuto dieci secondi di penalità, e da altri cinque secondi per eccesso di velocità in pit lane. Il sedicesimo posto non rappresenta quindi il passo mostrato prima degli episodi.": {
        "it": "Il risultato di gara è stato condizionato dal contatto con Leclerc, per il quale Antonelli ha ricevuto dieci secondi di penalità, e da altri cinque secondi per eccesso di velocità in pit lane. Il sedicesimo posto non rappresenta quindi il passo mostrato prima degli episodi.",
        "en": "The contact with Leclerc shaped Antonelli's race result: he received a ten-second penalty for the collision and a further five seconds for speeding in the pit lane. Sixteenth place therefore does not reflect the pace he had shown before those incidents.",
        "fr": "Le contact avec Leclerc a conditionné le résultat d'Antonelli : il a reçu une pénalité de dix secondes pour la collision, puis cinq secondes supplémentaires pour excès de vitesse dans la voie des stands. Sa seizième place ne reflète donc pas le rythme montré avant ces incidents.",
        "pt": "O contacto com Leclerc condicionou o resultado de Antonelli: recebeu uma penalização de dez segundos pela colisão e mais cinco segundos por excesso de velocidade na via das boxes. O décimo sexto lugar não reflete, por isso, o ritmo mostrado antes desses incidentes.",
        "es": "El contacto con Leclerc condicionó el resultado de Antonelli: recibió una penalización de diez segundos por la colisión y otros cinco por exceso de velocidad en el pit lane. Por tanto, la decimosexta posición no refleja el ritmo mostrado antes de esos incidentes.",
        "de": "Der Kontakt mit Leclerc prägte Antonellis Rennergebnis: Er erhielt eine Zehn-Sekunden-Strafe für die Kollision und weitere fünf Sekunden wegen zu schnellen Fahrens in der Boxengasse. Der sechzehnte Platz spiegelt daher nicht die Pace wider, die er vor diesen Zwischenfällen gezeigt hatte.",
    },
    "Il secondo posto è arrivato dopo il ritiro di Norris, ma Verstappen era già stabilmente in zona podio. Il risultato è quindi in parte favorito dall’episodio, senza essere estraneo al ritmo mostrato.": {
        "it": "Il secondo posto è arrivato dopo il ritiro di Norris, ma Verstappen era già stabilmente in zona podio. Il risultato è quindi in parte favorito dall’episodio, senza essere estraneo al ritmo mostrato.",
        "en": "Second place came after Norris's retirement, but Verstappen was already firmly on course for a podium. The incident partly improved his result, although it was still supported by his race pace.",
        "fr": "La deuxième place est arrivée après l'abandon de Norris, mais Verstappen était déjà solidement installé en position de podium. L'incident a donc amélioré en partie son résultat, qui restait toutefois cohérent avec son rythme de course.",
        "pt": "O segundo lugar surgiu após o abandono de Norris, mas Verstappen já estava solidamente em posição de pódio. O incidente melhorou parcialmente o resultado, que continuava, ainda assim, sustentado pelo seu ritmo de corrida.",
        "es": "La segunda posición llegó tras el abandono de Norris, pero Verstappen ya estaba firmemente situado en zona de podio. El incidente mejoró en parte su resultado, aunque este seguía respaldado por su ritmo de carrera.",
        "de": "Der zweite Platz ergab sich nach Norris' Ausfall, doch Verstappen lag bereits sicher auf Podiumskurs. Der Zwischenfall verbesserte sein Ergebnis teilweise, das zugleich durch seine Rennpace gerechtfertigt war.",
    },
    "Il podio dalla dodicesima posizione è stato costruito con il passaggio immediato alle intermedie ed è diventato terzo dopo la penalità assegnata a Perez. Gasly aveva a sua volta ricevuto cinque secondi per velocità in pit lane.": {
        "it": "Il podio dalla dodicesima posizione è stato costruito con il passaggio immediato alle intermedie ed è diventato terzo dopo la penalità assegnata a Perez. Gasly aveva a sua volta ricevuto cinque secondi per velocità in pit lane.",
        "en": "Starting from twelfth, Gasly built his podium charge by switching immediately to intermediate tyres and moved up to third after Pérez's penalty. Gasly himself had also received a five-second penalty for speeding in the pit lane.",
        "fr": "Parti douzième, Gasly a construit son podium en passant immédiatement aux pneus intermédiaires, puis est monté en troisième position après la pénalité de Pérez. Gasly avait lui-même reçu cinq secondes pour excès de vitesse dans la voie des stands.",
        "pt": "Partindo do décimo segundo lugar, Gasly construiu o seu pódio ao mudar imediatamente para pneus intermédios e subiu ao terceiro lugar após a penalização de Pérez. O próprio Gasly também tinha recebido cinco segundos por excesso de velocidade na via das boxes.",
        "es": "Desde la duodécima posición, Gasly construyó su podio al cambiar inmediatamente a neumáticos intermedios y ascendió a la tercera posición tras la penalización a Pérez. El propio Gasly también había recibido cinco segundos por exceso de velocidad en el pit lane.",
        "de": "Von Platz zwölf aus legte Gasly mit dem sofortigen Wechsel auf Intermediates den Grundstein für sein Podium und rückte nach Pérez' Strafe auf Rang drei vor. Gasly selbst hatte ebenfalls fünf Sekunden wegen zu schnellen Fahrens in der Boxengasse erhalten.",
    },
    "Il sesto posto è eccezionale rispetto alla diciannovesima posizione in qualifica: Bearman è partito dalla pit lane dopo modifiche alla power unit, ha allungato il primo stint e ha sfruttato le neutralizzazioni e la penalità di Antonelli.": {
        "it": "Il sesto posto è eccezionale rispetto alla diciannovesima posizione in qualifica: Bearman è partito dalla pit lane dopo modifiche alla power unit, ha allungato il primo stint e ha sfruttato le neutralizzazioni e la penalità di Antonelli.",
        "en": "Sixth place was exceptional compared with nineteenth in qualifying: Bearman started from the pit lane after power-unit changes, extended his first stint and benefited from the neutralisations and Antonelli's penalty.",
        "fr": "La sixième place est exceptionnelle après une dix-neuvième position en qualifications : Bearman est parti de la voie des stands à la suite de modifications de l'unité de puissance, a prolongé son premier stint et a profité des neutralisations ainsi que de la pénalité d'Antonelli.",
        "pt": "O sexto lugar foi excecional depois do décimo nono na qualificação: Bearman partiu da via das boxes após alterações na unidade de potência, prolongou o primeiro stint e beneficiou das neutralizações e da penalização de Antonelli.",
        "es": "La sexta posición fue excepcional después del decimonoveno puesto en clasificación: Bearman salió desde el pit lane tras modificar la unidad de potencia, alargó su primer stint y aprovechó las neutralizaciones y la penalización de Antonelli.",
        "de": "Platz sechs war nach Rang neunzehn im Qualifying außergewöhnlich: Bearman startete nach Änderungen an der Power Unit aus der Boxengasse, verlängerte seinen ersten Stint und profitierte von den Neutralisierungen sowie Antonellis Strafe.",
    },
    "Il settimo posto dalla ventesima posizione è stato favorito dalla sosta anticipata, dall’undercut e dal momento delle neutralizzazioni, oltre che da una gara senza errori.": {
        "it": "Il settimo posto dalla ventesima posizione è stato favorito dalla sosta anticipata, dall’undercut e dal momento delle neutralizzazioni, oltre che da una gara senza errori.",
        "en": "The recovery from twentieth to seventh was helped by the early stop, the undercut and the timing of the neutralisations, as well as by an error-free race.",
        "fr": "La remontée de la vingtième à la septième place a été favorisée par l'arrêt anticipé, l'undercut et le moment des neutralisations, ainsi que par une course sans erreur.",
        "pt": "A recuperação do vigésimo para o sétimo lugar foi favorecida pela paragem antecipada, pelo undercut e pelo momento das neutralizações, além de uma corrida sem erros.",
        "es": "La remontada desde la vigésima hasta la séptima posición se vio favorecida por la parada temprana, el undercut y el momento de las neutralizaciones, además de una carrera sin errores.",
        "de": "Die Aufholjagd von Platz zwanzig auf Platz sieben wurde durch den frühen Stopp, den Undercut und den Zeitpunkt der Neutralisierungen sowie ein fehlerfreies Rennen begünstigt.",
    },
    "La sosta anticipata ha messo le gomme nella finestra giusta per l’undercut e le neutralizzazioni hanno protetto lo stint. La gestione è stata efficace e pragmatica.": {
        "it": "La sosta anticipata ha messo le gomme nella finestra giusta per l’undercut e le neutralizzazioni hanno protetto lo stint. La gestione è stata efficace e pragmatica.",
        "en": "The early stop brought the tyres into the right operating window for the undercut, while the neutralisations protected the stint. The management was effective and pragmatic.",
        "fr": "L'arrêt anticipé a placé les pneus dans la bonne fenêtre de fonctionnement pour l'undercut, tandis que les neutralisations ont protégé le stint. La gestion a été efficace et pragmatique.",
        "pt": "A paragem antecipada colocou os pneus na janela de funcionamento certa para o undercut, enquanto as neutralizações protegeram o stint. A gestão foi eficaz e pragmática.",
        "es": "La parada temprana situó los neumáticos en la ventana de funcionamiento adecuada para el undercut, mientras las neutralizaciones protegieron el stint. La gestión fue eficaz y pragmática.",
        "de": "Der frühe Stopp brachte die Reifen für den Undercut in das richtige Arbeitsfenster, während die Neutralisierungen den Stint absicherten. Das Management war effektiv und pragmatisch.",
    },
    "Il quarto posto è legato a una gara molto movimentata: la sosta immediata per le intermedie lo aveva portato in zona podio, ma cinque secondi per eccesso di velocità in pit lane lo hanno fatto arretrare dietro Gasly.": {
        "it": "Il quarto posto è legato a una gara molto movimentata: la sosta immediata per le intermedie lo aveva portato in zona podio, ma cinque secondi per eccesso di velocità in pit lane lo hanno fatto arretrare dietro Gasly.",
        "en": "Fourth place came from a highly eventful race: the immediate switch to intermediate tyres had put him in podium contention, but a five-second penalty for speeding in the pit lane dropped him behind Gasly.",
        "fr": "La quatrième place est issue d'une course très mouvementée : le passage immédiat aux pneus intermédiaires l'avait placé en lutte pour le podium, mais une pénalité de cinq secondes pour excès de vitesse dans la voie des stands l'a fait reculer derrière Gasly.",
        "pt": "O quarto lugar resultou de uma corrida muito movimentada: a mudança imediata para pneus intermédios colocou-o na luta pelo pódio, mas uma penalização de cinco segundos por excesso de velocidade na via das boxes fê-lo cair para trás de Gasly.",
        "es": "La cuarta posición llegó en una carrera muy agitada: el cambio inmediato a neumáticos intermedios lo había situado en la lucha por el podio, pero una penalización de cinco segundos por exceso de velocidad en el pit lane lo relegó por detrás de Gasly.",
        "de": "Platz vier entstand in einem äußerst ereignisreichen Rennen: Der sofortige Wechsel auf Intermediates hatte ihn in den Podiumskampf gebracht, doch eine Fünf-Sekunden-Strafe wegen zu schnellen Fahrens in der Boxengasse warf ihn hinter Gasly zurück.",
    },
    "Russell ha chiuso quarto nonostante il fondo danneggiato dal contatto con Leclerc. Antonelli è sceso al sedicesimo posto dopo il contatto con Leclerc, dieci secondi di penalità per la collisione e altri cinque per velocità in pit lane.": {
        "it": "Russell ha chiuso quarto nonostante il fondo danneggiato dal contatto con Leclerc. Antonelli è sceso al sedicesimo posto dopo il contatto con Leclerc, dieci secondi di penalità per la collisione e altri cinque per velocità in pit lane.",
        "en": "Russell finished fourth despite floor damage caused by contact with Leclerc. Antonelli dropped to sixteenth after colliding with Leclerc, receiving ten seconds for the collision and a further five for speeding in the pit lane.",
        "fr": "Russell a terminé quatrième malgré un fond plat endommagé lors d'un contact avec Leclerc. Antonelli est tombé à la seizième place après son contact avec Leclerc, une pénalité de dix secondes pour la collision et cinq secondes supplémentaires pour excès de vitesse dans la voie des stands.",
        "pt": "Russell terminou em quarto apesar de o assoalho ter ficado danificado num contacto com Leclerc. Antonelli caiu para o décimo sexto lugar após o contacto com Leclerc, uma penalização de dez segundos pela colisão e mais cinco por excesso de velocidade na via das boxes.",
        "es": "Russell terminó cuarto pese a los daños en el fondo plano causados por un contacto con Leclerc. Antonelli cayó a la decimosexta posición tras chocar con Leclerc, recibir diez segundos por la colisión y otros cinco por exceso de velocidad en el pit lane.",
        "de": "Russell wurde trotz eines beim Kontakt mit Leclerc beschädigten Unterbodens Vierter. Antonelli fiel nach der Kollision mit Leclerc, einer Zehn-Sekunden-Strafe dafür und weiteren fünf Sekunden wegen zu schnellen Fahrens in der Boxengasse auf den sechzehnten Platz zurück.",
    },
    "Norris ha espresso il passo migliore della gara, mentre Piastri aveva velocità da podio ma ha perso tempo dopo l’undercut di Leclerc e nel traffico.": {
        "it": "Norris ha espresso il passo migliore della gara, mentre Piastri aveva velocità da podio ma ha perso tempo dopo l’undercut di Leclerc e nel traffico.",
        "en": "Norris showed the strongest race pace, while Piastri had podium-level speed but lost time after Leclerc's undercut and in traffic.",
        "fr": "Norris a affiché le meilleur rythme de course, tandis que Piastri avait la vitesse nécessaire pour viser le podium mais a perdu du temps après l'undercut de Leclerc et dans le trafic.",
        "pt": "Norris mostrou o melhor ritmo de corrida, enquanto Piastri tinha velocidade para o pódio, mas perdeu tempo após o undercut de Leclerc e no trânsito.",
        "es": "Norris mostró el mejor ritmo de carrera, mientras Piastri tenía velocidad para subir al podio, pero perdió tiempo tras el undercut de Leclerc y en el tráfico.",
        "de": "Norris zeigte die stärkste Rennpace, während Piastri Podiumstempo hatte, aber nach Leclercs Undercut und im Verkehr Zeit verlor.",
    },
    "Il sesto posto di Bearman e il decimo di Ocon sono molto migliori delle posizioni di qualifica. Bearman è partito dalla pit lane dopo modifiche alla power unit, ha allungato il primo stint e ha sfruttato neutralizzazioni e penalità altrui.": {
        "it": "Il sesto posto di Bearman e il decimo di Ocon sono molto migliori delle posizioni di qualifica. Bearman è partito dalla pit lane dopo modifiche alla power unit, ha allungato il primo stint e ha sfruttato neutralizzazioni e penalità altrui.",
        "en": "Bearman's sixth place and Ocon's tenth were far better than their qualifying positions. Bearman started from the pit lane after power-unit changes, extended his first stint and benefited from neutralisations and other drivers' penalties.",
        "fr": "La sixième place de Bearman et la dixième d'Ocon sont nettement meilleures que leurs positions en qualifications. Bearman est parti de la voie des stands après des modifications de l'unité de puissance, a prolongé son premier stint et a profité des neutralisations et des pénalités infligées à d'autres pilotes.",
        "pt": "O sexto lugar de Bearman e o décimo de Ocon foram muito melhores do que as respetivas posições na qualificação. Bearman partiu da via das boxes após alterações na unidade de potência, prolongou o primeiro stint e beneficiou das neutralizações e das penalizações de outros pilotos.",
        "es": "La sexta posición de Bearman y la décima de Ocon fueron mucho mejores que sus puestos de clasificación. Bearman salió desde el pit lane tras modificar la unidad de potencia, alargó su primer stint y aprovechó las neutralizaciones y las penalizaciones de otros pilotos.",
        "de": "Bearmans sechster Platz und Ocons zehnter Rang waren deutlich besser als ihre Qualifying-Positionen. Bearman startete nach Änderungen an der Power Unit aus der Boxengasse, verlängerte seinen ersten Stint und profitierte von Neutralisierungen sowie Strafen anderer Fahrer.",
    },
    "Stroll ha recuperato dal ventesimo al settimo posto grazie alla sosta anticipata, all’undercut e alle neutralizzazioni. Alonso ha chiuso ottavo dopo una gara condizionata da traffico e tempi delle safety car.": {
        "it": "Stroll ha recuperato dal ventesimo al settimo posto grazie alla sosta anticipata, all’undercut e alle neutralizzazioni. Alonso ha chiuso ottavo dopo una gara condizionata da traffico e tempi delle safety car.",
        "en": "Stroll recovered from twentieth to seventh thanks to an early stop, the undercut and the neutralisations. Alonso finished eighth after traffic and the timing of the Safety Car periods shaped his race.",
        "fr": "Stroll est remonté de la vingtième à la septième place grâce à un arrêt anticipé, à l'undercut et aux neutralisations. Alonso a terminé huitième après une course conditionnée par le trafic et le moment des interventions de la Safety Car.",
        "pt": "Stroll recuperou do vigésimo para o sétimo lugar graças a uma paragem antecipada, ao undercut e às neutralizações. Alonso terminou em oitavo depois de o trânsito e o momento das intervenções da Safety Car terem condicionado a sua corrida.",
        "es": "Stroll remontó desde la vigésima hasta la séptima posición gracias a una parada temprana, el undercut y las neutralizaciones. Alonso terminó octavo después de que el tráfico y el momento de las intervenciones del Safety Car condicionaran su carrera.",
        "de": "Stroll kämpfte sich dank eines frühen Stopps, des Undercuts und der Neutralisierungen von Platz zwanzig auf Platz sieben vor. Alonso wurde Achter, nachdem Verkehr und der Zeitpunkt der Safety-Car-Phasen sein Rennen geprägt hatten.",
    },
    "La sosta anticipata di Stroll ha aperto un undercut efficace e le neutralizzazioni hanno protetto lo stint. Alonso ha dovuto chiedere di più alle gomme nel traffico.": {
        "it": "La sosta anticipata di Stroll ha aperto un undercut efficace e le neutralizzazioni hanno protetto lo stint. Alonso ha dovuto chiedere di più alle gomme nel traffico.",
        "en": "Stroll's early stop created an effective undercut, while the neutralisations protected his stint. Alonso had to demand more from the tyres in traffic.",
        "fr": "L'arrêt anticipé de Stroll a permis un undercut efficace, tandis que les neutralisations ont protégé son stint. Alonso a dû solliciter davantage ses pneus dans le trafic.",
        "pt": "A paragem antecipada de Stroll permitiu um undercut eficaz, enquanto as neutralizações protegeram o seu stint. Alonso teve de exigir mais dos pneus no trânsito.",
        "es": "La parada temprana de Stroll permitió un undercut eficaz, mientras las neutralizaciones protegieron su stint. Alonso tuvo que exigir más a los neumáticos en el tráfico.",
        "de": "Strolls früher Stopp ermöglichte einen wirkungsvollen Undercut, während die Neutralisierungen seinen Stint absicherten. Alonso musste die Reifen im Verkehr stärker beanspruchen.",
    },
}

TRADUZIONI_ESATTE.update(TRADUZIONI_GP_ATTUALE_REVISIONATE)
TRADUZIONI_ESATTE.update({
    "STR • BOT • PER • OCO: la forma 2026 indica un fine settimana più difficile": {
        "it": "STR • BOT • PER • OCO: la forma 2026 indica un fine settimana più difficile",
        "en": "STR • BOT • PER • OCO: 2026 form points to a more difficult weekend",
        "fr": "STR • BOT • PER • OCO : la forme affichée en 2026 laisse prévoir un week-end plus difficile",
        "pt": "STR • BOT • PER • OCO: a forma de 2026 aponta para um fim de semana mais difícil",
        "es": "STR • BOT • PER • OCO: la forma de 2026 apunta a un fin de semana más difícil",
        "de": "STR • BOT • PER • OCO: Die Form von 2026 deutet auf ein schwierigeres Wochenende hin",
    },
})


def argomenti() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--file",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "dati-iniziali.json",
    )
    parser.add_argument("--cache", type=Path, default=CACHE_PREDEFINITA)
    parser.add_argument("--batch-source-chars", type=int, default=3_000)
    parser.add_argument("--rate-target-chars", type=int, default=20_000)
    parser.add_argument("--max-target-chars", type=int, default=1_990_000)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--offline",
        action="store_true",
        help=(
            "Vieta qualsiasi chiamata ad Azure: la generazione riesce solo "
            "se tutti i segmenti richiesti sono gia presenti nella cache locale"
        ),
    )
    parser.add_argument(
        "--rebuild-from-cache",
        action="store_true",
        help=(
            "Ricostruisce i cataloghi dalla cache Azure applicando di nuovo "
            "glossario e regole deterministiche, senza riusare le traduzioni "
            "gia presenti nel JSON"
        ),
    )
    parser.add_argument(
        "--quality-current",
        action="store_true",
        help=(
            "Ritraduce come unita complete i testi editoriali del GP attuale, "
            "per migliorare coerenza e grammatica senza esporre Azure alle API"
        ),
    )
    return parser.parse_args()


def carica_env(percorso: Path) -> None:
    if not percorso.exists():
        return
    for riga in percorso.read_text(encoding="utf-8").splitlines():
        riga = riga.strip()
        if not riga or riga.startswith("#") or "=" not in riga:
            continue
        nome, valore = riga.split("=", 1)
        os.environ.setdefault(nome.strip(), valore.strip().strip('"').strip("'"))


def configura_token_protetti(dati: dict[str, Any]) -> None:
    TOKEN_PROTETTI.update(pilota["codice"] for pilota in dati["piloti"])
    for pilota in dati["piloti"]:
        TOKEN_PROTETTI.add(pilota["nome"])
        TOKEN_PROTETTI.update(
            parte for parte in pilota["nome"].split()
            if len(parte) >= 3
        )
    TOKEN_PROTETTI.update(scuderia["abbreviazione"] for scuderia in dati["scuderie"])
    TOKEN_PROTETTI.update(scuderia["nome"] for scuderia in dati["scuderie"])
    TOKEN_PROTETTI.update(gara["circuito"] for gara in dati["gare"])
    TOKEN_PROTETTI.update(
        {
            "F1", "F1DB", "FIA", "GP", "DRS", "VSC", "SC", "ERS", "PU",
            "DNF", "DNS", "DSQ", "NC", "FP1", "FP2", "FP3",
            "RIC", "ZHO", "MAG", "SAR", "TSU", "DEV", "DOO",
            "Safety Car", "Virtual Safety Car", "Sprint", "Soft", "Medium",
            "Hard", "undercut", "overcut", "graining", "warm-up", "pit lane",
            "stint", "pole", "pole position", "track limits", "lift and coast",
            "upgrade", "midfield",
            "Grand Prix", "Formula 1", "La Monumental", "Pirelli",
        }
    )


def proteggi_token(testo: str) -> tuple[str, dict[str, str]]:
    schema = re.compile(
        r"(?<![\w-])(?:P\d{1,2}|Q\d{1,2}|" +
        "|".join(re.escape(token) for token in sorted(TOKEN_PROTETTI, key=len, reverse=True)) +
        r")(?![\w-])"
    )
    risultato = []
    segnaposto = {}
    posizione = 0
    for indice, corrispondenza in enumerate(schema.finditer(testo)):
        codice = f"__RAH{indice:03d}__"
        risultato.append(testo[posizione:corrispondenza.start()])
        risultato.append(codice)
        segnaposto[codice] = corrispondenza.group()
        posizione = corrispondenza.end()
    risultato.append(testo[posizione:])
    return "".join(risultato), segnaposto


def ripristina_token(testo: str, segnaposto: dict[str, str]) -> str:
    presenti = set(re.findall(r"__RAH\d{3}__", testo))
    attesi = set(segnaposto)
    if presenti != attesi:
        raise RuntimeError(
            "Azure ha alterato i segnaposto tecnici: "
            f"attesi {sorted(attesi)}, ricevuti {sorted(presenti)}"
        )
    risultato = testo
    for codice, valore in segnaposto.items():
        risultato = risultato.replace(codice, valore)
    return risultato


def valori_testuali(valore: Any):
    if isinstance(valore, str):
        yield valore
    elif isinstance(valore, dict):
        for figlio in valore.values():
            yield from valori_testuali(figlio)


def ricostruisci(valore: Any, traduzioni: dict[str, str]) -> Any:
    if isinstance(valore, str):
        return traduzioni[valore]
    if isinstance(valore, dict):
        return {chiave: ricostruisci(figlio, traduzioni) for chiave, figlio in valore.items()}
    raise TypeError(f"Valore localizzabile non supportato: {type(valore).__name__}")


def crea_memoria(dati: dict[str, Any]) -> dict[str, dict[str, str]]:
    memoria = {lingua: {} for lingua in LINGUE}

    for sezione, campi in CAMPI_LOCALIZZABILI.items():
        for documento in dati[sezione]:
            for lingua in LINGUE:
                traduzione = documento.get("traduzioni", {}).get(lingua, {})
                for campo in campi:
                    originale = documento.get(campo, "")
                    localizzato = traduzione.get(campo)
                    if localizzato is None:
                        continue
                    originali = list(valori_testuali(originale))
                    localizzati = list(valori_testuali(localizzato))
                    if len(originali) == len(localizzati):
                        memoria[lingua].update(zip(originali, localizzati, strict=True))

    return memoria


def segmenta(testo: str, massimo_caratteri: int = 320) -> list[tuple[str, str]]:
    """Divide il testo conservando fuori dal modello spazi e ritorni a capo."""
    segmenti = []
    for riga in testo.splitlines(keepends=True):
        finale = "\n" if riga.endswith("\n") else ""
        contenuto = riga.removesuffix("\n")
        if not contenuto:
            segmenti.append(("", finale))
            continue

        frasi = re.split(r"(?<=[.!?;])\s+", contenuto)
        corrente = ""
        for frase in frasi:
            candidata = f"{corrente} {frase}".strip()
            if corrente and (
                len(candidata) > massimo_caratteri or len(corrente) >= 120
            ):
                segmenti.append((corrente, " "))
                corrente = frase
            else:
                corrente = candidata
        segmenti.append((corrente, finale))
    return segmenti


def proteggi_parti_deterministiche(
    parti: list[tuple[str, str]],
    lingua: str,
) -> list[tuple[str, str, bool]]:
    """Separa dal modello anni e frasi il cui significato deve restare esatto."""
    risultato = []
    frasi = "|".join(
        re.escape(frase)
        for frase in sorted(FRASI_DETERMINISTICHE, key=len, reverse=True)
    )
    schema_protetto = re.compile(
        rf"(?P<frase>{frasi})"
    )

    for contenuto, separatore in parti:
        prefisso = re.match(r"^\d{4}:\s*", contenuto)
        posizione = 0
        if prefisso:
            risultato.append((prefisso.group(), "", True))
            posizione = prefisso.end()

        for corrispondenza in schema_protetto.finditer(contenuto, posizione):
            if corrispondenza.start() > posizione:
                risultato.append((contenuto[posizione : corrispondenza.start()], "", False))
            valore = corrispondenza.group()
            if corrispondenza.lastgroup == "frase":
                valore = FRASI_DETERMINISTICHE[valore][lingua]
            risultato.append((valore, "", True))
            posizione = corrispondenza.end()

        if posizione < len(contenuto):
            risultato.append((contenuto[posizione:], separatore, False))
        elif risultato:
            ultimo_contenuto, ultimo_separatore, letterale = risultato[-1]
            risultato[-1] = (ultimo_contenuto, ultimo_separatore + separatore, letterale)
        else:
            risultato.append(("", separatore, True))

    return risultato


def applica_glossario(testo: str, lingua: str, originale: str = "") -> str:
    risultato = testo
    for schema, sostituzione in GLOSSARIO[lingua]:
        risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

    ripetizioni_glossario = {
        "pt": (
            r"\bbaixa carga aerodinâmica(?: aerodinâmica)+\b",
            "baixa carga aerodinâmica",
        ),
        "es": (
            r"\bbaja carga aerodinámica(?: aerodinámica)+\b",
            "baja carga aerodinámica",
        ),
    }
    if lingua in ripetizioni_glossario:
        schema, sostituzione = ripetizioni_glossario[lingua]
        risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

    if "pattino" in originale.lower():
        sostituzioni = {
            "en": ((r"\bskate(?: wear)?\b", "plank"),),
            "fr": ((r"\bpatins?\b", "patin du fond plat"),),
            "pt": ((r"\bpatins?\b", "prancha do fundo"),),
            "es": ((r"\bpat[ií]n\b", "patín del fondo plano"),),
            "de": ((r"\bSchlittschuh\b", "Unterbodenplanke"),),
        }
        for schema, sostituzione in sostituzioni.get(lingua, ()):
            risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

    if re.search(r"\bPU\b", originale):
        sostituzioni = {
            "en": "power unit (PU)",
            "fr": "unité de puissance",
            "pt": "unidade de potência (PU)",
            "es": "unidad de potencia (PU)",
            "de": "Antriebseinheit (PU)",
        }
        if lingua == "fr":
            risultato = re.sub(r"\b(?:PU|union personnelle)\b", sostituzioni[lingua], risultato)

    if "degrado" in originale.lower():
        sostituzioni = {
            "en": "degradation",
            "fr": "dégradation",
            "pt": "degradação",
            "es": "degradación",
            "de": "Reifenabbau",
        }
        if lingua == "de":
            risultato = re.sub(r"\b(?:Verschlechterung|Verschleiß)\b", sostituzioni[lingua], risultato)

    originale_minuscolo = originale.lower()

    if re.search(r"\britir(?:o|i)\b", originale, flags=re.IGNORECASE):
        plurale = bool(re.search(r"\britiri\b", originale, flags=re.IGNORECASE))
        sostituzioni = {
            "en": "retirements" if plurale else "retirement",
            "fr": "abandons" if plurale else "abandon",
            "pt": "abandonos" if plurale else "abandono",
            "es": "abandonos" if plurale else "abandono",
            "de": "Ausfälle" if plurale else "Ausfall",
        }
        schemi = {
            "en": r"\b(?:retreats?|retirements?|withdrawals?)\b",
            "fr": r"\b(?:recule|retraites?|retraits?|abandons?)\b",
            "pt": r"\b(?:retiradas?|reformas?|abandonos?|abstinências?|desistências?|levantamentos?)\b",
            "es": r"\b(?:retiradas?|jubilaci[oó]n(?:es)?|abandonos?|abstinencias?)\b",
            "de": r"\b(?:Rückzüge?|Ruhestands?|Entzüge?|Ausfälle?|Rücktritte?|Pensionierungen?|Ruhestanden|Abhebungen?|Entzugserscheinungen)\b",
        }
        risultato = re.sub(
            schemi[lingua], sostituzioni[lingua], risultato, flags=re.IGNORECASE
        )

    if re.search(r"\britirat[oa]\b", originale, flags=re.IGNORECASE):
        forme_ritirato = {
            "en": ((r"\b(?:retired|retirement|withdrawn)\b", "retired"),),
            "fr": ((r"\b(?:retraité|retraite|retiré|abandonné)\b", "abandon"),),
            "pt": ((r"\b(?:reformado|retirado|desistiu)\b", "abandono"),),
            "es": ((r"\b(?:jubilación|jubilado|retirado)\b", "abandono"),),
            "de": ((r"\b(?:Ruhestand|zurückgezogen|Pensionierung)\b", "Ausfall"),),
        }
        for schema, sostituzione in forme_ritirato[lingua]:
            risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

    if "gest" in originale_minuscolo:
        schemi_gestione = {
            "en": ((r"\bdirection\b", "management"),),
            "fr": ((r"\bdirection\b", "gestion"),),
            "pt": ((r"\bdireção\b", "gestão"),),
            "es": ((r"\bdirección\b", "gestión"),),
            "de": ((r"\bLeitung\b", "Management"),),
        }
        for schema, sostituzione in schemi_gestione[lingua]:
            risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

    if "intermed" in originale_minuscolo:
        intermedi = {
            "en": ((r"\bintermediates\b", "intermediate tyres"),),
            "fr": ((r"\b(?:les |aux |des )?intermédiaires\b", "les pneus intermédiaires"),),
            "pt": ((r"\b(?:os |aos |dos )?intermédios\b", "os pneus intermédios"),),
            "es": ((r"\b(?:los |a los |de los )?intermedios\b", "los neumáticos intermedios"),),
            "de": ((r"\bZwischenklassen\b", "Intermediates"),),
        }
        for schema, sostituzione in intermedi[lingua]:
            risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

    if "asciutto" in originale_minuscolo and lingua == "fr":
        risultato = re.sub(r"\bneige\b", "sec", risultato, flags=re.IGNORECASE)

    if "velocità" in originale_minuscolo and "pit lane" in originale_minuscolo:
        velocita_box = {
            "en": ((r"\bspeed in pit lane\b", "speeding in the pit lane"),),
            "fr": ((r"\b(?:la )?vitesse (?:en|du) pit lane\b", "excès de vitesse dans la voie des stands"),),
            "pt": ((r"\bvelocidade (?:em|na) pit lane\b", "excesso de velocidade na via das boxes"),),
            "es": ((r"\bvelocidad (?:en|de) (?:la )?pit lane\b", "exceso de velocidad en el pit lane"),),
            "de": ((r"\bGeschwindigkeit (?:in|der) pit lane\b", "zu hoher Geschwindigkeit in der Boxengasse"),),
        }
        for schema, sostituzione in velocita_box[lingua]:
            risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

        # Il sostantivo ``eccesso`` viene talvolta tradotto due volte quando
        # Azure incontra l'intera locuzione ``eccesso di velocità``.
        duplicazioni = {
            "en": ((r"\bspeeding speeding in the pit lane\b", "speeding in the pit lane"),),
            "fr": ((r"\bexcès de excès de vitesse\b", "excès de vitesse"),),
            "pt": ((r"\bexcesso de excesso de velocidade\b", "excesso de velocidade"),),
            "es": ((r"\bexceso de exceso de velocidad\b", "exceso de velocidad"),),
            "de": (),
        }
        for schema, sostituzione in duplicazioni[lingua]:
            risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

    if re.search(r"\bgar(?:a|e)\b", originale, flags=re.IGNORECASE):
        schemi_gara = {
            "en": ((r"\bgames?\b", "race"),),
            "fr": ((r"\bmatchs?\b", "course"),),
            "pt": ((r"\bjogos?\b", "corrida"),),
            "es": ((r"\bpartidos?\b", "carrera"),),
            "de": ((r"\bSpiele?\b", "Rennen"),),
        }
        for schema, sostituzione in schemi_gara[lingua]:
            risultato = re.sub(
                schema, sostituzione, risultato, flags=re.IGNORECASE
            )

    if "forma 2026" in originale_minuscolo:
        etichette_forma = {
            "en": ((r"\b(?:2026 form|Form 2026)\b", "2026 form"),),
            "fr": ((r"\b(?:Situation|Formulaire|Forme) 2026\b", "Forme 2026"),),
            "pt": ((r"\b(?:Forma de 2026|Formulário 2026|Forma 2026)\b", "Forma em 2026"),),
            "es": ((r"\b(?:Forma|Formulario) 2026\b", "Forma 2026"),),
            "de": ((r"\b(?:Formular|Form) 2026\b", "Form 2026"),),
        }
        for schema, sostituzione in etichette_forma[lingua]:
            risultato = re.sub(
                schema, sostituzione, risultato, flags=re.IGNORECASE
            )

    if "fit pista:" in originale_minuscolo:
        etichette_circuito = {
            "en": (
                (r"\b(?:Track|Circuit|Chain) (?:fit|suitability|layout)\s*:", "Circuit suitability:"),
            ),
            "fr": (
                (r"\b(?:Ajustement|Adéquation|Aménagement|Installation) (?:de la piste|du circuit|des pistes|des chenilles)\s*:", "Adéquation au circuit :"),
            ),
            "pt": (
                (r"\b(?:Ajuste|Adequação|Adaptação) (?:da pista|do circuito)\s*:", "Adequação ao circuito:"),
            ),
            "es": (
                (r"\b(?:Ajuste|Adaptación|Adecuación|Diseño) (?:de la pista|del circuito|de las pistas|de las orugas)\s*:", "Adaptación al circuito:"),
            ),
            "de": (
                (r"\b(?:Passform der Strecke|Streckenanpassung|Streckenausstattung|Streckenpassform|Kettenpassform|Streckeneignung)\s*:", "Streckeneignung:"),
            ),
        }
        for schema, sostituzione in etichette_circuito[lingua]:
            risultato = re.sub(
                schema, sostituzione, risultato, flags=re.IGNORECASE
            )

    if "upgrade ungherese" in originale_minuscolo:
        aggiornamenti_ungheria = {
            "en": (
                (r"\bEncouraging Hungarian upgrade\b", "Encouraging upgrade introduced in Hungary"),
            ),
            "fr": (
                (r"\b(?:Encourageant(?:e)? )?(?:la )?montée en Hongrie\b", "Évolution encourageante introduite en Hongrie"),
            ),
            "pt": (
                (r"\b(?:Incentivando a )?ascensão húngara\b", "Atualização promissora introduzida na Hungria"),
            ),
            "es": (
                (r"\b(?:Animando a la )?subida húngara\b", "Actualización prometedora introducida en Hungría"),
            ),
            "de": (
                (r"\b(?:Das )?ermutigte ungarische Upgrade\b", "Das in Ungarn eingeführte Upgrade ist ermutigend"),
            ),
        }
        for schema, sostituzione in aggiornamenti_ungheria[lingua]:
            risultato = re.sub(
                schema, sostituzione, risultato, flags=re.IGNORECASE
            )

    if "traffico" in originale_minuscolo:
        errori_traffico = {
            "en": (),
            "fr": ((r"\bdébarquements?\b", "trafic"),),
            "pt": (),
            "es": ((r"\baterrizajes?\b", "tráfico"),),
            "de": (),
        }
        for schema, sostituzione in errori_traffico[lingua]:
            risultato = re.sub(
                schema, sostituzione, risultato, flags=re.IGNORECASE
            )

    if "stint" in originale_minuscolo:
        articoli_stint = {
            "en": (),
            "fr": (
                (r"\bla première stint\b", "le premier stint"),
                (r"\b(?:la|une) stint\b", "le stint"),
            ),
            "pt": (
                (r"\ba primeira stint\b", "o primeiro stint"),
                (r"\b(?:a|uma) stint\b", "o stint"),
            ),
            "es": (
                (r"\bla primera stint\b", "el primer stint"),
                (r"\b(?:la|una) stint\b", "el stint"),
            ),
            "de": ((r"\bstint\b", "Stint"),),
        }
        for schema, sostituzione in articoli_stint[lingua]:
            risultato = re.sub(
                schema, sostituzione, risultato, flags=re.IGNORECASE
            )

    if "non partito" in originale.lower():
        # Alcune risposte Azure spostano il codice pilota tra la negazione e
        # il participio (per esempio "não ALB partido"). Manteniamo il codice
        # nella stessa proposizione anziché perderlo con una sostituzione
        # dell'intera espressione.
        if lingua == "pt":
            risultato = re.sub(
                r"\bnão ([A-Z]{2,3}) partido\b",
                r"\1 não partiu",
                risultato,
                flags=re.IGNORECASE,
            )
        elif lingua == "es":
            risultato = re.sub(
                r"\bno ([A-Z]{2,3}) abandonado\b",
                r"\1 no tomó la salida",
                risultato,
                flags=re.IGNORECASE,
            )

        sostituzioni = {
            "en": "did not start",
            "fr": "n'a pas pris le départ",
            "pt": "não partiu",
            "es": "no tomó la salida",
            "de": "nicht gestartet",
        }
        schemi = {
            "en": r"\b(?:did not start|not left|didn't start)\b",
            "fr": r"\b(?:n['’]a pas pris le départ|pas quitté)\b",
            "pt": r"\b(?:não partiu)\b",
            "es": r"\b(?:no tomó la salida)\b",
            "de": r"\b(?:nicht gestartet|nicht weg)\b",
        }
        risultato = re.sub(
            schemi[lingua], sostituzioni[lingua], risultato, flags=re.IGNORECASE
        )

    ranking = re.search(r"\branking(?: previsionale)? (\d+)/(\d+)\b", originale)
    if ranking:
        posizione, totale = ranking.groups()
        risultato = re.sub(
            rf"(?<!\d)(?:{re.escape(posizione)}/{re.escape(totale)}|"
            rf"{re.escape(totale)}/{re.escape(posizione)})(?!\d)",
            f"{posizione}/{totale}",
            risultato,
            count=1,
        )

    # Le correzioni vengono applicate dopo i passaggi legati al testo sorgente:
    # alcune forme scorrette (per esempio "de la stint" -> "de le stint")
    # nascono proprio durante tali normalizzazioni e vanno corrette alla fine.
    for schema, sostituzione in CORREZIONI_CONTESTUALI.get(lingua, ()):
        risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)

    termine_undercut = "Undercut" if lingua == "de" else "undercut"
    risultato = re.sub(
        r"\bunder\s*cut\b", termine_undercut, risultato, flags=re.IGNORECASE
    )
    risultato = re.sub(r"\bover\s*cut\b", "overcut", risultato, flags=re.IGNORECASE)
    risultato = re.sub(r"\bDRS\b", "DRS", risultato, flags=re.IGNORECASE)
    risultato = ripristina_nomi_propri(risultato, originale)
    # Il ripristino dei token protetti può reintrodurre la grafia sorgente
    # minuscola; in tedesco i sostantivi tecnici restano maiuscoli.
    if lingua == "de":
        risultato = re.sub(r"\bundercut\b", "Undercut", risultato, flags=re.IGNORECASE)
        risultato = re.sub(r"\bstint\b", "Stint", risultato, flags=re.IGNORECASE)
    if lingua in ripetizioni_glossario:
        schema, sostituzione = ripetizioni_glossario[lingua]
        risultato = re.sub(schema, sostituzione, risultato, flags=re.IGNORECASE)
    if lingua == "fr":
        risultato = re.sub(
            r"\bfond plat(?: plat)+\b",
            "fond plat",
            risultato,
            flags=re.IGNORECASE,
        )
    return risultato.strip()


def senza_diacritici(testo: str) -> str:
    return "".join(
        carattere
        for carattere in unicodedata.normalize("NFD", testo)
        if unicodedata.category(carattere) != "Mn"
    )


def ripristina_nomi_propri(traduzione: str, originale: str) -> str:
    """Mantiene la grafia editoriale dei nomi presenti nel testo sorgente."""
    risultato = traduzione
    candidati = sorted(TOKEN_PROTETTI, key=len, reverse=True)
    for nome in candidati:
        if nome not in originale or nome in risultato:
            continue
        forma_base = senza_diacritici(nome)
        schema = re.compile(
            r"(?<!\w)" +
            "".join(
                re.escape(carattere) + "[\u0300-\u036f]*"
                for carattere in unicodedata.normalize("NFD", forma_base)
            ) +
            r"(?!\w)",
            flags=re.IGNORECASE,
        )
        risultato = schema.sub(nome, unicodedata.normalize("NFD", risultato))
        risultato = unicodedata.normalize("NFC", risultato)
    return risultato


def traduci_risultati_sportivi(testo: str, lingua: str) -> str | None:
    """Traduce righe di soli risultati senza affidare codici e posizioni al modello."""
    righe = testo.split("\n")
    risultato_individuale = r"(?:(?:[A-Z]{3} )?(?:P|Q)\d{1,2}|[A-Z]{3} (?:DNF|DNS|DSQ|NC))"
    schema = re.compile(
        rf"^(?P<anno>\d{{4}}): (?P<valore>{risultato_individuale}"
        rf"(?: / {risultato_individuale})?|(?:P|Q)\d{{1,2}}|DNF|DNS|DSQ|NC)"
        r"(?: \((?P<scuderia>[^)]+)\))?$"
    )
    tradotte = []
    for riga in righe:
        corrispondenza = schema.fullmatch(riga)
        if corrispondenza:
            scuderia = corrispondenza.group("scuderia")
            suffisso = f" ({scuderia})" if scuderia else ""
            tradotte.append(
                f"{corrispondenza.group('anno')}: "
                f"{corrispondenza.group('valore')}{suffisso}"
            )
            continue

        aggiornata = riga
        for frase, traduzioni in sorted(
            FRASI_DETERMINISTICHE.items(), key=lambda elemento: len(elemento[0]), reverse=True
        ):
            aggiornata = aggiornata.replace(frase, traduzioni[lingua])
        # Una riga storica e valida solo se e stata riconosciuta interamente.
        if aggiornata == riga or not re.fullmatch(r"\d{4}: .+", aggiornata):
            return None
        tradotte.append(aggiornata)

    return "\n".join(tradotte)


def traduci_classifica_favoriti(testo: str, lingua: str) -> str | None:
    schema = re.compile(r"(?P<codice>[A-Z]{3}) \((?P<posizione>P\d{1,2}) mondiale\)")
    corrispondenze = list(schema.finditer(testo))
    if not corrispondenze or " • ".join(elemento.group() for elemento in corrispondenze) != testo:
        return None
    etichette = {
        "en": "{codice} ({posizione} in the championship)",
        "fr": "{codice} ({posizione} au championnat)",
        "pt": "{codice} ({posizione} no campeonato)",
        "es": "{codice} ({posizione} en el campeonato)",
        "de": "{codice} ({posizione} in der WM)",
    }
    return " • ".join(
        etichette[lingua].format(**elemento.groupdict())
        for elemento in corrispondenze
    )


def traduci_nota_evento(testo: str, lingua: str) -> str | None:
    eventi = {
        "ritiro": {
            "en": "retired", "fr": "abandon", "pt": "abandono",
            "es": "abandono", "de": "Ausfall",
        },
        "ritiro dalla gara": {
            "en": "retired from the race", "fr": "abandon en course",
            "pt": "abandono da corrida", "es": "abandono en carrera",
            "de": "Ausfall im Rennen",
        },
        "squalifica": {
            "en": "disqualified", "fr": "disqualification", "pt": "desqualificação",
            "es": "descalificación", "de": "Disqualifikation",
        },
        "incidente": {
            "en": "accident", "fr": "accident", "pt": "acidente",
            "es": "accidente", "de": "Unfall",
        },
        "non partito": {
            "en": "did not start", "fr": "n’a pas pris le départ", "pt": "não partiu",
            "es": "no tomó la salida", "de": "nicht gestartet",
        },
        "danni da contatto": {
            "en": "contact damage", "fr": "dégâts dus à un contact",
            "pt": "danos por contacto", "es": "daños por contacto",
            "de": "Kontaktschaden",
        },
    }
    righe = testo.split("\n")
    tradotte = []
    for riga in righe:
        corrispondenza = re.fullmatch(
            r"(?P<anno>\d{4}): (?P<codice>[A-Z]{3}) (?P<evento>[^.]+)\.", riga
        )
        if not corrispondenza or corrispondenza.group("evento") not in eventi:
            return None
        dati = corrispondenza.groupdict()
        tradotte.append(
            f"{dati['anno']}: {dati['codice']} {eventi[dati['evento']][lingua]}."
        )
    return "\n".join(tradotte)


def traduci_passo_pilota(testo: str, lingua: str) -> str | None:
    schema = re.compile(
        r"^Storico: (?P<partenze>\d+) partenz[ae], (?P<arrivi>\d+) arriv[oi]; "
        r"media griglia (?P<griglia>\d+[,.]\d+|ND), media arrivo (?P<arrivo>\d+[,.]\d+|ND), "
        r"Δ medio (?P<delta>[+-]\d+[,.]\d+|ND); miglior (?P<migliore>P\d{1,2}|ND)\. "
        r"Lettura: (?P<lettura>[^.]+)\. 2026: (?P<posizione>P\d{1,2}), "
        r"(?P<punti>\d+) punt[oi], media Q (?P<media_q>\d+[,.]\d+), "
        r"(?P<ritiri>\d+) ritir[io]/DNS\.$"
    )
    valori = schema.fullmatch(testo)
    if not valori:
        return None

    dati = valori.groupdict()
    if lingua == "en":
        for chiave in ("griglia", "arrivo", "delta", "media_q"):
            dati[chiave] = dati[chiave].replace(",", ".")
    letture = {
        "en": {
            "passo generalmente solido": "generally solid pace",
            "feeling storicamente molto positivo": "historically very positive feeling",
            "ritmo gara migliore della posizione di partenza": "race pace stronger than the starting position",
            "rendimento variabile o difficile": "variable or difficult performance",
        },
        "fr": {
            "passo generalmente solido": "rythme généralement solide",
            "feeling storicamente molto positivo": "sensations historiquement très positives",
            "ritmo gara migliore della posizione di partenza": "rythme de course meilleur que la position de départ",
            "rendimento variabile o difficile": "rendement variable ou difficile",
        },
        "pt": {
            "passo generalmente solido": "ritmo geralmente sólido",
            "feeling storicamente molto positivo": "sensações historicamente muito positivas",
            "ritmo gara migliore della posizione di partenza": "ritmo de corrida superior à posição de partida",
            "rendimento variabile o difficile": "rendimento variável ou difícil",
        },
        "es": {
            "passo generalmente solido": "ritmo generalmente sólido",
            "feeling storicamente molto positivo": "sensaciones históricamente muy positivas",
            "ritmo gara migliore della posizione di partenza": "ritmo de carrera superior a la posición de salida",
            "rendimento variabile o difficile": "rendimiento variable o difícil",
        },
        "de": {
            "passo generalmente solido": "generell solide Rennpace",
            "feeling storicamente molto positivo": "historisch sehr positives Fahrgefühl",
            "ritmo gara migliore della posizione di partenza": "Rennpace besser als die Startposition",
            "rendimento variabile o difficile": "wechselhafte oder schwierige Leistung",
        },
    }
    dati["lettura"] = letture[lingua][dati["lettura"]]
    forme = {
        "en": {
            "partenze_nome": "start" if dati["partenze"] == "1" else "starts",
            "arrivi_nome": "finish" if dati["arrivi"] == "1" else "finishes",
            "punti_nome": "point" if dati["punti"] == "1" else "points",
            "ritiri_nome": "retirement" if dati["ritiri"] == "1" else "retirements",
        },
        "fr": {
            "partenze_nome": "départ" if dati["partenze"] == "1" else "départs",
            "arrivi_nome": "arrivée" if dati["arrivi"] == "1" else "arrivées",
            "punti_nome": "point" if dati["punti"] == "1" else "points",
            "ritiri_nome": "abandon" if dati["ritiri"] == "1" else "abandons",
        },
        "pt": {
            "partenze_nome": "partida" if dati["partenze"] == "1" else "partidas",
            "arrivi_nome": "chegada" if dati["arrivi"] == "1" else "chegadas",
            "punti_nome": "ponto" if dati["punti"] == "1" else "pontos",
            "ritiri_nome": "abandono" if dati["ritiri"] == "1" else "abandonos",
        },
        "es": {
            "partenze_nome": "salida" if dati["partenze"] == "1" else "salidas",
            "arrivi_nome": "llegada" if dati["arrivi"] == "1" else "llegadas",
            "punti_nome": "punto" if dati["punti"] == "1" else "puntos",
            "ritiri_nome": "abandono" if dati["ritiri"] == "1" else "abandonos",
        },
        "de": {
            "partenze_nome": "Start" if dati["partenze"] == "1" else "Starts",
            "arrivi_nome": "Zielankunft" if dati["arrivi"] == "1" else "Zielankünfte",
            "punti_nome": "Punkt" if dati["punti"] == "1" else "Punkte",
            "ritiri_nome": "Ausfall" if dati["ritiri"] == "1" else "Ausfälle",
        },
    }
    dati.update(forme[lingua])
    modelli = {
        "en": (
            "History: {partenze} {partenze_nome}, {arrivi} {arrivi_nome}; average grid position {griglia}, "
            "average finishing position {arrivo}, average Δ {delta}; best result {migliore}. "
            "Assessment: {lettura}. 2026: {posizione}, {punti} {punti_nome}, average qualifying "
            "position {media_q}, {ritiri} {ritiri_nome}/DNS."
        ),
        "fr": (
            "Historique : {partenze} {partenze_nome}, {arrivi} {arrivi_nome} ; position moyenne sur la grille "
            "{griglia}, position moyenne à l’arrivée {arrivo}, Δ moyen {delta} ; meilleur résultat "
            "{migliore}. Analyse : {lettura}. 2026 : {posizione}, {punti} {punti_nome}, position moyenne "
            "en qualifications {media_q}, {ritiri} {ritiri_nome}/DNS."
        ),
        "pt": (
            "Histórico: {partenze} {partenze_nome}, {arrivi} {arrivi_nome}; posição média na grelha {griglia}, "
            "posição média à chegada {arrivo}, Δ médio {delta}; melhor resultado {migliore}. "
            "Análise: {lettura}. 2026: {posizione}, {punti} {punti_nome}, posição média na qualificação "
            "{media_q}, {ritiri} {ritiri_nome}/DNS."
        ),
        "es": (
            "Historial: {partenze} {partenze_nome}, {arrivi} {arrivi_nome}; posición media en parrilla {griglia}, "
            "posición media en meta {arrivo}, Δ medio {delta}; mejor resultado {migliore}. "
            "Análisis: {lettura}. 2026: {posizione}, {punti} {punti_nome}, posición media en clasificación "
            "{media_q}, {ritiri} {ritiri_nome}/DNS."
        ),
        "de": (
            "Historie: {partenze} {partenze_nome}, {arrivi} {arrivi_nome}; durchschnittliche Startposition "
            "{griglia}, durchschnittliche Zielposition {arrivo}, durchschnittliches Δ {delta}; "
            "bestes Ergebnis {migliore}. Einordnung: {lettura}. 2026: {posizione}, {punti} {punti_nome}, "
            "durchschnittliche Qualifyingposition {media_q}, {ritiri} {ritiri_nome}/DNS."
        ),
    }
    return modelli[lingua].format(**dati)


def traduzione_deterministica(testo: str, lingua: str) -> str | None:
    return (
        traduci_risultati_sportivi(testo, lingua)
        or traduci_classifica_favoriti(testo, lingua)
        or traduci_nota_evento(testo, lingua)
        or traduci_passo_pilota(testo, lingua)
    )


def carica_cache(
    percorso: Path,
) -> tuple[dict[str, dict[str, str]], dict[str, dict[str, str]], int]:
    if not percorso.exists():
        return {}, {}, 0
    contenuto = json.loads(percorso.read_text(encoding="utf-8"))
    if contenuto.get("versione") != 1:
        raise RuntimeError("Versione della cache Azure non supportata")
    return (
        contenuto.get("segmenti", {}),
        contenuto.get("testiCompleti", {}),
        int(contenuto.get("caratteriInviati", 0)),
    )


def salva_cache(
    percorso: Path,
    cache: dict[str, dict[str, str]],
    testi_completi: dict[str, dict[str, str]],
    caratteri_inviati: int,
) -> None:
    percorso.parent.mkdir(parents=True, exist_ok=True)
    temporaneo = percorso.with_suffix(".tmp")
    temporaneo.write_text(
        json.dumps(
            {
                "versione": 1,
                "caratteriInviati": caratteri_inviati,
                "segmenti": cache,
                "testiCompleti": testi_completi,
            },
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    temporaneo.replace(percorso)


def segmenti_da_tradurre(testo: str, lingua: str = "en") -> list[str]:
    return [
        contenuto
        for contenuto, _, letterale in proteggi_parti_deterministiche(segmenta(testo), lingua)
        if contenuto and not letterale
    ]


def crea_batch(segmenti: list[str], massimo_caratteri: int) -> list[list[str]]:
    batch = []
    corrente = []
    caratteri = 0
    for segmento in segmenti:
        if len(segmento) > 50_000:
            raise RuntimeError("Segmento superiore al limite Azure di 50.000 caratteri")
        if corrente and (caratteri + len(segmento) > massimo_caratteri or len(corrente) >= 1_000):
            batch.append(corrente)
            corrente = []
            caratteri = 0
        corrente.append(segmento)
        caratteri += len(segmento)
    if corrente:
        batch.append(corrente)
    return batch


class TraduttoreAzure:
    def __init__(self, endpoint: str, chiave: str, regione: str):
        self.endpoint = endpoint.rstrip("/")
        self.chiave = chiave
        self.regione = regione

    def traduci(self, testi: list[str], lingue: list[str]) -> list[dict[str, str]]:
        parametri = [("api-version", "3.0"), ("from", "it")]
        parametri.extend(("to", LINGUE_AZURE[lingua]) for lingua in lingue)
        url = f"{self.endpoint}/translate?{urllib.parse.urlencode(parametri)}"
        protetti = [proteggi_token(testo) for testo in testi]
        corpo = json.dumps([{"Text": testo} for testo, _ in protetti]).encode("utf-8")
        intestazioni = {
            "Content-Type": "application/json; charset=UTF-8",
            "Ocp-Apim-Subscription-Key": self.chiave,
            "User-Agent": "race-analysis-hub-translation-admin/1.0",
        }
        if self.regione and self.regione.lower() != "global":
            intestazioni["Ocp-Apim-Subscription-Region"] = self.regione

        for tentativo in range(1, 5):
            richiesta = urllib.request.Request(url, data=corpo, headers=intestazioni, method="POST")
            try:
                with urllib.request.urlopen(richiesta, timeout=30) as risposta:
                    dati = json.loads(risposta.read().decode("utf-8"))
                risultati = []
                for indice, elemento in enumerate(dati):
                    per_lingua = {}
                    for traduzione in elemento["translations"]:
                        codice_azure = traduzione["to"].lower()
                        lingua = next(
                            codice for codice, valore in LINGUE_AZURE.items()
                            if valore.lower() == codice_azure
                        )
                        per_lingua[lingua] = ripristina_token(
                            traduzione["text"], protetti[indice][1]
                        )
                    risultati.append(per_lingua)
                return risultati
            except urllib.error.HTTPError as errore:
                dettaglio = errore.read().decode("utf-8", errors="replace")
                if errore.code in (401, 403):
                    raise RuntimeError(
                        f"Azure Translator ha rifiutato le credenziali ({errore.code})"
                    ) from errore
                if errore.code != 429 and errore.code < 500:
                    raise RuntimeError(
                        f"Azure Translator ha restituito HTTP {errore.code}: {dettaglio[:300]}"
                    ) from errore
                if tentativo == 4:
                    raise RuntimeError(
                        f"Azure Translator non disponibile dopo {tentativo} tentativi "
                        f"(HTTP {errore.code})"
                    ) from errore
                attesa = int(errore.headers.get("Retry-After", 15 * tentativo))
                time.sleep(min(max(attesa, 5), 60))
            except urllib.error.URLError as errore:
                if tentativo == 4:
                    raise RuntimeError("Azure Translator non raggiungibile") from errore
                time.sleep(5 * tentativo)
        raise AssertionError("Ciclo tentativi Azure terminato in modo imprevisto")


def ricostruisci_testo(
    testo: str,
    lingua: str,
    cache: dict[str, dict[str, str]],
) -> str:
    parti = proteggi_parti_deterministiche(segmenta(testo), lingua)
    risultato = "".join(
        (parte if letterale else cache[parte][lingua] if parte else "") + separatore
        for parte, separatore, letterale in parti
    )
    return applica_glossario(risultato, lingua, testo)


def main() -> None:
    opzioni = argomenti()
    carica_env(Path(__file__).resolve().parents[1] / ".env")
    dati = json.loads(opzioni.file.read_text(encoding="utf-8"))
    configura_token_protetti(dati)
    memoria = crea_memoria(dati)
    cache, testi_completi_cache, caratteri_gia_inviati = carica_cache(
        opzioni.cache
    )
    testi = set()
    invarianti = set()

    for lingua in LINGUE:
        for gara in dati["gare"]:
            invarianti.update(
                (gara["circuito"], gara["scuderieFavorite"])
            )
            memoria[lingua][gara["circuito"]] = gara["circuito"]
            memoria[lingua][gara["scuderieFavorite"]] = gara["scuderieFavorite"]

    for sezione, campi in CAMPI_LOCALIZZABILI.items():
        for documento in dati[sezione]:
            for campo in campi:
                testi.update(valori_testuali(documento.get(campo, "")))

    # Le traduzioni gia revisionate nel dataset sono memoria approvata. Le
    # salviamo anche nella cache locale, così un successivo rebuild offline può
    # riprodurre esattamente il catalogo senza consumare quota Azure.
    if not opzioni.rebuild_from_cache:
        for testo in testi:
            traduzioni_approvate = {
                lingua: memoria[lingua][testo]
                for lingua in LINGUE_DA_TRADURRE
                if testo in memoria[lingua]
            }
            if len(traduzioni_approvate) == len(LINGUE_DA_TRADURRE):
                testi_completi_cache.setdefault(testo, {}).update(
                    traduzioni_approvate
                )
        salva_cache(
            opzioni.cache,
            cache,
            testi_completi_cache,
            caratteri_gia_inviati,
        )

    catalogo_italiano = {
        testo: TRADUZIONI_ESATTE.get(testo, {}).get("it", testo)
        for testo in testi
    }

    def applica_catalogo(lingua: str, catalogo: dict[str, str]) -> None:
        for sezione, campi in CAMPI_LOCALIZZABILI.items():
            for documento in dati[sezione]:
                documento.setdefault("traduzioni", {})[lingua] = {
                    campo: ricostruisci(documento.get(campo, ""), catalogo)
                    for campo in campi
                }

    def salva() -> None:
        opzioni.file.write_text(
            json.dumps(dati, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    applica_catalogo("it", catalogo_italiano)
    salva()

    cataloghi = {}
    testi_da_segmentare = set()
    for lingua in LINGUE_DA_TRADURRE:
        esatte = {
            testo: valori[lingua]
            for testo, valori in TRADUZIONI_ESATTE.items()
        }
        deterministiche = {
            testo: traduzione
            for testo in testi
            if (traduzione := traduzione_deterministica(testo, lingua)) is not None
        }
        memoria_approvata = {} if opzioni.rebuild_from_cache else memoria[lingua]
        memoria_testi_completi = (
            {
                testo: traduzioni[lingua]
                for testo, traduzioni in testi_completi_cache.items()
                if lingua in traduzioni
            }
            if opzioni.rebuild_from_cache
            else {}
        )
        cataloghi[lingua] = {
            **memoria_approvata,
            **memoria_testi_completi,
            **{testo: testo for testo in invarianti},
            **deterministiche,
            **esatte,
        }
        testi_da_segmentare.update(
            testo for testo in testi
            if testo and testo not in cataloghi[lingua]
        )
        cataloghi[lingua][""] = ""

    segmenti = sorted({
        segmento
        for testo in testi_da_segmentare
        for segmento in segmenti_da_tradurre(testo)
    })
    segmenti_mancanti = [
        segmento for segmento in segmenti
        if any(lingua not in cache.get(segmento, {}) for lingua in LINGUE_DA_TRADURRE)
    ]
    caratteri_sorgente = sum(len(segmento) for segmento in segmenti_mancanti)
    caratteri_destinazione = caratteri_sorgente * len(LINGUE_DA_TRADURRE)

    print(
        f"Piano Azure: {len(segmenti_mancanti)} segmenti nuovi, "
        f"{caratteri_sorgente} caratteri sorgente, "
        f"{caratteri_destinazione} caratteri conteggiati su 5 lingue; "
        f"quota stimata {caratteri_gia_inviati + caratteri_destinazione}/"
        f"{opzioni.max_target_chars}"
    )
    if caratteri_gia_inviati + caratteri_destinazione > opzioni.max_target_chars:
        raise RuntimeError(
            "La traduzione supererebbe il limite di sicurezza configurato: "
            f"{caratteri_gia_inviati + caratteri_destinazione} > "
            f"{opzioni.max_target_chars} caratteri"
        )
    if opzioni.dry_run:
        print("Dry run completato: nessuna richiesta inviata ad Azure")
        return

    if opzioni.offline and segmenti_mancanti:
        raise RuntimeError(
            "Modalita offline: impossibile generare perche mancano "
            f"{len(segmenti_mancanti)} segmenti nella cache locale"
        )

    traduttore = None
    if not opzioni.offline:
        chiave = os.environ.get("AZURE_TRANSLATOR_KEY", "").strip()
        endpoint = os.environ.get(
            "AZURE_TRANSLATOR_ENDPOINT", ENDPOINT_PREDEFINITO
        ).strip()
        regione = os.environ.get("AZURE_TRANSLATOR_REGION", "global").strip()
        if not chiave:
            raise RuntimeError("AZURE_TRANSLATOR_KEY non configurata in backend/.env")
        traduttore = TraduttoreAzure(endpoint, chiave, regione)

    batch = crea_batch(segmenti_mancanti, opzioni.batch_source_chars)
    consumati = 0
    for indice, gruppo in enumerate(batch, start=1):
        if traduttore is None:
            raise AssertionError("Chiamata Azure bloccata dalla modalita offline")
        inizio = time.monotonic()
        risultati = traduttore.traduci(gruppo, list(LINGUE_DA_TRADURRE))
        for segmento, traduzioni in zip(gruppo, risultati, strict=True):
            cache.setdefault(segmento, {}).update(traduzioni)
        caratteri_batch = sum(len(segmento) for segmento in gruppo) * len(LINGUE_DA_TRADURRE)
        caratteri_gia_inviati += caratteri_batch
        salva_cache(
            opzioni.cache, cache, testi_completi_cache, caratteri_gia_inviati
        )
        consumati += caratteri_batch
        print(
            f"Azure {indice}/{len(batch)}: {len(gruppo)} segmenti salvati, "
            f"{consumati}/{caratteri_destinazione} caratteri",
            flush=True,
        )
        durata_minima = caratteri_batch / opzioni.rate_target_chars * 60
        attesa = durata_minima - (time.monotonic() - inizio)
        if indice < len(batch) and attesa > 0:
            time.sleep(attesa)

    if opzioni.quality_current:
        gara_attuale = next(
            (gara for gara in dati["gare"] if gara.get("stato") == "attuale"), None
        )
        if gara_attuale is None:
            raise RuntimeError("Nessun Gran Premio attuale disponibile per il passaggio qualita")

        documenti_attuali = [("gare", gara_attuale)]
        for sezione in ("analisiGare", "analisiScuderie"):
            documenti_attuali.extend(
                (sezione, documento)
                for documento in dati[sezione]
                if documento.get("garaSlug") == gara_attuale["slug"]
            )

        testi_qualita = set()
        invarianti_attuali = {
            gara_attuale["circuito"],
            gara_attuale["scuderieFavorite"],
            gara_attuale["potenzialiDifficolta"],
        }
        for sezione, documento in documenti_attuali:
            for campo in CAMPI_LOCALIZZABILI[sezione]:
                testi_qualita.update(
                    testo
                    for testo in valori_testuali(documento.get(campo, ""))
                    if testo
                    and testo not in invarianti_attuali
                    and testo not in TRADUZIONI_ESATTE
                    and traduzione_deterministica(testo, "en") is None
                )

        mancanti_qualita = [
            testo
            for testo in sorted(testi_qualita)
            if any(
                lingua not in testi_completi_cache.get(testo, {})
                for lingua in LINGUE_DA_TRADURRE
            )
        ]
        caratteri_qualita = sum(len(testo) for testo in mancanti_qualita) * len(
            LINGUE_DA_TRADURRE
        )
        print(
            f"Passaggio qualita GP attuale: {len(mancanti_qualita)} testi, "
            f"{caratteri_qualita} caratteri conteggiati",
            flush=True,
        )
        if opzioni.offline and mancanti_qualita:
            raise RuntimeError(
                "Modalita offline: il passaggio qualita richiederebbe "
                f"{len(mancanti_qualita)} nuove traduzioni"
            )
        if caratteri_gia_inviati + caratteri_qualita > opzioni.max_target_chars:
            raise RuntimeError(
                "Il passaggio qualita supererebbe il limite di sicurezza Azure"
            )

        for indice, gruppo in enumerate(
            crea_batch(mancanti_qualita, opzioni.batch_source_chars), start=1
        ):
            if traduttore is None:
                raise AssertionError("Chiamata Azure bloccata dalla modalita offline")
            inizio = time.monotonic()
            risultati = traduttore.traduci(gruppo, list(LINGUE_DA_TRADURRE))
            for testo, traduzioni in zip(gruppo, risultati, strict=True):
                testi_completi_cache.setdefault(testo, {}).update(traduzioni)
            caratteri_batch = sum(len(testo) for testo in gruppo) * len(
                LINGUE_DA_TRADURRE
            )
            caratteri_gia_inviati += caratteri_batch
            salva_cache(
                opzioni.cache, cache, testi_completi_cache, caratteri_gia_inviati
            )
            print(
                f"Qualita {indice}: {len(gruppo)} testi completi salvati",
                flush=True,
            )
            attesa = (
                caratteri_batch / opzioni.rate_target_chars * 60
                - (time.monotonic() - inizio)
            )
            if attesa > 0:
                time.sleep(attesa)

        for lingua in LINGUE_DA_TRADURRE:
            for testo in testi_qualita:
                cataloghi[lingua][testo] = applica_glossario(
                    testi_completi_cache[testo][lingua], lingua, testo
                )

    for lingua in LINGUE_DA_TRADURRE:
        for testo in testi_da_segmentare:
            if testo not in cataloghi[lingua]:
                cataloghi[lingua][testo] = ricostruisci_testo(testo, lingua, cache)
        # Anche le traduzioni esatte e deterministiche attraversano il
        # glossario finale: in questo modo una correzione linguistica globale
        # resta coerente in ogni campo, indipendentemente dalla sua origine.
        cataloghi[lingua] = {
            testo: applica_glossario(traduzione, lingua, testo)
            for testo, traduzione in cataloghi[lingua].items()
        }
        # I nomi di circuito e gli altri invarianti vengono reinseriti dopo
        # il catalogo iniziale; normalizziamo anche quei valori senza tradurli.
        cataloghi[lingua].update({
            testo: applica_glossario(testo, lingua, testo)
            for testo in invarianti
        })
        applica_catalogo(lingua, cataloghi[lingua])
        salva()
        print(f"{lingua}: catalogo applicato", flush=True)

    dati.setdefault("metadati", {})["localizzazione"] = {
        "linguaPredefinita": "it",
        "lingueSupportate": list(LINGUE),
        "servizio": "Azure Translator",
        "pianoGenerazione": "F0",
        "portoghese": "pt-PT",
        "metodo": "Traduzione amministrativa con memoria, glossario F1 e controlli automatici",
    }

    salva()
    print(f"Catalogo aggiornato: {opzioni.file}")


if __name__ == "__main__":
    main()
