'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PauseIcon, PlayIcon, StopIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid'

type TimerType = 'pomodoro' | 'deepWork'
type TimerPhase = 'work' | 'shortBreak' | 'longBreak'

interface TimerSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
}

interface TimerSession {
  id: string
  userId: string
  type: TimerType
  duration: number
  date: string
}

const defaultPomodoroSettings: TimerSettings = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
}

const defaultDeepWorkSettings: TimerSettings = {
  workDuration: 90 * 60,
  shortBreakDuration: 10 * 60,
  longBreakDuration: 30 * 60,
  sessionsBeforeLongBreak: 2,
}

export default function TimersPage() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [activeTimer, setActiveTimer] = useState<TimerType | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<TimerPhase>('work')
  const [sessionCount, setSessionCount] = useState(0)
  const [pomodoroSettings, setPomodoroSettings] = useState(defaultPomodoroSettings)
  const [deepWorkSettings, setDeepWorkSettings] = useState(defaultDeepWorkSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<TimerSession[]>([])

  useEffect(() => {
    if (user) {
      fetchSettings()
      fetchAnalytics()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handlePhaseComplete()
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const fetchSettings = async () => {
    const { data: pomodoroData, error: pomodoroError } = await supabase
      .from('timer_settings')
      .select('*')
      .eq('user_id', user?.id)
      .eq('type', 'pomodoro')
      .single()

    if (!pomodoroError && pomodoroData) {
      setPomodoroSettings(pomodoroData.settings)
    }

    const { data: deepWorkData, error: deepWorkError } = await supabase
      .from('timer_settings')
      .select('*')
      .eq('user_id', user?.id)
      .eq('type', 'deepWork')
      .single()

    if (!deepWorkError && deepWorkData) {
      setDeepWorkSettings(deepWorkData.settings)
    }
  }

  const saveSettings = async (type: TimerType, settings: TimerSettings) => {
    const { error } = await supabase
      .from('timer_settings')
      .upsert({ user_id: user?.id, type, settings })

    if (error) {
      console.error('Error saving settings:', error)
    } else {
      if (type === 'pomodoro') {
        setPomodoroSettings(settings)
      } else {
        setDeepWorkSettings(settings)
      }
    }
  }

  const fetchAnalytics = async () => {
    const { data, error } = await supabase
      .from('timer_sessions')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Error fetching analytics:', error)
    } else {
      setAnalyticsData(data || [])
    }
  }

  const startTimer = (type: TimerType) => {
    setActiveTimer(type)
    setCurrentPhase('work')
    setSessionCount(0)
    setTimeLeft(type === 'pomodoro' ? pomodoroSettings.workDuration : deepWorkSettings.workDuration)
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
    setTimeLeft(0)
    setSessionCount(0)
  }

  const handlePhaseComplete = async () => {
    if (!activeTimer) return

    const settings = activeTimer === 'pomodoro' ? pomodoroSettings : deepWorkSettings
    let nextPhase: TimerPhase = 'work'
    let nextDuration = settings.workDuration

    if (currentPhase === 'work') {
      const newSessionCount = sessionCount + 1
      setSessionCount(newSessionCount)

      if (newSessionCount % settings.sessionsBeforeLongBreak === 0) {
        nextPhase = 'longBreak'
        nextDuration = settings.longBreakDuration
      } else {
        nextPhase = 'shortBreak'
        nextDuration = settings.shortBreakDuration
      }

      // Log completed work session
      const { error } = await supabase
        .from('timer_sessions')
        .insert({
          user_id: user?.id,
          type: activeTimer,
          duration: settings.workDuration,
          date: new Date().toISOString().split('T')[0],
        })

      if (error) {
        console.error('Error logging timer session:', error)
      } else {
        fetchAnalytics()
      }
    }

    setCurrentPhase(nextPhase)
    setTimeLeft(nextDuration)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Timers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TimerCard
          title="Pomodoro"
          activeTimer={activeTimer}
          timerType="pomodoro"
          timeLeft={timeLeft}
          isRunning={isRunning}
          currentPhase={currentPhase}
          startTimer={startTimer}
          pauseTimer={pauseTimer}
          resumeTimer={resumeTimer}
          stopTimer={stopTimer}
          formatTime={formatTime}
        />
        <TimerCard
          title="Deep Work"
          activeTimer={activeTimer}
          timerType="deepWork"
          timeLeft={timeLeft}
          isRunning={isRunning}
          currentPhase={currentPhase}
          startTimer={startTimer}
          pauseTimer={pauseTimer}
          resumeTimer={resumeTimer}
          stopTimer={stopTimer}
          formatTime={formatTime}
        />
      </div>

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="mb-4 flex items-center justify-center w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300"
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
        {showSettings ? 'Hide Settings' : 'Show Settings'}
      </button>

      {showSettings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SettingsCard
            title="Pomodoro Settings"
            settings={pomodoroSettings}
            saveSettings={(newSettings) => saveSettings('pomodoro', newSettings)}
          />
          <SettingsCard
            title="Deep Work Settings"
            settings={deepWorkSettings}
            saveSettings={(newSettings) => saveSettings('deepWork', newSettings)}
          />
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Analytics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="duration" stroke="#8884d8" name="Duration (minutes)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const TimerCard = ({
  title,
  activeTimer,
  timerType,
  timeLeft,
  isRunning,
  currentPhase,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  formatTime,
}: {
  title: string
  activeTimer: TimerType | null
  timerType: TimerType
  timeLeft: number
  isRunning: boolean
  currentPhase: TimerPhase
  startTimer: (type: TimerType) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  formatTime: (seconds: number) => string
}) => (
  <div className="bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="text-center">
      <p className="text-4xl font-bold mb-4">{formatTime(timeLeft)}</p>
      <p className="text-lg mb-4">
        {activeTimer === timerType
          ? `Current phase: ${currentPhase}`
          : 'Timer not active'}
      </p>
      {activeTimer === timerType ? (
        <div className="flex justify-center space-x-2">
          {isRunning ? (
            <button
              onClick={pauseTimer}
              className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-300"
            >
              <PauseIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={resumeTimer}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
            >
              <PlayIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={stopTimer}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
          >
            <StopIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => startTimer(timerType)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
        >
          Start
        </button>
      )}
    </div>
  </div>
)

const SettingsCard = ({
  title,
  settings,
  saveSettings,
}: {
  title: string
  settings: TimerSettings
  saveSettings: (settings: TimerSettings) => void
}) => {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleChange = (key: keyof TimerSettings, value: number) => {
    setLocalSettings({ ...localSettings, [key]: value * 60 }) // Convert minutes to seconds
  }

  const handleSave = () => {
    saveSettings(localSettings)
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Work Duration (minutes)</label>
          <input
            type="number"
            value={localSettings.workDuration / 60}
            onChange={(e) => handleChange('workDuration', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Short Break Duration (minutes)</label>
          <input
            type="number"
            value={localSettings.shortBreakDuration / 60}
            onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Long Break Duration (minutes)</label>
          <input
            type="number"
            value={localSettings.longBreakDuration / 60}
            onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sessions Before Long Break</label>
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
          Save Settings
        </button>
      </div>
    </div>
  )
}