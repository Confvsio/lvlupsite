'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import debounce from 'lodash/debounce'

type TimerType = 'pomodoro' | 'deepWork'
type TimerState = 'idle' | 'running' | 'paused' | 'break'

export default function TimersPage() {
  const [timerType, setTimerType] = useState<TimerType>('pomodoro')
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [pomoDuration, setPomoDuration] = useState(25)
  const [deepWorkDuration, setDeepWorkDuration] = useState(60)
  const [pomoShortBreak, setPomoShortBreak] = useState(5)
  const [pomoLongBreak, setPomoLongBreak] = useState(15)
  const [deepWorkBreak, setDeepWorkBreak] = useState(10)
  const [autoBreak, setAutoBreak] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [dailySessions, setDailySessions] = useState({ pomodoro: 0, deepWork: 0 })
  const [weeklySessions, setWeeklySessions] = useState({ pomodoro: 0, deepWork: 0 })
  const [totalFocusTime, setTotalFocusTime] = useState({ pomodoro: 0, deepWork: 0 })
  const [longestStreak, setLongestStreak] = useState({ pomodoro: 0, deepWork: 0 })
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  const user = useUser()
  const supabase = useSupabaseClient()

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
      setPomoShortBreak(data.pomo_short_break)
      setPomoLongBreak(data.pomo_long_break)
      setDeepWorkBreak(data.deep_work_break)
      setAutoBreak(data.auto_break)
      setSoundEnabled(data.sound_enabled)
      setDailySessions(data.daily_sessions)
      setWeeklySessions(data.weekly_sessions)
      setTotalFocusTime(data.total_focus_time)
      setLongestStreak(data.longest_streak)
      setWeeklyData(data.weekly_data || [])
    }
  }

  const updateUserData = useCallback(async () => {
    const { error } = await supabase
      .from('user_timer_data')
      .upsert({
        user_id: user!.id,
        pomo_duration: pomoDuration,
        deep_work_duration: deepWorkDuration,
        pomo_short_break: pomoShortBreak,
        pomo_long_break: pomoLongBreak,
        deep_work_break: deepWorkBreak,
        auto_break: autoBreak,
        sound_enabled: soundEnabled,
        daily_sessions: dailySessions,
        weekly_sessions: weeklySessions,
        total_focus_time: totalFocusTime,
        longest_streak: longestStreak,
        weekly_data: weeklyData,
      })

    if (error) {
      console.error('Erreur lors de la mise à jour des données utilisateur:', error)
    }
  }, [user, pomoDuration, deepWorkDuration, pomoShortBreak, pomoLongBreak, deepWorkBreak, autoBreak, soundEnabled, dailySessions, weeklySessions, totalFocusTime, longestStreak, weeklyData, supabase])

  const debouncedUpdateUserData = useCallback(
    debounce(() => {
      updateUserData()
    }, 500),
    [updateUserData]
  )

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

  useEffect(() => {
    resetTimer()
  }, [pomoDuration, deepWorkDuration, timerType])

  useEffect(() => {
    debouncedUpdateUserData()
  }, [pomoDuration, deepWorkDuration, pomoShortBreak, pomoLongBreak, deepWorkBreak, autoBreak, soundEnabled, dailySessions, weeklySessions, totalFocusTime, longestStreak, weeklyData])

  const handleTimerComplete = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound()
    }
    if (autoBreak) {
      startBreak()
    } else {
      setTimerState('idle')
    }
    updateSessionCount()
  }, [soundEnabled, autoBreak])

  const updateSessionCount = useCallback(() => {
    const newDailySessions = {
      ...dailySessions,
      [timerType]: dailySessions[timerType] + 1
    }
    const newWeeklySessions = {
      ...weeklySessions,
      [timerType]: weeklySessions[timerType] + 1
    }
    const newTotalFocusTime = {
      ...totalFocusTime,
      [timerType]: totalFocusTime[timerType] + (timerType === 'pomodoro' ? pomoDuration : deepWorkDuration)
    }
    const newLongestStreak = {
      ...longestStreak,
      [timerType]: Math.max(longestStreak[timerType], newDailySessions[timerType])
    }

    setDailySessions(newDailySessions)
    setWeeklySessions(newWeeklySessions)
    setTotalFocusTime(newTotalFocusTime)
    setLongestStreak(newLongestStreak)

    const today = new Date().toISOString().split('T')[0]
    const updatedWeeklyData = [...weeklyData]
    const todayIndex = updatedWeeklyData.findIndex(d => d.date === today)
    if (todayIndex !== -1) {
      updatedWeeklyData[todayIndex] = {
        ...updatedWeeklyData[todayIndex],
        [timerType]: (updatedWeeklyData[todayIndex][timerType] || 0) + 1,
        productivity: calculateProductivity(updatedWeeklyData[todayIndex])
      }
    } else {
      updatedWeeklyData.push({ 
        date: today, 
        [timerType]: 1,
        productivity: calculateProductivity({ [timerType]: 1 })
      })
    }
    setWeeklyData(updatedWeeklyData)

    updateUserData()
  }, [dailySessions, weeklySessions, totalFocusTime, longestStreak, timerType, pomoDuration, deepWorkDuration, weeklyData, updateUserData])

  const calculateProductivity = (dayData: any) => {
    const totalSessions = (dayData.pomodoro || 0) + (dayData.deepWork || 0)
    return totalSessions > 0 ? Math.min(totalSessions * 10, 100) : 0
  }

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3')
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
    if (timerType === 'pomodoro') {
      setTimeLeft((dailySessions.pomodoro % 4 === 0 ? pomoLongBreak : pomoShortBreak) * 60)
    } else {
      setTimeLeft(deepWorkBreak * 60)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-5xl font-bold mb-12 text-center text-gray-800">Minuteries de Productivité</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Pomodoro</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              className="text-8xl font-bold text-center mb-8"
              key={timerType === 'pomodoro' ? timeLeft : 'pomo'}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {timerType === 'pomodoro' && formatTime(timeLeft)}
            </motion.div>
            <div className="flex justify-center space-x-4">
              {timerState === 'idle' && timerType === 'pomodoro' && (
                <Button onClick={startTimer} size="lg" className="w-32">Démarrer</Button>
              )}
              {timerState === 'running' && timerType === 'pomodoro' && (
                <Button onClick={pauseTimer} size="lg" className="w-32">Pause</Button>
              )}
              {timerState === 'paused' && timerType === 'pomodoro' && (
                <Button onClick={resumeTimer} size="lg" className="w-32">Reprendre</Button>
              )}
              {timerState !== 'idle' && timerType === 'pomodoro' && (
                <Button onClick={resetTimer} variant="outline" size="lg" className="w-32">Réinitialiser</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Deep Work</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              className="text-8xl font-bold text-center mb-8"
              key={timerType === 'deepWork' ? timeLeft : 'deep'}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {timerType === 'deepWork' && formatTime(timeLeft)}
            </motion.div>
            <div className="flex justify-center space-x-4">
              {timerState === 'idle' && timerType === 'deepWork' && (
                <Button onClick={startTimer} size="lg" className="w-32">Démarrer</Button>
              )}
              {timerState === 'running' && timerType === 'deepWork' && (
                <Button onClick={pauseTimer} size="lg" className="w-32">Pause</Button>
              )}
              {timerState === 'paused' && timerType === 'deepWork' && (
                <Button onClick={resumeTimer} size="lg" className="w-32">Reprendre</Button>
              )}
              {timerState !== 'idle' && timerType === 'deepWork' && (
                <Button onClick={resetTimer} variant="outline" size="lg" className="w-32">Réinitialiser</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg mb-12">
        <CardHeader>
          <CardTitle className="text-3xl">Paramètres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-lg">Durée Pomodoro: {pomoDuration} minutes</label>
                <Slider
                  value={[pomoDuration]}
                  onValueChange={(value) => setPomoDuration(value[0])}
                  max={60}
                  step={1}
                />
              </div>
              <div>
                <label className="block mb-2 text-lg">Pause courte Pomodoro: {pomoShortBreak} minutes</label>
                <Slider
                  value={[pomoShortBreak]}
                  onValueChange={(value) => setPomoShortBreak(value[0])}
                  max={15}
                  step={1}
                />
              </div>
              <div>
                <label className="block mb-2 text-lg">Pause longue Pomodoro: {pomoLongBreak} minutes</label>
                <Slider
                  value={[pomoLongBreak]}
                  onValueChange={(value) => setPomoLongBreak(value[0])}
                  max={30}
                  step={1}
                />
              </div>
            </div>
            <div className="space-y-6">
              <div>
              <label className="block mb-2 text-lg">Durée Deep Work: {deepWorkDuration} minutes</label>
                <Slider
                  value={[deepWorkDuration]}
                  onValueChange={(value) => setDeepWorkDuration(value[0])}
                  max={180}
                  step={5}
                />
              </div>
              <div>
                <label className="block mb-2 text-lg">Pause Deep Work: {deepWorkBreak} minutes</label>
                <Slider
                  value={[deepWorkBreak]}
                  onValueChange={(value) => setDeepWorkBreak(value[0])}
                  max={30}
                  step={1}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg">Pause automatique</span>
                <Switch
                  checked={autoBreak}
                  onCheckedChange={setAutoBreak}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg">Son de notification</span>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg mb-12">
        <CardHeader>
          <CardTitle className="text-3xl">Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-lg font-semibold mb-2">Sessions aujourd'hui</p>
              <p className="text-3xl">Pomodoro: {dailySessions.pomodoro}</p>
              <p className="text-3xl">Deep Work: {dailySessions.deepWork}</p>
            </div>
            <div>
              <p className="text-lg font-semibold mb-2">Sessions cette semaine</p>
              <p className="text-3xl">Pomodoro: {weeklySessions.pomodoro}</p>
              <p className="text-3xl">Deep Work: {weeklySessions.deepWork}</p>
            </div>
            <div>
              <p className="text-lg font-semibold mb-2">Temps total de concentration</p>
              <p className="text-3xl">Pomodoro: {Math.floor(totalFocusTime.pomodoro / 60)}h {totalFocusTime.pomodoro % 60}m</p>
              <p className="text-3xl">Deep Work: {Math.floor(totalFocusTime.deepWork / 60)}h {totalFocusTime.deepWork % 60}m</p>
            </div>
            <div>
              <p className="text-lg font-semibold mb-2">Plus longue série</p>
              <p className="text-3xl">Pomodoro: {longestStreak.pomodoro}</p>
              <p className="text-3xl">Deep Work: {longestStreak.deepWork}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly">
            <TabsList className="mb-4">
              <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="productivity">Productivité</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pomodoro" stroke="#ef4444" name="Pomodoro" />
                    <Line type="monotone" dataKey="deepWork" stroke="#3b82f6" name="Deep Work" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="distribution">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Pomodoro', value: totalFocusTime.pomodoro },
                    { name: 'Deep Work', value: totalFocusTime.deepWork },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="productivity">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="productivity" stroke="#10b981" name="Productivité" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}