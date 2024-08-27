// app/timers/page.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calendar } from "@/components/ui/calendar"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Settings, Play, Pause, RotateCcw } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

interface TimerSession {
  id: string
  user_id: string
  type: 'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak'
  start_time: string
  end_time: string | null
  duration: number
  task_name: string
}

const TimerPage: React.FC = () => {
  const [timerSettings, setTimerSettings] = useState({
    pomodoro: 25,
    deepwork: 60,
    shortbreak: 5,
    longbreak: 15,
  })
  const [activeTimer, setActiveTimer] = useState<TimerSession | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [taskName, setTaskName] = useState('')
  const [sessions, setSessions] = useState<TimerSession[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const supabase = useSupabaseClient()
  const user = useUser()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3')
    if (user) fetchSessions()
  }, [user])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete()
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft])

  useEffect(() => {
    if (user) fetchSessions()
  }, [selectedDate, viewMode, user])

  const fetchSessions = async () => {
    if (!user) return

    let startDate, endDate
    if (viewMode === 'day') {
      startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
    } else {
      startDate = startOfWeek(selectedDate, { weekStartsOn: 1 })
      endDate = endOfWeek(selectedDate, { weekStartsOn: 1 })
    }

    const { data, error } = await supabase
      .from('timer_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Failed to fetch sessions')
      return
    }

    setSessions(data as TimerSession[])
  }

  const startTimer = async (type: 'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak') => {
    if (!user) {
      toast.error('Please log in to start a timer')
      return
    }

    const newSession: TimerSession = {
      id: Date.now().toString(),
      user_id: user.id,
      type,
      start_time: new Date().toISOString(),
      end_time: null,
      duration: 0,
      task_name: taskName,
    }

    const { data, error } = await supabase
      .from('timer_sessions')
      .insert(newSession)
      .select()
      .single()

    if (error) {
      console.error('Error starting timer:', error)
      toast.error('Failed to start timer')
      return
    }

    setActiveTimer(data)
    setTimeLeft(timerSettings[type] * 60)
    setIsRunning(true)
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} timer started`)
  }

  const stopTimer = async () => {
    if (!activeTimer) return

    const endTime = new Date()
    const duration = (endTime.getTime() - new Date(activeTimer.start_time).getTime()) / 60000

    const { error } = await supabase
      .from('timer_sessions')
      .update({
        end_time: endTime.toISOString(),
        duration: duration,
      })
      .eq('id', activeTimer.id)

    if (error) {
      console.error('Error stopping timer:', error)
      toast.error('Failed to stop timer')
      return
    }

    setActiveTimer(null)
    setIsRunning(false)
    setTimeLeft(0)
    fetchSessions()
    toast.success('Timer stopped')
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resumeTimer = () => {
    setIsRunning(true)
  }

  const resetTimer = () => {
    if (activeTimer) {
      setTimeLeft(timerSettings[activeTimer.type] * 60)
    }
    setIsRunning(false)
  }

  const handleTimerComplete = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play()
    }
    stopTimer()
    toast.success('Timer completed!')
    if (autoStartBreaks && activeTimer?.type === 'pomodoro') {
      startTimer('shortbreak')
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTotalDuration = (type: string) => {
    return sessions
      .filter(session => session.type === type)
      .reduce((acc, session) => acc + session.duration, 0)
  }

  const getChartData = () => {
    if (viewMode === 'day') {
      return sessions.map(session => ({
        time: format(new Date(session.start_time), 'HH:mm'),
        duration: session.duration,
        type: session.type,
      }))
    } else {
      const weekDays = eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      })

      return weekDays.map(day => {
        const daySessions = sessions.filter(session => 
          isSameDay(new Date(session.start_time), day)
        )
        return {
          day: format(day, 'EEE', { locale: fr }),
          pomodoro: daySessions.filter(s => s.type === 'pomodoro').reduce((acc, s) => acc + s.duration, 0),
          deepwork: daySessions.filter(s => s.type === 'deepwork').reduce((acc, s) => acc + s.duration, 0),
          shortbreak: daySessions.filter(s => s.type === 'shortbreak').reduce((acc, s) => acc + s.duration, 0),
          longbreak: daySessions.filter(s => s.type === 'longbreak').reduce((acc, s) => acc + s.duration, 0),
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-indigo-900">Productivity Timer</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-semibold text-indigo-700">
                  {activeTimer ? activeTimer.type.charAt(0).toUpperCase() + activeTimer.type.slice(1) : 'Ready to focus?'}
                </h2>
                <p className="text-7xl font-bold my-6 text-indigo-600">{formatTime(timeLeft)}</p>
                {activeTimer && (
                  <p className="text-indigo-500 mb-4">
                    Task: {activeTimer.task_name || 'No task specified'}
                  </p>
                )}
              </div>
              <div className="flex justify-center space-x-4 mb-6">
                {!activeTimer ? (
                  <>
                    <Button onClick={() => startTimer('pomodoro')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full">Pomodoro</Button>
                    <Button onClick={() => startTimer('deepwork')} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full">Deepwork</Button>
                    <Button onClick={() => startTimer('shortbreak')} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full">Short Break</Button>
                    <Button onClick={() => startTimer('longbreak')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full">Long Break</Button>
                  </>
                ) : (
                  <>
                    {isRunning ? (
                      <Button onClick={pauseTimer} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full">
                        <Pause className="mr-2 h-5 w-5" /> Pause
                      </Button>
                    ) : (
                      <Button onClick={resumeTimer} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full">
                        <Play className="mr-2 h-5 w-5" /> Resume
                      </Button>
                    )}
                    <Button onClick={stopTimer} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full">Stop</Button>
                    <Button onClick={resetTimer} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full">
                      <RotateCcw className="mr-2 h-5 w-5" /> Reset
                    </Button>
                  </>
                )}
              </div>
              <div className="flex justify-center">
                <Input
                  type="text"
                  placeholder="Enter task name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="max-w-xs mr-2 rounded-full"
                />
                <Button onClick={() => setShowSettings(!showSettings)} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full">
                  <Settings className="mr-2 h-5 w-5" />
                  {showSettings ? 'Hide' : 'Show'} Settings
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-xl p-8 mb-8"
                >
                  <h2 className="text-2xl mb-6 text-indigo-700">Timer Settings</h2>
                  <Tabs defaultValue="pomodoro">
                    <TabsList className="mb-6 grid w-full grid-cols-4 bg-indigo-100 rounded-full p-1">
                      <TabsTrigger value="pomodoro" className="rounded-full">Pomodoro</TabsTrigger>
                      <TabsTrigger value="deepwork" className="rounded-full">Deepwork</TabsTrigger>
                      <TabsTrigger value="shortbreak" className="rounded-full">Short Break</TabsTrigger>
                      <TabsTrigger value="longbreak" className="rounded-full">Long Break</TabsTrigger>
                    </TabsList>
                    {Object.entries(timerSettings).map(([key, value]) => (
                      <TabsContent key={key} value={key}>
                        <Slider
                          value={[value]}
                          onValueChange={(newValue) => setTimerSettings(prev => ({ ...prev, [key]: newValue[0] }))}
                          max={key.includes('break') ? 30 : 120}
                          step={1}
                          className="mb-4"
                        />
                        <p className="text-center text-indigo-600">Duration: {value} minutes</p>
                      </TabsContent>
                    ))}
                  </Tabs>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-indigo-700">Auto-start breaks</span>
                    <Switch checked={autoStartBreaks} onCheckedChange={setAutoStartBreaks} />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-indigo-700">Sound notifications</span>
                    <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                  </div>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl mb-6 text-center text-indigo-700">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-indigo-700">Total Pomodoros</h4>
                  <p className="text-2xl text-indigo-600">{sessions.filter(s => s.type === 'pomodoro').length}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-indigo-700">Total Deepwork</h4>
                  <p className="text-2xl text-indigo-600">{sessions.filter(s => s.type === 'deepwork').length}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-indigo-700">Productive Time</h4>
                  <p className="text-2xl text-indigo-600">{formatTime((getTotalDuration('pomodoro') + getTotalDuration('deepwork')) * 60)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-indigo-700">Break Time</h4>
                  <p className="text-2xl text-indigo-600">{formatTime((getTotalDuration('shortbreak') + getTotalDuration('longbreak')) * 60)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl mb-6 text-center text-indigo-700">Analytics</h2>
              <div className="flex justify-center mb-6">
                <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'day' | 'week')}>
                  <TabsList className="bg-indigo-100 rounded-full p-1">
                    <TabsTrigger value="day" className="rounded-full">Day</TabsTrigger>
                    <TabsTrigger value="week" className="rounded-full">Week</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="mb-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  className="rounded-xl border-indigo-200"
                  locale={fr}
                />
              </div>
              <div>
                <h3 className="text-xl mb-4 text-center text-indigo-700">Daily Timeline</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={viewMode === 'day' ? 'time' : 'day'} />
                    <YAxis />
                    <Tooltip />
                    {viewMode === 'day' ? (
                      <Line type="monotone" dataKey="duration" stroke="#6366f1" name="Duration (minutes)" />
                    ) : (
                      <>
                        <Line type="monotone" dataKey="pomodoro" stroke="#EF4444" name="Pomodoro" />
                        <Line type="monotone" dataKey="deepwork" stroke="#3B82F6" name="Deepwork" />
                        <Line type="monotone" dataKey="shortbreak" stroke="#10B981" name="Short Break" />
                        <Line type="monotone" dataKey="longbreak" stroke="#F59E0B" name="Long Break" />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimerPage