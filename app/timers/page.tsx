'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cog6ToothIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  const [showSettings, setShowSettings] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [weeklyData, setWeeklyData] = useState<any[]>([])

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
        [timerType]: (updatedWeeklyData[todayIndex][timerType] || 0) + 1
      }
    } else {
      updatedWeeklyData.push({ date: today, [timerType]: 1 })
    }
    setWeeklyData(updatedWeeklyData)

    updateUserData()
  }, [dailySessions, weeklySessions, totalFocusTime, longestStreak, timerType, pomoDuration, deepWorkDuration, weeklyData, updateUserData])

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
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Minuteries de Productivité</h1>

      <Tabs defaultValue="pomodoro" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pomodoro" onClick={() => setTimerType('pomodoro')}>Pomodoro</TabsTrigger>
          <TabsTrigger value="deepWork" onClick={() => setTimerType('deepWork')}>Deep Work</TabsTrigger>
        </TabsList>
        <TabsContent value="pomodoro">
          <Card className="bg-gradient-to-br from-red-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-2xl text-red-800">Minuterie Pomodoro</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-8xl font-bold text-center mb-8 text-red-600"
                key={timeLeft}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              <div className="flex justify-center space-x-4 mb-4">
                {timerState === 'idle' && (
                  <Button onClick={startTimer} size="lg" className="bg-red-600 hover:bg-red-700">Démarrer</Button>
                )}
                {timerState === 'running' && (
                  <Button onClick={pauseTimer} size="lg" className="bg-yellow-600 hover:bg-yellow-700">Pause</Button>
                )}
                {timerState === 'paused' && (
                  <Button onClick={resumeTimer} size="lg" className="bg-green-600 hover:bg-green-700">Reprendre</Button>
                )}
                {timerState !== 'idle' && (
                  <Button onClick={resetTimer} variant="outline" size="lg" className="text-red-600 border-red-600 hover:bg-red-50">Réinitialiser</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="deepWork">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-800">Minuterie Deep Work</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-8xl font-bold text-center mb-8 text-blue-600"
                key={timeLeft}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              <div className="flex justify-center space-x-4 mb-4">
                {timerState === 'idle' && (
                  <Button onClick={startTimer} size="lg" className="bg-blue-600 hover:bg-blue-700">Démarrer</Button>
                )}
                {timerState === 'running' && (
                  <Button onClick={pauseTimer} size="lg" className="bg-yellow-600 hover:bg-yellow-700">Pause</Button>
                )}
                {timerState === 'paused' && (
                  <Button onClick={resumeTimer} size="lg" className="bg-green-600 hover:bg-green-700">Reprendre</Button>
                )}
                {timerState !== 'idle' && (
                  <Button onClick={resetTimer} variant="outline" size="lg" className="text-blue-600 border-blue-600 hover:bg-blue-50">Réinitialiser</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-2xl text-purple-800">Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="font-semibold text-purple-700">Sessions aujourd'hui</p>
              <p className="text-2xl text-purple-900">Pomodoro: {dailySessions.pomodoro}</p>
              <p className="text-2xl text-purple-900">Deep Work: {dailySessions.deepWork}</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700">Sessions cette semaine</p>
              <p className="text-2xl text-purple-900">Pomodoro: {weeklySessions.pomodoro}</p>
              <p className="text-2xl text-purple-900">Deep Work: {weeklySessions.deepWork}</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700">Temps total de concentration</p>
              <p className="text-2xl text-purple-900">Pomodoro: {Math.floor(totalFocusTime.pomodoro / 60)}h</p>
              <p className="text-2xl text-purple-900">Deep Work: {Math.floor(totalFocusTime.deepWork / 60)}h</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700">Plus longue série</p>
              <p className="text-2xl text-purple-900">Pomodoro: {longestStreak.pomodoro}</p>
              <p className="text-2xl text-purple-900">Deep Work: {longestStreak.deepWork}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4 mb-8">
        <Button onClick={() => setShowSettings(!showSettings)} variant="outline" className="bg-gray-100 hover:bg-gray-200">
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          {showSettings ? 'Cacher les paramètres' : 'Afficher les paramètres'}
        </Button>
        <Button onClick={() => setShowAnalytics(!showAnalytics)} variant="outline" className="bg-gray-100 hover:bg-gray-200">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          {showAnalytics ? 'Cacher les analyses' : 'Afficher les analyses'}
        </Button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-8 bg-gradient-to-br from-green-50 to-teal-50">
              <CardHeader>
                <CardTitle className="text-2xl text-green-800">Paramètres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-green-700">Durée Pomodoro (minutes)</label>
                    <Slider
                      value={[pomoDuration]}
                      onValueChange={(value) => setPomoDuration(value[0])}
                      max={60}
                      step={1}
                      className="text-green-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-green-700">Durée pause courte Pomodoro (minutes)</label>
                    <Slider
                      value={[pomoShortBreak]}
                      onValueChange={(value) => setPomoShortBreak(value[0])}
                      max={15}
                      step={1}
                      className="text-green-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-green-700">Durée pause longue Pomodoro (minutes)</label>
                    <Slider
                      value={[pomoLongBreak]}
                      onValueChange={(value) => setPomoLongBreak(value[0])}
                      max={30}
                      step={1}
                      className="text-green-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-green-700">Durée Deep Work (minutes)</label>
                    <Slider
                      value={[deepWorkDuration]}
                      onValueChange={(value) => setDeepWorkDuration(value[0])}
                      max={180}
                      step={5}
                      className="text-green-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-green-700">Durée pause Deep Work (minutes)</label>
                    <Slider
                      value={[deepWorkBreak]}
                      onValueChange={(value) => setDeepWorkBreak(value[0])}
                      max={30}
                      step={1}
                      className="text-green-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Pause automatique</span>
                    <Switch
                      checked={autoBreak}
                      onCheckedChange={setAutoBreak}
                      className="bg-green-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Son de notification</span>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={setSoundEnabled}
                      className="bg-green-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-8 bg-gradient-to-br from-yellow-50 to-amber-50">
              <CardHeader>
                <CardTitle className="text-2xl text-yellow-800">Analyses avancées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="pomodoro" stroke="#ef4444" name="Pomodoro" />
                      <Line type="monotone" dataKey="deepWork" stroke="#3b82f6" name="Deep Work" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <p className="text-yellow-800 font-semibold">Productivité hebdomadaire</p>
                  <p className="text-yellow-700">
                    Cette semaine, vous avez complété {weeklySessions.pomodoro} sessions Pomodoro et {weeklySessions.deepWork} sessions Deep Work.
                  </p>
                  <p className="text-yellow-700 mt-2">
                    Temps total de concentration : {Math.floor((totalFocusTime.pomodoro + totalFocusTime.deepWork) / 60)} heures
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}