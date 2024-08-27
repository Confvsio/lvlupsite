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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Calendar } from "@/components/ui/calendar"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Settings, Play, Pause, RotateCcw } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TimerSession {
  id: string
  user_id: string
  type: 'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak'
  start_time: string
  end_time: string | null
  duration: number
  task_name: string
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']

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

  const pieChartData = [
    { name: 'Pomodoro', value: getTotalDuration('pomodoro') },
    { name: 'Deepwork', value: getTotalDuration('deepwork') },
    { name: 'Short Break', value: getTotalDuration('shortbreak') },
    { name: 'Long Break', value: getTotalDuration('longbreak') },
  ].filter(item => item.value > 0)

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
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Productivity Timer</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold">
            {activeTimer ? activeTimer.type.charAt(0).toUpperCase() + activeTimer.type.slice(1) : 'Select a Timer'}
          </h2>
          <p className="text-6xl font-bold my-4">{formatTime(timeLeft)}</p>
          {activeTimer && (
            <p className="text-gray-600 mb-4">
              Task: {activeTimer.task_name || 'No task specified'}
            </p>
          )}
        </div>
        <div className="flex justify-center space-x-4 mb-4">
          {!activeTimer ? (
            <>
              <Button onClick={() => startTimer('pomodoro')} className="bg-red-500 hover:bg-red-600">Pomodoro</Button>
              <Button onClick={() => startTimer('deepwork')} className="bg-blue-500 hover:bg-blue-600">Deepwork</Button>
              <Button onClick={() => startTimer('shortbreak')} className="bg-green-500 hover:bg-green-600">Short Break</Button>
              <Button onClick={() => startTimer('longbreak')} className="bg-yellow-500 hover:bg-yellow-600">Long Break</Button>
            </>
          ) : (
            <>
              {isRunning ? (
                <Button onClick={pauseTimer} className="bg-yellow-500 hover:bg-yellow-600">
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </Button>
              ) : (
                <Button onClick={resumeTimer} className="bg-green-500 hover:bg-green-600">
                  <Play className="mr-2 h-4 w-4" /> Resume
                </Button>
              )}
              <Button onClick={stopTimer} className="bg-red-500 hover:bg-red-600">Stop</Button>
              <Button onClick={resetTimer} className="bg-blue-500 hover:bg-blue-600">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
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
            className="max-w-xs mr-2"
          />
          <Button onClick={() => setShowSettings(!showSettings)}>
            <Settings className="mr-2 h-4 w-4" />
            {showSettings ? 'Hide' : 'Show'} Settings
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-lg shadow-lg mb-8 overflow-hidden"
          >
            <h2 className="text-2xl mb-4">Timer Settings</h2>
            <Tabs defaultValue="pomodoro">
              <TabsList className="mb-4 grid w-full grid-cols-4">
                <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
                <TabsTrigger value="deepwork">Deepwork</TabsTrigger>
                <TabsTrigger value="shortbreak">Short Break</TabsTrigger>
                <TabsTrigger value="longbreak">Long Break</TabsTrigger>
              </TabsList>
              {Object.entries(timerSettings).map(([key, value]) => (
                <TabsContent key={key} value={key}>
                  <Slider
                    value={[value]}
                    onValueChange={(newValue) => setTimerSettings(prev => ({ ...prev, [key]: newValue[0] }))}
                    max={key.includes('break') ? 30 : 120}
                    step={1}
                    className="mb-2"
                  />
                  <p>Duration: {value} minutes</p>
                </TabsContent>
              ))}
            </Tabs>
            <div className="flex items-center justify-between mt-4">
              <span>Auto-start breaks</span>
              <Switch checked={autoStartBreaks} onCheckedChange={setAutoStartBreaks} />
            </div>
            <div className="flex items-center justify-between mt-4">
              <span>Sound notifications</span>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl mb-4 text-center">Analytics</h2>
        <div className="flex justify-center mb-4">
        <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'day' | 'week')}>
  <TabsList>
    <TabsTrigger value="day">Day</TabsTrigger>
    <TabsTrigger value="week">Week</TabsTrigger>
  </TabsList>
</Tabs>
        </div>        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl mb-2 text-center">Time Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-xl mb-2 text-center">
              {viewMode === 'day' ? 'Daily Timeline' : 'Weekly Overview'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              {viewMode === 'day' ? (
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="duration" stroke="#8884d8" name="Duration (minutes)" />
                </LineChart>
              ) : (
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pomodoro" stroke={COLORS[0]} name="Pomodoro" />
                  <Line type="monotone" dataKey="deepwork" stroke={COLORS[1]} name="Deepwork" />
                  <Line type="monotone" dataKey="shortbreak" stroke={COLORS[2]} name="Short Break" />
                  <Line type="monotone" dataKey="longbreak" stroke={COLORS[3]} name="Long Break" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-xl mb-2 text-center">Date Selection</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date || new Date())}
              className="rounded-md border shadow-md"
              locale={fr}
            />
          </div>
          <div>
            <h3 className="text-xl mb-2 text-center">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold">Total Pomodoros</h4>
                <p className="text-2xl">{sessions.filter(s => s.type === 'pomodoro').length}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold">Total Deepwork</h4>
                <p className="text-2xl">{sessions.filter(s => s.type === 'deepwork').length}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold">Productive Time</h4>
                <p className="text-2xl">{formatTime((getTotalDuration('pomodoro') + getTotalDuration('deepwork')) * 60)}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold">Break Time</h4>
                <p className="text-2xl">{formatTime((getTotalDuration('shortbreak') + getTotalDuration('longbreak')) * 60)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimerPage