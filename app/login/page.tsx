'use client';

import { motion } from 'framer-motion';

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-16 lg:p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center w-full max-w-2xl"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-indigo-800">
          Connexion
        </h1>
        <p className="text-base sm:text-lg mb-6 sm:mb-8 text-gray-700 px-4">
          La fonctionnalité de connexion sera implémentée ici.
        </p>
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mx-auto"></div>
      </motion.div>
    </div>
  );
}
