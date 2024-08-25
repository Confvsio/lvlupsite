'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-16 lg:p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center w-full max-w-4xl"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 md:mb-8 text-indigo-800">
          Bienvenue sur Lvl'Up
        </h1>
        <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 md:mb-12 text-gray-700 px-4">
          Rejoignez notre communauté Discord et améliorez votre développement
          personnel et professionnel grâce à nos outils et ressources.
        </p>
        <Link
          href="/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg text-sm sm:text-base"
        >
          Se connecter avec Discord
        </Link>
      </motion.div>
    </main>
  );
}
