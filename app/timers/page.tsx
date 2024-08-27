// app/timers/page.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Settings } from 'lucide-react'

interface SessionData {
  id: string;
  start_time: string;
  end_time?: string;
  type: string;
  duration: number;
  task_name?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TimerPage: React.FC = () => {
  const [pomodoroTime, setPomodoroTime] = useState(25)
  const [deepWorkTime, setDeepWorkTime] = useState(60)
  const [shortBreakTime, setShortBreakTime] = useState(5)
  const [longBreakTime, setLongBreakTime] = useState(15)
  const [activeTimer, setActiveTimer] = useState<SessionData | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [taskName, setTaskName] = useState('')
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [pieChartData, setPieChartData] = useState<{ name: string; value: number }[]>([])
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now())
  const supabase = useSupabaseClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3')
    fetchSessions()
  }, [])

  useEffect(() => {
    if (activeTimer && timeLeft > 0) {
      const tickTimer = () => {
        const now = Date.now()
        const delta = now - lastTickTime
        setLastTickTime(now)
        setTimeLeft(prevTime => Math.max(0, prevTime - Math.round(delta / 1000)))
      }

      const timerInterval = setInterval(tickTimer, 1000)
      return () => clearInterval(timerInterval)
    } else if (activeTimer && timeLeft === 0) {
      handleTimerComplete()
    }
  }, [activeTimer, timeLeft, lastTickTime])

  useEffect(() => {
    fetchSessions()
  }, [selectedDate])

  const startTimer = async (type: 'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak') => {
    const duration = getTimerDuration(type)
    const newSession: SessionData = {
      id: Date.now().toString(),
      type,
      start_time: new Date().toISOString(),
      duration: 0,
      task_name: taskName
    }
    setActiveTimer(newSession)
    setTimeLeft(duration)
    setLastTickTime(Date.now())
    const { error } = await supabase.from('sessions').insert(newSession)
    if (error) console.error('Erreur lors du démarrage du minuteur:', error)
  }

  const stopTimer = async () => {
    if (activeTimer) {
      const endTime = new Date()
      const actualDuration = (endTime.getTime() - new Date(activeTimer.start_time).getTime()) / 60000 // Convert to minutes
      const { error } = await supabase.from('sessions').update({
        end_time: endTime.toISOString(),
        duration: actualDuration
      }).eq('id', activeTimer.id)
      if (error) console.error('Erreur lors de l\'arrêt du minuteur:', error)
      else {
        await fetchSessions()
        updateQuickStats()
      }
    }
    setActiveTimer(null)
    setTimeLeft(0)
  }

  const handleTimerComplete = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play()
    }
    stopTimer()
    if (autoStartBreaks && activeTimer?.type === 'pomodoro') {
      startTimer('shortbreak')
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

  const fetchSessions = async () => {
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
      console.error('Erreur lors de la récupération des sessions:', error)
      return
    }

    setSessions(data as SessionData[])
    updateQuickStats()
  }

  const getTotalDuration = (type: string) => {
    return sessions
      .filter(session => session.type === type)
      .reduce((acc, session) => acc + session.duration, 0)
  }

  const updateQuickStats = () => {
    setPieChartData([
      { name: 'Pomodoro', value: getTotalDuration('pomodoro') },
      { name: 'Deepwork', value: getTotalDuration('deepwork') },
      { name: 'Pause Courte', value: getTotalDuration('shortbreak') },
      { name: 'Pause Longue', value: getTotalDuration('longbreak') },
    ].filter(item => item.value > 0))
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Timers</h1>
      
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
                <h2 className="text-2xl mb-4">{
                  activeTimer.type === 'pomodoro' ? 'Pomodoro' :
                  activeTimer.type === 'deepwork' ? 'Deepwork' :
                  activeTimer.type === 'shortbreak' ? 'Pause Courte' : 'Pause Longue'
                }</h2>
                <p className="text-6xl font-bold mb-8">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
                <Button onClick={stopTimer} className="w-full">Arrêter</Button>
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
                <Button onClick={() => startTimer('deepwork')} className="h-24">Deepwork<br/>{deepWorkTime}m</Button>
                <Button onClick={() => startTimer('shortbreak')} className="h-24">Pause Courte<br/>{shortBreakTime}m</Button>
                <Button onClick={() => startTimer('longbreak')} className="h-24">Pause Longue<br/>{longBreakTime}m</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Button onClick={() => setShowSettings(!showSettings)} className="mt-4">
          <Settings className="mr-2" />
          {showSettings ? 'Masquer' : 'Afficher'} les Paramètres
        </Button>
      </div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white p-6 rounded-lg shadow-lg mb-8 overflow-hidden"
        >
          <h2 className="text-2xl mb-4">Paramètres</h2>
          <Tabs defaultValue="pomodoro">
            <TabsList className="mb-4 grid w-full grid-cols-4">
              <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
              <TabsTrigger value="deepwork">Deepwork</TabsTrigger>
              <TabsTrigger value="shortbreak">Pause Courte</TabsTrigger>
              <TabsTrigger value="longbreak">Pause Longue</TabsTrigger>
            </TabsList>
            <TabsContent value="pomodoro">
              <Slider value={[pomodoroTime]} onValueChange={(value) => setPomodoroTime(value[0])} max={60} step={1} className="mb-2" />
              <p>Durée : {pomodoroTime} minutes</p>
            </TabsContent>
            <TabsContent value="deepwork">
              <Slider value={[deepWorkTime]} onValueChange={(value) => setDeepWorkTime(value[0])} max={240} step={5} className="mb-2" />
              <p>Durée : {deepWorkTime} minutes</p>
            </TabsContent>
            <TabsContent value="shortbreak">
              <Slider value={[shortBreakTime]} onValueChange={(value) => setShortBreakTime(value[0])} max={15} step={1} className="mb-2" />
              <p>Durée : {shortBreakTime} minutes</p>
            </TabsContent>
            <TabsContent value="longbreak">
              <Slider value={[longBreakTime]} onValueChange={(value) => setLongBreakTime(value[0])} max={30} step={1} className="mb-2" />
              <p>Durée : {longBreakTime} minutes</p>
            </TabsContent>
          </Tabs>
          <div className="flex items-center justify-between mt-4">
            <span>Démarrer automatiquement les pauses</span>
            <Switch checked={autoStartBreaks} onCheckedChange={setAutoStartBreaks} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span>Notifications sonores</span>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
          <div className="mt-4">
            <label htmlFor="taskName" className="block mb-2">Nom de la tâche</label>
            <Input id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="Entrez le nom de la tâche" />
          </div>
        </motion.div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl mb-4 text-center">Analyses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl mb-2 text-center">Distribution du Temps</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap justify-center">
              {pieChartData.map((entry, index) => (
                <div key={index} className="flex items-center mr-4 mb-2">
                  <div className="w-4 h-4 mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span>{entry.name}: {((entry.value / pieChartData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl mb-2 text-center">Statistiques Rapides</h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-semibold text-sm">Total Pomodoros</h4>
                <p className="text-lg">{sessions.filter(s => s.type === 'pomodoro').length}</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-semibold text-sm">Total Deepwork</h4>
                <p className="text-lg">{sessions.filter(s => s.type === 'deepwork').length}</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-semibold text-sm">Temps Productif</h4>
                <p className="text-lg">{formatTime(getTotalDuration('pomodoro') + getTotalDuration('deepwork'))}</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-semibold text-sm">Temps de Pause</h4>
                <p className="text-lg">{formatTime(getTotalDuration('shortbreak') + getTotalDuration('longbreak'))}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => setSelectedDate(date || new Date())}
            className="rounded-md border shadow-md"
            locale={fr}
          />
        </div>
      </div>
    </div>
  )
}

export default TimerPage