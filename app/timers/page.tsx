'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar } from "@/components/ui/calendar"
import gsap from 'gsap'

// Define an interface for the session data
interface SessionData {
  start_time: string;
  end_time?: string;
  type: string;
  duration: number;
  task_name?: string;
}

const TimerPage = () => {
  const [pomodoroTime, setPomodoroTime] = useState(25)
  const [deepWorkTime, setDeepWorkTime] = useState(60)
  const [shortBreakTime, setShortBreakTime] = useState(5)
  const [longBreakTime, setLongBreakTime] = useState(15)
  const [activeTimer, setActiveTimer] = useState<'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak' | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [taskName, setTaskName] = useState('')
  const [analyticsData, setAnalyticsData] = useState<SessionData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (activeTimer && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (activeTimer && timeLeft === 0) {
      handleTimerComplete()
    }
  }, [activeTimer, timeLeft])

  useEffect(() => {
    fetchAnalytics()
  }, [selectedDate])

  const startTimer = (type: 'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak') => {
    setActiveTimer(type)
    setTimeLeft(getTimerDuration(type))
    supabase.from('sessions').insert({
      type: type,
      start_time: new Date().toISOString(),
      duration: getTimerDuration(type) / 60,
      task_name: taskName
    })
  }

  const stopTimer = () => {
    setActiveTimer(null)
    setTimeLeft(0)
    supabase.from('sessions').update({
      end_time: new Date().toISOString()
    }).eq('start_time', new Date(Date.now() - timeLeft * 1000).toISOString())
  }

  const handleTimerComplete = () => {
    if (soundEnabled) {
      // Play sound
    }
    if (autoStartBreaks && activeTimer === 'pomodoro') {
      startTimer('shortbreak')
    } else {
      stopTimer()
    }
  }

  const getTimerDuration = (type: string): number => {
    switch (type) {
      case 'pomodoro': return pomodoroTime * 60
      case 'deepwork': return deepWorkTime * 60
      case 'shortbreak': return shortBreakTime * 60
      case 'longbreak': return longBreakTime * 60
      default: return 0
    }
  }

  const fetchAnalytics = async () => {
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching analytics:', error)
      return
    }

    setAnalyticsData(data as SessionData[])
  }

  useEffect(() => {
    gsap.to('.timer-text', {
      scale: 1.1,
      duration: 0.5,
      yoyo: true,
      repeat: -1
    })
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-8 bg-gray-100 min-h-screen"
    >
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Timers</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Tabs defaultValue="pomodoro">
            <TabsList className="mb-4">
              <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
              <TabsTrigger value="deepwork">Deep Work</TabsTrigger>
              <TabsTrigger value="breaks">Breaks</TabsTrigger>
            </TabsList>
            <TabsContent value="pomodoro">
              <h2 className="text-2xl mb-4">Pomodoro Timer</h2>
              <Slider
                value={[pomodoroTime]}
                onValueChange={(value) => setPomodoroTime(value[0])}
                max={60}
                step={1}
                className="mb-2"
              />
              <p>Duration: {pomodoroTime} minutes</p>
            </TabsContent>
            <TabsContent value="deepwork">
              <h2 className="text-2xl mb-4">Deep Work Timer</h2>
              <Slider
                value={[deepWorkTime]}
                onValueChange={(value) => setDeepWorkTime(value[0])}
                max={240}
                step={5}
                className="mb-2"
              />
              <p>Duration: {deepWorkTime} minutes</p>
            </TabsContent>
            <TabsContent value="breaks">
              <h2 className="text-2xl mb-4">Break Timers</h2>
              <div className="mb-4">
                <h3 className="text-lg mb-2">Short Break</h3>
                <Slider
                  value={[shortBreakTime]}
                  onValueChange={(value) => setShortBreakTime(value[0])}
                  max={15}
                  step={1}
                  className="mb-2"
                />
                <p>Duration: {shortBreakTime} minutes</p>
              </div>
              <div>
                <h3 className="text-lg mb-2">Long Break</h3>
                <Slider
                  value={[longBreakTime]}
                  onValueChange={(value) => setLongBreakTime(value[0])}
                  max={30}
                  step={1}
                  className="mb-2"
                />
                <p>Duration: {longBreakTime} minutes</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl mb-4">Active Timer</h2>
          <AnimatePresence>
            {activeTimer ? (
              <motion.div
                key="active-timer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <p className="timer-text text-6xl font-bold mb-4 text-center">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
                <Button onClick={stopTimer} className="w-full">Stop</Button>
              </motion.div>
            ) : (
              <motion.div
                key="timer-buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 gap-4"
              >
                <Button onClick={() => startTimer('pomodoro')}>Start Pomodoro</Button>
                <Button onClick={() => startTimer('deepwork')}>Start Deep Work</Button>
                <Button onClick={() => startTimer('shortbreak')}>Short Break</Button>
                <Button onClick={() => startTimer('longbreak')}>Long Break</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">Settings</h2>
        <div className="flex items-center justify-between mb-4">
          <span>Auto-start breaks</span>
          <Switch
            checked={autoStartBreaks}
            onCheckedChange={setAutoStartBreaks}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <span>Sound notifications</span>
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="taskName" className="block mb-2">Task Name</label>
          <Input
            id="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task name"
          />
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">Analytics</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date || new Date())}
              className="rounded-md border"
            />
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="start_time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="duration" stroke="#8884d8" name="Duration (minutes)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl mb-2">Session Summary</h3>
          <ul>
            {analyticsData.map((session, index) => (
              <li key={index} className="mb-2">
                {new Date(session.start_time).toLocaleTimeString()} - {session.type}: {session.duration} minutes
                {session.task_name && ` (${session.task_name})`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

export default TimerPage