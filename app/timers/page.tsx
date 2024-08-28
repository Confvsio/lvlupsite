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
import { ClockIcon, FireIcon, CalendarIcon, TrophyIcon } from '@heroicons/react/24/solid'
import debounce from 'lodash/debounce'

type TimerType = 'pomodoro' | 'deepWork'
type TimerState = 'idle' | 'running' | 'paused' | 'break'
type TimeRange = 'day' | 'week' | 'month' | 'lifetime'

export default function TimersPage() {
  const [activeTimer, setActiveTimer] = useState<TimerType>('pomodoro')
  const [timerStates, setTimerStates] = useState<Record<TimerType, TimerState>>({
    pomodoro: 'idle',
    deepWork: 'idle'
  })
  const [timesLeft, setTimesLeft] = useState<Record<TimerType, number>>({
    pomodoro: 25 * 60,
    deepWork: 60 * 60
  })
  const [pomoDuration, setPomoDuration] = useState(25)
  const [deepWorkDuration, setDeepWorkDuration] = useState(60)
  const [pomoShortBreak, setPomoShortBreak] = useState(5)
  const [pomoLongBreak, setPomoLongBreak] = useState(15)
  const [deepWorkBreak, setDeepWorkBreak] = useState(10)
  const [autoBreak, setAutoBreak] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [dailySessions, setDailySessions] = useState({ pomodoro: 0, deepWork: 0 })
  const [weeklySessions, setWeeklySessions] = useState({ pomodoro: 0, deepWork: 0 })
  const [monthlySessions, setMonthlySessions] = useState({ pomodoro: 0, deepWork: 0 })
  const [lifetimeSessions, setLifetimeSessions] = useState({ pomodoro: 0, deepWork: 0 })
  const [totalFocusTime, setTotalFocusTime] = useState({ pomodoro: 0, deepWork: 0 })
  const [longestStreak, setLongestStreak] = useState({ pomodoro: 0, deepWork: 0 })
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('day')

  const user = useUser()
  const supabase = useSupabaseClient()

  const fetchUserData = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('user_timer_data')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user data:', error)
    } else if (data) {
      setPomoDuration(data.pomo_duration || 25)
      setDeepWorkDuration(data.deep_work_duration || 60)
      setPomoShortBreak(data.pomo_short_break || 5)
      setPomoLongBreak(data.pomo_long_break || 15)
      setDeepWorkBreak(data.deep_work_break || 10)
      setAutoBreak(data.auto_break || false)
      setSoundEnabled(data.sound_enabled || true)
      setDailySessions(data.daily_sessions || { pomodoro: 0, deepWork: 0 })
      setWeeklySessions(data.weekly_sessions || { pomodoro: 0, deepWork: 0 })
      setMonthlySessions(data.monthly_sessions || { pomodoro: 0, deepWork: 0 })
      setLifetimeSessions(data.lifetime_sessions || { pomodoro: 0, deepWork: 0 })
      setTotalFocusTime(data.total_focus_time || { pomodoro: 0, deepWork: 0 })
      setLongestStreak(data.longest_streak || { pomodoro: 0, deepWork: 0 })
      setWeeklyData(data.weekly_data || [])
    }
  }, [user, supabase])

  const updateUserData = useCallback(async () => {
    if (!user) return

    const { error } = await supabase
      .from('user_timer_data')
      .upsert({
        user_id: user.id,
        pomo_duration: pomoDuration,
        deep_work_duration: deepWorkDuration,
        pomo_short_break: pomoShortBreak,
        pomo_long_break: pomoLongBreak,
        deep_work_break: deepWorkBreak,
        auto_break: autoBreak,
        sound_enabled: soundEnabled,
        daily_sessions: dailySessions,
        weekly_sessions: weeklySessions,
        monthly_sessions: monthlySessions,
        lifetime_sessions: lifetimeSessions,
        total_focus_time: totalFocusTime,
        longest_streak: longestStreak,
        weekly_data: weeklyData,
      })

    if (error) {
      console.error('Error updating user data:', error)
    }
  }, [user, pomoDuration, deepWorkDuration, pomoShortBreak, pomoLongBreak, deepWorkBreak, autoBreak, soundEnabled, dailySessions, weeklySessions, monthlySessions, lifetimeSessions, totalFocusTime, longestStreak, weeklyData, supabase])

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
  }, [user, fetchUserData])

  useEffect(() => {
    const timerTypes: TimerType[] = ['pomodoro', 'deepWork']
    const intervals: NodeJS.Timeout[] = []

    timerTypes.forEach((type) => {
      if (timerStates[type] === 'running') {
        const interval = setInterval(() => {
          setTimesLeft((prevTimes) => {
            const newTimes = { ...prevTimes }
            if (newTimes[type] <= 1) {
              clearInterval(interval)
              handleTimerComplete(type)
              return newTimes
            }
            newTimes[type] -= 1
            return newTimes
          })
        }, 1000)
        intervals.push(interval)
      }
    })

    return () => intervals.forEach(clearInterval)
  }, [timerStates])

  useEffect(() => {
    setTimesLeft({
      pomodoro: pomoDuration * 60,
      deepWork: deepWorkDuration * 60
    })
  }, [pomoDuration, deepWorkDuration])

  const handleTimerComplete = useCallback((timerType: TimerType) => {
    if (soundEnabled) {
      playNotificationSound()
    }
    if (autoBreak) {
      startBreak(timerType)
    } else {
      setTimerStates(prev => ({ ...prev, [timerType]: 'idle' }))
    }
    updateSessionCount(timerType)
  }, [soundEnabled, autoBreak])

  const updateSessionCount = useCallback((timerType: TimerType) => {
    const duration = timerType === 'pomodoro' ? pomoDuration : deepWorkDuration
    
    setDailySessions(prev => ({
      ...prev,
      [timerType]: prev[timerType] + 1
    }))
    setWeeklySessions(prev => ({
      ...prev,
      [timerType]: prev[timerType] + 1
    }))
    setMonthlySessions(prev => ({
      ...prev,
      [timerType]: prev[timerType] + 1
    }))
    setLifetimeSessions(prev => ({
      ...prev,
      [timerType]: prev[timerType] + 1
    }))
    setTotalFocusTime(prev => ({
      ...prev,
      [timerType]: prev[timerType] + duration
    }))
    setLongestStreak(prev => ({
      ...prev,
      [timerType]: Math.max(prev[timerType], dailySessions[timerType] + 1)
    }))

    const today = new Date().toISOString().split('T')[0]
    setWeeklyData(prev => {
      const updatedData = [...prev]
      const todayIndex = updatedData.findIndex(d => d.date === today)
      if (todayIndex !== -1) {
        updatedData[todayIndex] = {
          ...updatedData[todayIndex],
          [timerType]: (updatedData[todayIndex][timerType] || 0) + 1,
          productivity: calculateProductivity({
            ...updatedData[todayIndex],
            [timerType]: (updatedData[todayIndex][timerType] || 0) + 1
          })
        }
      } else {
        updatedData.push({ 
          date: today, 
          [timerType]: 1,
          productivity: calculateProductivity({ [timerType]: 1 })
        })
      }
      return updatedData
    })

    debouncedUpdateUserData()
  }, [dailySessions, pomoDuration, deepWorkDuration, debouncedUpdateUserData])

  const calculateProductivity = (dayData: any) => {
    const totalSessions = (dayData.pomodoro || 0) + (dayData.deepWork || 0)
    return totalSessions > 0 ? Math.min(totalSessions * 10, 100) : 0
  }

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3')
    audio.play()
  }

  const startTimer = (timerType: TimerType) => {
    setActiveTimer(timerType)
    setTimerStates(prev => ({ ...prev, [timerType]: 'running' }))
  }

  const pauseTimer = (timerType: TimerType) => {
    setTimerStates(prev => ({ ...prev, [timerType]: 'paused' }))
  }

  const resumeTimer = (timerType: TimerType) => {
    setTimerStates(prev => ({ ...prev, [timerType]: 'running' }))
  }

  const stopTimer = (timerType: TimerType) => {
    const elapsedTime = (timerType === 'pomodoro' ? pomoDuration : deepWorkDuration) * 60 - timesLeft[timerType]
    const elapsedMinutes = Math.floor(elapsedTime / 60)
    
    if (elapsedMinutes > 0) {
      updateSessionCount(timerType)
    }

    setTimerStates(prev => ({ ...prev, [timerType]: 'idle' }))
    setTimesLeft(prev => ({
      ...prev,
      [timerType]: timerType === 'pomodoro' ? pomoDuration * 60 : deepWorkDuration * 60
    }))
  }

  const startBreak = (timerType: TimerType) => {
    setTimerStates(prev => ({ ...prev, [timerType]: 'break' }))
    setTimesLeft(prev => ({
      ...prev,
      [timerType]: timerType === 'pomodoro'
        ? (dailySessions.pomodoro % 4 === 0 ? pomoLongBreak : pomoShortBreak) * 60
        : deepWorkBreak * 60
    }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionsForTimeRange = (range: TimeRange) => {
    switch (range) {
      case 'day':
        return dailySessions
      case 'week':
        return weeklySessions
      case 'month':
        return monthlySessions
      case 'lifetime':
        return lifetimeSessions
      default:
        return dailySessions
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <h1 className="text-5xl font-bold mb-12 text-center text-gray-800">Minuteries de Productivité</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {['pomodoro', 'deepWork'].map((type) => (
          <Card key={type} className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl">{type === 'pomodoro' ? 'Pomodoro' : 'Deep Work'}</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-8xl font-bold text-center mb-8"
                key={timesLeft[type as TimerType]}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formatTime(timesLeft[type as TimerType])}
              </motion.div>
              <div className="flex justify-center space-x-4">
                {timerStates[type as TimerType] === 'idle' && (
                  <Button onClick={() => startTimer(type as TimerType)} size="lg" className="w-32">Démarrer</Button>
                )}
                {timerStates[type as TimerType] === 'running' && (
                  <Button onClick={() => pauseTimer(type as TimerType)} size="lg" className="w-32">Pause</Button>
                )}
                {timerStates[type as TimerType] === 'paused' && (
                  <Button onClick={() => resumeTimer(type as TimerType)} size="lg" className="w-32">Reprendre</Button>
                )}
                {timerStates[type as TimerType] !== 'idle' && (
                  <Button onClick={() => stopTimer(type as TimerType)} variant="outline" size="lg" className="w-32">Arrêter</Button>
                )}
              </div>
            </CardContent>
          </Card>
                  ))}
                  </div>
            
                  <Card className="shadow-lg mb-12">
                    <CardHeader>
                      <CardTitle className="text-3xl">Statistiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <label className="mr-2">Période:</label>
                        <select
                          value={selectedTimeRange}
                          onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
                          className="p-2 border rounded"
                        >
                          <option value="day">Jour</option>
                          <option value="week">Semaine</option>
                          <option value="month">Mois</option>
                          <option value="lifetime">Tout le temps</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard
                          icon={<ClockIcon className="h-8 w-8 text-blue-500" />}
                          title="Sessions"
                          pomodoro={getSessionsForTimeRange(selectedTimeRange).pomodoro}
                          deepWork={getSessionsForTimeRange(selectedTimeRange).deepWork}
                        />
                        <StatCard
                          icon={<FireIcon className="h-8 w-8 text-red-500" />}
                          title="Temps total de concentration"
                          pomodoro={totalFocusTime.pomodoro}
                          deepWork={totalFocusTime.deepWork}
                          format="time"
                        />
                        <StatCard
                          icon={<TrophyIcon className="h-8 w-8 text-yellow-500" />}
                          title="Plus longue série"
                          pomodoro={longestStreak.pomodoro}
                          deepWork={longestStreak.deepWork}
                        />
                        <StatCard
                          icon={<CalendarIcon className="h-8 w-8 text-green-500" />}
                          title="Productivité moyenne"
                          pomodoro={calculateAverageProductivity('pomodoro')}
                          deepWork={calculateAverageProductivity('deepWork')}
                          format="percentage"
                        />
                      </div>
                    </CardContent>
                  </Card>
            
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
            
            interface StatCardProps {
              icon: React.ReactNode;
              title: string;
              pomodoro: number;
              deepWork: number;
              format?: 'number' | 'time' | 'percentage';
            }
            
            function StatCard({ icon, title, pomodoro, deepWork, format = 'number' }: StatCardProps) {
              const formatValue = (value: number) => {
                if (format === 'time') {
                  const hours = Math.floor(value / 60)
                  const minutes = value % 60
                  return `${hours}h ${minutes}m`
                }
                if (format === 'percentage') {
                  return `${value.toFixed(1)}%`
                }
                return value
              }
            
              return (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    {icon}
                    <h3 className="text-lg font-semibold ml-2">{title}</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-red-600">Pomodoro:</span> {formatValue(pomodoro)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-blue-600">Deep Work:</span> {formatValue(deepWork)}
                    </p>
                  </div>
                </div>
              )
            }