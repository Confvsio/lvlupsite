// app/timers/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Calendar } from "@/components/ui/calendar"
import { format, startOfDay, endOfDay } from 'date-fns'
import { Bell, Settings } from 'lucide-react'

interface SessionData {
  id: string;
  start_time: string;
  end_time?: string;
  type: string;
  duration: number;
  task_name?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
  const [showSettings, setShowSettings] = useState(false)
  const supabase = useSupabaseClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3')
    fetchAnalytics()
  }, [])

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

  const startTimer = async (type: 'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak') => {
    setActiveTimer(type)
    setTimeLeft(getTimerDuration(type))
    const { data, error } = await supabase.from('sessions').insert({
      type: type,
      start_time: new Date().toISOString(),
      duration: getTimerDuration(type) / 60,
      task_name: taskName
    }).select()
    if (error) console.error('Error starting timer:', error)
    else fetchAnalytics() // Refresh analytics after starting a new session
  }

  const stopTimer = async () => {
    if (activeTimer) {
      const { error } = await supabase.from('sessions').update({
        end_time: new Date().toISOString()
      }).eq('start_time', new Date(Date.now() - timeLeft * 1000).toISOString())
      if (error) console.error('Error stopping timer:', error)
      else fetchAnalytics() // Refresh analytics after stopping a session
    }
    setActiveTimer(null)
    setTimeLeft(0)
  }

  const handleTimerComplete = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play()
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
    const start = startOfDay(selectedDate)
    const end = endOfDay(selectedDate)

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching analytics:', error)
      return
    }

    setAnalyticsData(data as SessionData[])
  }

  const getTotalDuration = (type: string) => {
    return analyticsData
      .filter(session => session.type === type)
      .reduce((acc, session) => acc + session.duration, 0)
  }

  const pieChartData = [
    { name: 'Pomodoro', value: getTotalDuration('pomodoro') },
    { name: 'Deep Work', value: getTotalDuration('deepwork') },
    { name: 'Short Break', value: getTotalDuration('shortbreak') },
    { name: 'Long Break', value: getTotalDuration('longbreak') },
  ]

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Productivity Timer</h1>
      
      <div className="flex flex-col items-center mb-8">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <AnimatePresence mode="wait">
            {activeTimer ? (
              <motion.div
                key="active-timer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <h2 className="text-2xl mb-4">{activeTimer.charAt(0).toUpperCase() + activeTimer.slice(1)}</h2>
                <p className="text-6xl font-bold mb-8">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
                <Button onClick={stopTimer} className="w-full">Stop</Button>
              </motion.div>
            ) : (
              <motion.div
                key="timer-buttons"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="grid grid-cols-2 gap-4"
              >
                <Button onClick={() => startTimer('pomodoro')} className="h-24">Pomodoro<br/>{pomodoroTime}m</Button>
                <Button onClick={() => startTimer('deepwork')} className="h-24">Deep Work<br/>{deepWorkTime}m</Button>
                <Button onClick={() => startTimer('shortbreak')} className="h-24">Short Break<br/>{shortBreakTime}m</Button>
                <Button onClick={() => startTimer('longbreak')} className="h-24">Long Break<br/>{longBreakTime}m</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Button onClick={() => setShowSettings(!showSettings)} className="mt-4">
          <Settings className="mr-2" />
          {showSettings ? 'Hide' : 'Show'} Settings
        </Button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-lg shadow-lg mb-8 overflow-hidden"
          >
            <h2 className="text-2xl mb-4">Settings</h2>
            <Tabs defaultValue="pomodoro">
              <TabsList className="mb-4 grid w-full grid-cols-4">
                <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
                <TabsTrigger value="deepwork">Deep Work</TabsTrigger>
                <TabsTrigger value="shortbreak">Short Break</TabsTrigger>
                <TabsTrigger value="longbreak">Long Break</TabsTrigger>
              </TabsList>
              <TabsContent value="pomodoro">
                <Slider value={[pomodoroTime]} onValueChange={(value) => setPomodoroTime(value[0])} max={60} step={1} className="mb-2" />
                <p>Duration: {pomodoroTime} minutes</p>
              </TabsContent>
              <TabsContent value="deepwork">
                <Slider value={[deepWorkTime]} onValueChange={(value) => setDeepWorkTime(value[0])} max={240} step={5} className="mb-2" />
                <p>Duration: {deepWorkTime} minutes</p>
              </TabsContent>
              <TabsContent value="shortbreak">
                <Slider value={[shortBreakTime]} onValueChange={(value) => setShortBreakTime(value[0])} max={15} step={1} className="mb-2" />
                <p>Duration: {shortBreakTime} minutes</p>
              </TabsContent>
              <TabsContent value="longbreak">
                <Slider value={[longBreakTime]} onValueChange={(value) => setLongBreakTime(value[0])} max={30} step={1} className="mb-2" />
                <p>Duration: {longBreakTime} minutes</p>
              </TabsContent>
            </Tabs>
            <div className="flex items-center justify-between mt-4">
              <span>Auto-start breaks</span>
              <Switch checked={autoStartBreaks} onCheckedChange={setAutoStartBreaks} />
            </div>
            <div className="flex items-center justify-between mt-4">
              <span>Sound notifications</span>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
            <div className="mt-4">
              <label htmlFor="taskName" className="block mb-2">Task Name</label>
              <Input id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="Enter task name" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
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
            <h3 className="text-xl mb-2">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Total Pomodoros</h4>
                <p>{analyticsData.filter(s => s.type === 'pomodoro').length}</p>
              </div>
              <div>
                <h4 className="font-semibold">Total Deep Work</h4>
                <p>{analyticsData.filter(s => s.type === 'deepwork').length}</p>
              </div>
              <div>
                <h4 className="font-semibold">Productive Time</h4>
                <p>{formatTime(getTotalDuration('pomodoro') + getTotalDuration('deepwork'))}</p>
              </div>
              <div>
                <h4 className="font-semibold">Break Time</h4>
                <p>{formatTime(getTotalDuration('shortbreak') + getTotalDuration('longbreak'))}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl mb-2">Time Distribution</h3>
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-xl mb-2">Session Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="start_time" tickFormatter={(time) => format(new Date(time), 'HH:mm')} />
                <YAxis />
                <Tooltip labelFormatter={(label) => format(new Date(label), 'HH:mm')} />
                <Legend />
                <Line type="monotone" dataKey="duration" stroke="#8884d8" name="Duration (minutes)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-xl mb-2">Session Summary</h3>
          <ul className="space-y-2">
            {analyticsData.map((session, index) => (
                            <li key={index} className="bg-gray-100 p-2 rounded flex justify-between items-center">
                            <span>
                              <span className="font-semibold">{format(new Date(session.start_time), 'HH:mm')}</span>
                              <span className="ml-2">{session.type.charAt(0).toUpperCase() + session.type.slice(1)}</span>
                            </span>
                            <span>
                              {session.duration} minutes
                              {session.task_name && <span className="ml-2 text-gray-600">({session.task_name})</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            }
            
            export default TimerPage