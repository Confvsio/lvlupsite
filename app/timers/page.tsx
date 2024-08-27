'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TimerType = 'pomodoro' | 'deepWork'
type TimerState = 'idle' | 'running' | 'paused' | 'break'

export default function TimersPage() {
  const [timerType, setTimerType] = useState<TimerType>('pomodoro')
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [pomoDuration, setPomoDuration] = useState(25)
  const [deepWorkDuration, setDeepWorkDuration] = useState(60)
  const [shortBreakDuration, setShortBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [autoBreak, setAutoBreak] = useState(false)
  const [notificationSound, setNotificationSound] = useState('notification.mp3')
  const [dailySessions, setDailySessions] = useState(0)
  const [weeklySessions, setWeeklySessions] = useState(0)

  const user = useUser()
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timerState === 'running') {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval!)
            handleTimerComplete()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerState])

  const fetchUserData = async () => {
    const { data, error } = await supabase
      .from('user_timer_data')
      .select('*')
      .eq('user_id', user!.id)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error)
    } else if (data) {
      setPomoDuration(data.pomo_duration)
      setDeepWorkDuration(data.deep_work_duration)
      setShortBreakDuration(data.short_break_duration)
      setLongBreakDuration(data.long_break_duration)
      setAutoBreak(data.auto_break)
      setNotificationSound(data.notification_sound)
      setDailySessions(data.daily_sessions)
      setWeeklySessions(data.weekly_sessions)
    }
  }

  const updateUserData = async () => {
    const { error } = await supabase
      .from('user_timer_data')
      .upsert({
        user_id: user!.id,
        pomo_duration: pomoDuration,
        deep_work_duration: deepWorkDuration,
        short_break_duration: shortBreakDuration,
        long_break_duration: longBreakDuration,
        auto_break: autoBreak,
        notification_sound: notificationSound,
        daily_sessions: dailySessions,
        weekly_sessions: weeklySessions,
      })

    if (error) {
      console.error('Erreur lors de la mise à jour des données utilisateur:', error)
    }
  }

  const handleTimerComplete = () => {
    playNotificationSound()
    if (autoBreak) {
      startBreak()
    } else {
      setTimerState('idle')
    }
    updateSessionCount()
  }

  const updateSessionCount = () => {
    setDailySessions((prev) => prev + 1)
    setWeeklySessions((prev) => prev + 1)
    updateUserData()
  }

  const playNotificationSound = () => {
    const audio = new Audio(notificationSound)
    audio.play()
  }

  const startTimer = () => {
    setTimerState('running')
    setTimeLeft(timerType === 'pomodoro' ? pomoDuration * 60 : deepWorkDuration * 60)
  }

  const pauseTimer = () => {
    setTimerState('paused')
  }

  const resumeTimer = () => {
    setTimerState('running')
  }

  const resetTimer = () => {
    setTimerState('idle')
    setTimeLeft(timerType === 'pomodoro' ? pomoDuration * 60 : deepWorkDuration * 60)
  }

  const startBreak = () => {
    setTimerState('break')
    setTimeLeft(shortBreakDuration * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Minuteries de Productivité</h1>

      <Tabs defaultValue="pomodoro" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pomodoro" onClick={() => setTimerType('pomodoro')}>Pomodoro</TabsTrigger>
          <TabsTrigger value="deepWork" onClick={() => setTimerType('deepWork')}>Deep Work</TabsTrigger>
        </TabsList>
        <TabsContent value="pomodoro">
          <Card>
            <CardHeader>
              <CardTitle>Minuterie Pomodoro</CardTitle>
              <CardDescription>Concentrez-vous pendant 25 minutes, puis faites une courte pause.</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-6xl font-bold text-center mb-4"
                key={timeLeft}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              <div className="flex justify-center space-x-4 mb-4">
                {timerState === 'idle' && (
                  <Button onClick={startTimer}>Démarrer</Button>
                )}
                {timerState === 'running' && (
                  <Button onClick={pauseTimer}>Pause</Button>
                )}
                {timerState === 'paused' && (
                  <Button onClick={resumeTimer}>Reprendre</Button>
                )}
                {timerState !== 'idle' && (
                  <Button onClick={resetTimer} variant="outline">Réinitialiser</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="deepWork">
          <Card>
            <CardHeader>
              <CardTitle>Minuterie Deep Work</CardTitle>
              <CardDescription>Concentrez-vous pendant une longue période sans interruption.</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-6xl font-bold text-center mb-4"
                key={timeLeft}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              <div className="flex justify-center space-x-4 mb-4">
                {timerState === 'idle' && (
                  <Button onClick={startTimer}>Démarrer</Button>
                )}
                {timerState === 'running' && (
                  <Button onClick={pauseTimer}>Pause</Button>
                )}
                {timerState === 'paused' && (
                  <Button onClick={resumeTimer}>Reprendre</Button>
                )}
                {timerState !== 'idle' && (
                  <Button onClick={resetTimer} variant="outline">Réinitialiser</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Paramètres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Durée Pomodoro (minutes)</label>
              <Slider
                value={[pomoDuration]}
                onValueChange={(value) => setPomoDuration(value[0])}
                max={60}
                step={1}
              />
            </div>
            <div>
              <label className="block mb-2">Durée Deep Work (minutes)</label>
              <Slider
                value={[deepWorkDuration]}
                onValueChange={(value) => setDeepWorkDuration(value[0])}
                max={180}
                step={5}
              />
            </div>
            <div>
              <label className="block mb-2">Durée pause courte (minutes)</label>
              <Slider
                value={[shortBreakDuration]}
                onValueChange={(value) => setShortBreakDuration(value[0])}
                max={15}
                step={1}
              />
            </div>
            <div>
              <label className="block mb-2">Durée pause longue (minutes)</label>
              <Slider
                value={[longBreakDuration]}
                onValueChange={(value) => setLongBreakDuration(value[0])}
                max={30}
                step={1}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Pause automatique</span>
              <Switch
                checked={autoBreak}
                onCheckedChange={setAutoBreak}
              />
            </div>
            <div>
              <label className="block mb-2">Son de notification</label>
              <Select value={notificationSound} onValueChange={setNotificationSound}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un son" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification.mp3">Son par défaut</SelectItem>
                  <SelectItem value="bell.mp3">Cloche</SelectItem>
                  <SelectItem value="chime.mp3">Carillon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={updateUserData}>Sauvegarder les paramètres</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Sessions aujourd'hui</p>
              <p className="text-2xl">{dailySessions}</p>
            </div>
            <div>
              <p className="font-semibold">Sessions cette semaine</p>
              <p className="text-2xl">{weeklySessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}