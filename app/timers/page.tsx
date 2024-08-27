// app/timers/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import gsap from 'gsap'

export default function MinuteriesPage() {
  const [pomodoroTime, setPomodoroTime] = useState(25)
  const [deepWorkTime, setDeepWorkTime] = useState(60)
  const [activeTimer, setActiveTimer] = useState<'pomodoro' | 'deepwork' | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (activeTimer && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [activeTimer, timeLeft])

  const startTimer = (type: 'pomodoro' | 'deepwork') => {
    setActiveTimer(type)
    setTimeLeft(type === 'pomodoro' ? pomodoroTime * 60 : deepWorkTime * 60)
    // Enregistrer le début de la session dans Supabase
    supabase.from('sessions').insert({
      type: type,
      start_time: new Date().toISOString(),
      duration: type === 'pomodoro' ? pomodoroTime : deepWorkTime
    })
  }

  const stopTimer = () => {
    setActiveTimer(null)
    setTimeLeft(0)
    // Mettre à jour la session dans Supabase avec l'heure de fin
    supabase.from('sessions').update({
      end_time: new Date().toISOString()
    }).eq('start_time', new Date(Date.now() - timeLeft * 1000).toISOString())
  }

  useEffect(() => {
    // Animation GSAP pour le compteur
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
      className="container mx-auto p-4"
    >
      <h1 className="text-3xl font-bold mb-6">Minuteries</h1>
      
      <Tabs defaultValue="pomodoro">
        <TabsList>
          <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          <TabsTrigger value="deepwork">Deep Work</TabsTrigger>
        </TabsList>
        <TabsContent value="pomodoro">
          <h2 className="text-2xl mb-4">Minuterie Pomodoro</h2>
          <Slider
            value={[pomodoroTime]}
            onValueChange={(value) => setPomodoroTime(value[0])}
            max={60}
            step={1}
          />
          <p>Durée : {pomodoroTime} minutes</p>
        </TabsContent>
        <TabsContent value="deepwork">
          <h2 className="text-2xl mb-4">Minuterie Deep Work</h2>
          <Slider
            value={[deepWorkTime]}
            onValueChange={(value) => setDeepWorkTime(value[0])}
            max={240}
            step={5}
          />
          <p>Durée : {deepWorkTime} minutes</p>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h2 className="text-2xl mb-4">Minuterie active</h2>
        {activeTimer ? (
          <>
            <p className="timer-text text-4xl font-bold mb-4">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
            <Button onClick={stopTimer}>Arrêter</Button>
          </>
        ) : (
          <div>
            <Button onClick={() => startTimer('pomodoro')} className="mr-4">Démarrer Pomodoro</Button>
            <Button onClick={() => startTimer('deepwork')}>Démarrer Deep Work</Button>
          </div>
        )}
      </div>

      <div className="mt-16">
        <h2 className="text-2xl mb-4">Données</h2>
        {/* Ici, vous pouvez ajouter des graphiques ou des tableaux pour afficher les analyses */}
      </div>
    </motion.div>
  )
}