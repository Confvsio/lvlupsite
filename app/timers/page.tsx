'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayIcon, PauseIcon, StopIcon, CogIcon } from '@heroicons/react/24/solid'

type TimerType = 'pomodoro' | 'deepWork'
type TimerPhase = 'work' | 'shortBreak' | 'longBreak'

interface TimerSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
}

const defaultSettings: Record<TimerType, TimerSettings> = {
  pomodoro: {
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    sessionsBeforeLongBreak: 4,
  },
  deepWork: {
    workDuration: 90 * 60,
    shortBreakDuration: 10 * 60,
    longBreakDuration: 30 * 60,
    sessionsBeforeLongBreak: 2,
  },
}

export default function TimersPage() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [activeTimer, setActiveTimer] = useState<TimerType | null>(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [timeLeft, setTimeLeft] = useState<Record<TimerType, number>>({
    pomodoro: defaultSettings.pomodoro.workDuration,
    deepWork: defaultSettings.deepWork.workDuration,
  })
  const [isRunning, setIsRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<TimerPhase>('work')
  const [sessionCount, setSessionCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning && activeTimer) {
      interval = setInterval(() => {
        setTimeLeft(prev => ({
          ...prev,
          [activeTimer]: prev[activeTimer] - 1
        }))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, activeTimer])

  useEffect(() => {
    if (activeTimer && timeLeft[activeTimer] === 0) {
      handlePhaseComplete()
    }
  }, [timeLeft, activeTimer])

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('timer_settings')
      .select('*')
      .eq('user_id', user?.id)

    if (error) {
      console.error('Error fetching settings:', error)
    } else if (data) {
      const newSettings = { ...defaultSettings }
      data.forEach(item => {
        newSettings[item.type as TimerType] = {
          workDuration: item.work_duration,
          shortBreakDuration: item.short_break_duration,
          longBreakDuration: item.long_break_duration,
          sessionsBeforeLongBreak: item.sessions_before_long_break,
        }
      })
      setSettings(newSettings)
      setTimeLeft({
        pomodoro: newSettings.pomodoro.workDuration,
        deepWork: newSettings.deepWork.workDuration,
      })
    }
  }

  const saveSettings = async (type: TimerType, newSettings: TimerSettings) => {
    const { error } = await supabase
      .from('timer_settings')
      .upsert({
        user_id: user?.id,
        type,
        work_duration: newSettings.workDuration,
        short_break_duration: newSettings.shortBreakDuration,
        long_break_duration: newSettings.longBreakDuration,
        sessions_before_long_break: newSettings.sessionsBeforeLongBreak,
      })

    if (error) {
      console.error('Error saving settings:', error)
    } else {
      setSettings(prev => ({ ...prev, [type]: newSettings }))
      setTimeLeft(prev => ({ ...prev, [type]: newSettings.workDuration }))
    }
  }

  const startTimer = (type: TimerType) => {
    setActiveTimer(type)
    setCurrentPhase('work')
    setSessionCount(0)
    setTimeLeft(prev => ({ ...prev, [type]: settings[type].workDuration }))
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resumeTimer = () => {
    setIsRunning(true)
  }

  const stopTimer = () => {
    setIsRunning(false)
    setActiveTimer(null)
    setTimeLeft(prev => ({
      ...prev,
      [activeTimer as TimerType]: settings[activeTimer as TimerType].workDuration
    }))
    setSessionCount(0)
  }

  const handlePhaseComplete = () => {
    if (!activeTimer) return

    const currentSettings = settings[activeTimer]
    let nextPhase: TimerPhase = 'work'
    let nextDuration = currentSettings.workDuration

    if (currentPhase === 'work') {
      const newSessionCount = sessionCount + 1
      setSessionCount(newSessionCount)

      if (newSessionCount % currentSettings.sessionsBeforeLongBreak === 0) {
        nextPhase = 'longBreak'
        nextDuration = currentSettings.longBreakDuration
      } else {
        nextPhase = 'shortBreak'
        nextDuration = currentSettings.shortBreakDuration
      }
    }

    setCurrentPhase(nextPhase)
    setTimeLeft(prev => ({ ...prev, [activeTimer]: nextDuration }))
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Minuteurs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <AnimatePresence>
          {(!activeTimer || activeTimer === 'pomodoro') && (
            <motion.div
              key="pomodoro"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                gridColumn: activeTimer === 'pomodoro' ? 'span 2' : 'auto'
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <TimerCard
                title="Pomodoro"
                type="pomodoro"
                isActive={activeTimer === 'pomodoro'}
                timeLeft={timeLeft.pomodoro}
                isRunning={isRunning}
                currentPhase={currentPhase}
                onStart={() => startTimer('pomodoro')}
                onPause={pauseTimer}
                onResume={resumeTimer}
                onStop={stopTimer}
                formatTime={formatTime}
              />
            </motion.div>
          )}
          {(!activeTimer || activeTimer === 'deepWork') && (
            <motion.div
              key="deepWork"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                gridColumn: activeTimer === 'deepWork' ? 'span 2' : 'auto'
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <TimerCard
                title="Deep Work"
                type="deepWork"
                isActive={activeTimer === 'deepWork'}
                timeLeft={timeLeft.deepWork}
                isRunning={isRunning}
                currentPhase={currentPhase}
                onStart={() => startTimer('deepWork')}
                onPause={pauseTimer}
                onResume={resumeTimer}
                onStop={stopTimer}
                formatTime={formatTime}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="mb-8 flex items-center justify-center mx-auto bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300"
      >
        <CogIcon className="h-5 w-5 mr-2" />
        {showSettings ? 'Masquer les paramètres' : 'Afficher les paramètres'}
      </button>

      {showSettings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <SettingsCard
            title="Paramètres Pomodoro"
            settings={settings.pomodoro}
            onSave={(newSettings) => saveSettings('pomodoro', newSettings)}
          />
          <SettingsCard
            title="Paramètres Deep Work"
            settings={settings.deepWork}
            onSave={(newSettings) => saveSettings('deepWork', newSettings)}
          />
        </div>
      )}
    </div>
  )
}

const TimerCard = ({
  title,
  type,
  isActive,
  timeLeft,
  isRunning,
  currentPhase,
  onStart,
  onPause,
  onResume,
  onStop,
  formatTime,
}: {
  title: string
  type: TimerType
  isActive: boolean
  timeLeft: number
  isRunning: boolean
  currentPhase: TimerPhase
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  formatTime: (seconds: number) => string
}) => (
  <div className="bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="text-center">
      <p className="text-4xl font-bold mb-4">{formatTime(timeLeft)}</p>
      <p className="text-lg mb-4">
        {isActive
          ? `Phase actuelle : ${currentPhase === 'work' ? 'Travail' : currentPhase === 'shortBreak' ? 'Pause courte' : 'Pause longue'}`
          : 'Minuteur inactif'}
      </p>
      {isActive ? (
        <div className="flex justify-center space-x-2">
          {isRunning ? (
            <button
              onClick={onPause}
              className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-300"
            >
              <PauseIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={onResume}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
            >
              <PlayIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onStop}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
          >
            <StopIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          onClick={onStart}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
        >
          Démarrer
        </button>
      )}
    </div>
  </div>
)

const SettingsCard = ({
    title,
    settings,
    onSave,
  }: {
    title: string
    settings: TimerSettings
    onSave: (settings: TimerSettings) => void
  }) => {
    const [localSettings, setLocalSettings] = useState(settings)
  
    const handleChange = (key: keyof TimerSettings, value: number) => {
      setLocalSettings({ ...localSettings, [key]: value * 60 }) // Convert minutes to seconds
    }
  
    const handleSave = () => {
      onSave(localSettings)
    }
  
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Durée de travail (minutes)</label>
            <input
              type="number"
              value={localSettings.workDuration / 60}
              onChange={(e) => handleChange('workDuration', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Durée de pause courte (minutes)</label>
            <input
              type="number"
              value={localSettings.shortBreakDuration / 60}
              onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Durée de pause longue (minutes)</label>
            <input
              type="number"
              value={localSettings.longBreakDuration / 60}
              onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sessions avant pause longue</label>
            <input
              type="number"
              value={localSettings.sessionsBeforeLongBreak}
              onChange={(e) => handleChange('sessionsBeforeLongBreak', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
          >
            Enregistrer les paramètres
          </button>
        </div>
      </div>
    )
  }