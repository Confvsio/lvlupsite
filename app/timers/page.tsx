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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { Calendar } from "@/components/ui/calendar"
import { format, startOfWeek, endOfWeek } from 'date-fns'
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
  const [activeTimer, setActiveTimer] = useState<'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak' | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [taskName, setTaskName] = useState('')
  const [analyticsData, setAnalyticsData] = useState<SessionData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
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
  }, [selectedDate, viewMode])

  const startTimer = async (type: 'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak') => {
    setActiveTimer(type)
    setTimeLeft(getTimerDuration(type))
    const { data, error } = await supabase.from('sessions').insert({
      type: type,
      start_time: new Date().toISOString(),
      duration: 0,
      task_name: taskName
    }).select()
    if (error) console.error('Erreur lors du démarrage du minuteur:', error)
    else fetchAnalytics()
  }

  const stopTimer = async () => {
    if (activeTimer) {
      const actualDuration = (getTimerDuration(activeTimer) - timeLeft) / 60
      const { error } = await supabase.from('sessions').update({
        end_time: new Date().toISOString(),
        duration: actualDuration
      }).eq('start_time', new Date(Date.now() - getTimerDuration(activeTimer) * 1000).toISOString())
      if (error) console.error('Erreur lors de l\'arrêt du minuteur:', error)
      else fetchAnalytics()
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
    let start, end;
    if (viewMode === 'day') {
      start = new Date(selectedDate)
      start.setHours(0, 0, 0, 0)
      end = new Date(selectedDate)
      end.setHours(23, 59, 59, 999)
    } else {
      start = startOfWeek(selectedDate, { weekStartsOn: 1 })
      end = endOfWeek(selectedDate, { weekStartsOn: 1 })
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des analyses:', error)
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
    { name: 'Travail Profond', value: getTotalDuration('deepwork') },
    { name: 'Pause Courte', value: getTotalDuration('shortbreak') },
    { name: 'Pause Longue', value: getTotalDuration('longbreak') },
  ].filter(item => item.value > 0)

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const weeklyData = [
    { name: 'Lun', pomodoro: 0, deepwork: 0 },
    { name: 'Mar', pomodoro: 0, deepwork: 0 },
    { name: 'Mer', pomodoro: 0, deepwork: 0 },
    { name: 'Jeu', pomodoro: 0, deepwork: 0 },
    { name: 'Ven', pomodoro: 0, deepwork: 0 },
    { name: 'Sam', pomodoro: 0, deepwork: 0 },
    { name: 'Dim', pomodoro: 0, deepwork: 0 },
  ]

  analyticsData.forEach(session => {
    const day = new Date(session.start_time).getDay()
    const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][day]
    const dayData = weeklyData.find(d => d.name === dayName)
    if (dayData) {
      if (session.type === 'pomodoro') {
        dayData.pomodoro += session.duration
      } else if (session.type === 'deepwork') {
        dayData.deepwork += session.duration
      }
    }
  })

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Minuteur de Productivité</h1>
      
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
                  activeTimer === 'pomodoro' ? 'Pomodoro' :
                  activeTimer === 'deepwork' ? 'Travail Profond' :
                  activeTimer === 'shortbreak' ? 'Pause Courte' : 'Pause Longue'
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
                <Button onClick={() => startTimer('deepwork')} className="h-24">Travail Profond<br/>{deepWorkTime}m</Button>
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

      <AnimatePresence>
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
                <TabsTrigger value="deepwork">Travail Profond</TabsTrigger>
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
      </AnimatePresence>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl mb-4 text-center">Analyses</h2>
        <div className="flex justify-center mb-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'day' | 'week')}>
            <TabsList>
              <TabsTrigger value="day">Jour</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl mb-2 text-center">Distribution du Temps</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-xl mb-2 text-center">
                  {viewMode === 'day' ? 'Chronologie Journalière' : 'Aperçu Hebdomadaire'}
                </h3>
                {viewMode === 'day' ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="start_time" tickFormatter={(time) => format(new Date(time), 'HH:mm')} />
                      <YAxis />
                      <Tooltip labelFormatter={(label) => format(new Date(label), 'HH:mm')} />
                      <Legend />
                      <Line type="monotone" dataKey="duration" stroke="#8884d8" name="Durée (minutes)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="pomodoro" fill="#8884d8" name="Pomodoro" />
                      <Bar dataKey="deepwork" fill="#82ca9d" name="Travail Profond" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date || new Date())}
              className="rounded-md border mb-4"
              locale={fr}
            />
            <div className="mt-4">
              <h3 className="text-xl mb-2">Statistiques Rapides</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Total Pomodoros</h4>
                  <p>{analyticsData.filter(s => s.type === 'pomodoro').length}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Total Travail Profond</h4>
                  <p>{analyticsData.filter(s => s.type === 'deepwork').length}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Temps Productif</h4>
                  <p>{formatTime(getTotalDuration('pomodoro') + getTotalDuration('deepwork'))}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Temps de Pause</h4>
                  <p>{formatTime(getTotalDuration('shortbreak') + getTotalDuration('longbreak'))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-xl mb-2 text-center">Résumé des Sessions</h3>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {analyticsData.map((session, index) => (
              <li key={index} className="bg-gray-100 p-2 rounded flex justify-between items-center">
                <span>
                  <span className="font-semibold">{format(new Date(session.start_time), 'HH:mm', { locale: fr })}</span>
                  <span className="ml-2">{
                    session.type === 'pomodoro' ? 'Pomodoro' :
                    session.type === 'deepwork' ? 'Travail Profond' :
                    session.type === 'shortbreak' ? 'Pause Courte' : 'Pause Longue'
                  }</span>
                </span>
                <span>
                  {session.duration.toFixed(1)} minutes
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