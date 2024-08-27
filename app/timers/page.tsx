'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PauseIcon, PlayIcon, StopIcon, CogIcon } from '@heroicons/react/24/solid'

type TimerType = 'pomodoro' | 'travailProfond'
type TimerPhase = 'travail' | 'pauseCourte' | 'pauseLongue'

interface TimerSettings {
  dureeTravail: number
  dureePauseCourte: number
  dureePauseLongue: number
  sessionsAvantPauseLongue: number
}

interface TimerSession {
  id: string
  userId: string
  type: TimerType
  duree: number
  date: string
}

const parametresPomodoroPardDefaut: TimerSettings = {
  dureeTravail: 25 * 60,
  dureePauseCourte: 5 * 60,
  dureePauseLongue: 15 * 60,
  sessionsAvantPauseLongue: 4,
}

const parametresTravailProfondParDefaut: TimerSettings = {
  dureeTravail: 90 * 60,
  dureePauseCourte: 10 * 60,
  dureePauseLongue: 30 * 60,
  sessionsAvantPauseLongue: 2,
}

export default function PageMinuteurs() {
  const utilisateur = useUser()
  const supabase = useSupabaseClient()
  const [minuteurActif, setMinuteurActif] = useState<TimerType | null>(null)
  const [tempsRestant, setTempsRestant] = useState(0)
  const [estEnCours, setEstEnCours] = useState(false)
  const [phaseActuelle, setPhaseActuelle] = useState<TimerPhase>('travail')
  const [nombreSessions, setNombreSessions] = useState(0)
  const [parametresPomodoro, setParametresPomodoro] = useState(parametresPomodoroPardDefaut)
  const [parametresTravailProfond, setParametresTravailProfond] = useState(parametresTravailProfondParDefaut)
  const [afficherParametres, setAfficherParametres] = useState(false)
  const [donneesAnalytiques, setDonneesAnalytiques] = useState<TimerSession[]>([])

  useEffect(() => {
    if (utilisateur) {
      recupererParametres()
      recupererAnalytiques()
    }
  }, [utilisateur])

  useEffect(() => {
    let intervalle: NodeJS.Timeout | null = null
    if (estEnCours && tempsRestant > 0) {
      intervalle = setInterval(() => {
        setTempsRestant((tempsPrecedent) => tempsPrecedent - 1)
      }, 1000)
    } else if (tempsRestant === 0) {
      gererFinPhase()
    }
    return () => {
      if (intervalle) clearInterval(intervalle)
    }
  }, [estEnCours, tempsRestant])

  const recupererParametres = async () => {
    const { data: donneesPomodoro, error: erreurPomodoro } = await supabase
      .from('parametres_minuteur')
      .select('*')
      .eq('user_id', utilisateur?.id)
      .eq('type', 'pomodoro')
      .single()

    if (!erreurPomodoro && donneesPomodoro) {
      setParametresPomodoro(donneesPomodoro.parametres)
    }

    const { data: donneesTravailProfond, error: erreurTravailProfond } = await supabase
      .from('parametres_minuteur')
      .select('*')
      .eq('user_id', utilisateur?.id)
      .eq('type', 'travailProfond')
      .single()

    if (!erreurTravailProfond && donneesTravailProfond) {
      setParametresTravailProfond(donneesTravailProfond.parametres)
    }
  }

  const sauvegarderParametres = async (type: TimerType, parametres: TimerSettings) => {
    const { error } = await supabase
      .from('parametres_minuteur')
      .upsert({ user_id: utilisateur?.id, type, parametres })

    if (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
    } else {
      if (type === 'pomodoro') {
        setParametresPomodoro(parametres)
      } else {
        setParametresTravailProfond(parametres)
      }
    }
  }

  const recupererAnalytiques = async () => {
    const { data, error } = await supabase
      .from('sessions_minuteur')
      .select('*')
      .eq('user_id', utilisateur?.id)
      .order('date', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Erreur lors de la récupération des analytiques:', error)
    } else {
      setDonneesAnalytiques(data || [])
    }
  }

  const demarrerMinuteur = (type: TimerType) => {
    setMinuteurActif(type)
    setPhaseActuelle('travail')
    setNombreSessions(0)
    setTempsRestant(type === 'pomodoro' ? parametresPomodoro.dureeTravail : parametresTravailProfond.dureeTravail)
    setEstEnCours(true)
  }

  const pauseMinuteur = () => {
    setEstEnCours(false)
  }

  const reprendreMinuteur = () => {
    setEstEnCours(true)
  }

  const arreterMinuteur = () => {
    setEstEnCours(false)
    setMinuteurActif(null)
    setTempsRestant(0)
    setNombreSessions(0)
  }

  const gererFinPhase = async () => {
    if (!minuteurActif) return

    const parametres = minuteurActif === 'pomodoro' ? parametresPomodoro : parametresTravailProfond
    let prochainePhase: TimerPhase = 'travail'
    let prochaineDuree = parametres.dureeTravail

    if (phaseActuelle === 'travail') {
      const nouveauNombreSessions = nombreSessions + 1
      setNombreSessions(nouveauNombreSessions)

      if (nouveauNombreSessions % parametres.sessionsAvantPauseLongue === 0) {
        prochainePhase = 'pauseLongue'
        prochaineDuree = parametres.dureePauseLongue
      } else {
        prochainePhase = 'pauseCourte'
        prochaineDuree = parametres.dureePauseCourte
      }

      // Enregistrer la session de travail terminée
      const { error } = await supabase
        .from('sessions_minuteur')
        .insert({
          user_id: utilisateur?.id,
          type: minuteurActif,
          duree: parametres.dureeTravail,
          date: new Date().toISOString().split('T')[0],
        })

      if (error) {
        console.error('Erreur lors de l\'enregistrement de la session:', error)
      } else {
        recupererAnalytiques()
      }
    }

    setPhaseActuelle(prochainePhase)
    setTempsRestant(prochaineDuree)
  }

  const formaterTemps = (secondes: number) => {
    const minutes = Math.floor(secondes / 60)
    const secondesRestantes = secondes % 60
    return `${minutes}:${secondesRestantes.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Minuteurs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <CarteMinuteur
          titre="Pomodoro"
          minuteurActif={minuteurActif}
          typeMinuteur="pomodoro"
          tempsRestant={tempsRestant}
          estEnCours={estEnCours}
          phaseActuelle={phaseActuelle}
          demarrerMinuteur={demarrerMinuteur}
          pauseMinuteur={pauseMinuteur}
          reprendreMinuteur={reprendreMinuteur}
          arreterMinuteur={arreterMinuteur}
          formaterTemps={formaterTemps}
        />
        <CarteMinuteur
          titre="Travail Profond"
          minuteurActif={minuteurActif}
          typeMinuteur="travailProfond"
          tempsRestant={tempsRestant}
          estEnCours={estEnCours}
          phaseActuelle={phaseActuelle}
          demarrerMinuteur={demarrerMinuteur}
          pauseMinuteur={pauseMinuteur}
          reprendreMinuteur={reprendreMinuteur}
          arreterMinuteur={arreterMinuteur}
          formaterTemps={formaterTemps}
        />
      </div>

      <button
        onClick={() => setAfficherParametres(!afficherParametres)}
        className="mb-8 flex items-center justify-center mx-auto bg-indigo-100 text-indigo-800 px-6 py-3 rounded-full hover:bg-indigo-200 transition duration-300"
      >
        <CogIcon className="h-5 w-5 mr-2" />
        {afficherParametres ? 'Masquer les paramètres' : 'Afficher les paramètres'}
      </button>

      {afficherParametres && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <CarteParametres
            titre="Paramètres Pomodoro"
            parametres={parametresPomodoro}
            sauvegarderParametres={(nouveauxParametres) => sauvegarderParametres('pomodoro', nouveauxParametres)}
          />
          <CarteParametres
            titre="Paramètres Travail Profond"
            parametres={parametresTravailProfond}
            sauvegarderParametres={(nouveauxParametres) => sauvegarderParametres('travailProfond', nouveauxParametres)}
          />
        </div>
      )}

      <div className="bg-white shadow-lg rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Analytiques</h2>
        {donneesAnalytiques.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={donneesAnalytiques}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="duree" stroke="#4F46E5" name="Durée (minutes)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-600">Pas de données à afficher</p>
        )}
      </div>
    </div>
  )
}

const CarteMinuteur = ({
  titre,
  minuteurActif,
  typeMinuteur,
  tempsRestant,
  estEnCours,
  phaseActuelle,
  demarrerMinuteur,
  pauseMinuteur,
  reprendreMinuteur,
  arreterMinuteur,
  formaterTemps,
}: {
  titre: string
  minuteurActif: TimerType | null
  typeMinuteur: TimerType
  tempsRestant: number
  estEnCours: boolean
  phaseActuelle: TimerPhase
  demarrerMinuteur: (type: TimerType) => void
  pauseMinuteur: () => void
  reprendreMinuteur: () => void
  arreterMinuteur: () => void
  formaterTemps: (secondes: number) => string
}) => (
  <div className="bg-white shadow-lg rounded-xl p-8">
    <h2 className="text-2xl font-semibold mb-6">{titre}</h2>
    <div className="text-center">
      <p className="text-6xl font-bold mb-6 text-indigo-600">{formaterTemps(tempsRestant)}</p>
      <p className="text-lg mb-6 text-gray-600">
        {minuteurActif === typeMinuteur
          ? `Phase actuelle : ${phaseActuelle === 'travail' ? 'Travail' : phaseActuelle === 'pauseCourte' ? 'Pause courte' : 'Pause longue'}`
          : 'Minuteur inactif'}
      </p>
      {minuteurActif === typeMinuteur ? (
        <div className="flex justify-center space-x-4">
          {estEnCours ? (
            <button
              onClick={pauseMinuteur}
              className="bg-yellow-500 text-white px-6 py-3 rounded-full hover:bg-yellow-600 transition duration-300"
            >
              <PauseIcon className="h-6 w-6" />
            </button>
          ) : (
            <button
              onClick={reprendreMinuteur}
              className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition duration-300"
            >
              <PlayIcon className="h-6 w-6" />
            </button>
          )}
          <button
            onClick={arreterMinuteur}
            className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition duration-300"
          >
            <StopIcon className="h-6 w-6" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => demarrerMinuteur(typeMinuteur)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 transition duration-300 text-lg"
        >
          Démarrer
        </button>
      )}
    </div>
  </div>
)

const CarteParametres = ({
    titre,
    parametres,
    sauvegarderParametres,
  }: {
    titre: string
    parametres: TimerSettings
    sauvegarderParametres: (parametres: TimerSettings) => void
  }) => {
    const [parametresLocaux, setParametresLocaux] = useState(parametres)
  
    const gererChangement = (cle: keyof TimerSettings, valeur: number) => {
      setParametresLocaux({ ...parametresLocaux, [cle]: valeur * 60 }) // Convertir les minutes en secondes
    }
  
    const gererSauvegarde = () => {
      sauvegarderParametres(parametresLocaux)
    }
  
    return (
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-semibold mb-6">{titre}</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée de travail (minutes)</label>
            <input
              type="number"
              value={parametresLocaux.dureeTravail / 60}
              onChange={(e) => gererChangement('dureeTravail', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée de pause courte (minutes)</label>
            <input
              type="number"
              value={parametresLocaux.dureePauseCourte / 60}
              onChange={(e) => gererChangement('dureePauseCourte', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée de pause longue (minutes)</label>
            <input
              type="number"
              value={parametresLocaux.dureePauseLongue / 60}
              onChange={(e) => gererChangement('dureePauseLongue', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sessions avant pause longue</label>
            <input
              type="number"
              value={parametresLocaux.sessionsAvantPauseLongue}
              onChange={(e) => gererChangement('sessionsAvantPauseLongue', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={gererSauvegarde}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
          >
            Enregistrer les paramètres
          </button>
        </div>
      </div>
    )
  }