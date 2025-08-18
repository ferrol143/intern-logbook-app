"use client";

import { motion } from "framer-motion";
import { Heart, BookOpen, Coffee } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-pink-50 via-rose-25 to-pink-100 p-6 text-gray-800 lg:justify-center lg:p-8 dark:bg-gradient-to-br dark:from-pink-950 dark:via-rose-950 dark:to-pink-900 dark:text-pink-50">
      <main className="flex w-full max-w-6xl flex-col items-center justify-center lg:flex-row lg:gap-12">
        <div className="flex-1 rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur-sm lg:p-12 dark:bg-gray-900/80">
          {/* Icon Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 p-4">
                <Heart className="h-8 w-8 text-white" fill="currentColor" />
              </div>
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent dark:from-pink-300 dark:to-rose-300">
              Log Book Magang
            </h1>
            <p className="text-lg italic text-rose-600 dark:text-pink-300">
              Hai, untuk seseorang yang aku cintai dan selalu aku banggakan.
            </p>
          </motion.div>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 space-y-4 text-center"
          >
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-200">
              Catat setiap aktivitas magang kamu disini ya sayang.
            </p>
            <p className="text-lg font-medium text-rose-700 dark:text-pink-300">
              Terima kasih untuk kamu yang selalu berjuang dan tidak pernah menyerah! ✨
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className=""
          >
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:from-rose-600 hover:to-pink-600 hover:shadow-xl"
            >
              <BookOpen className="h-5 w-5" />
              Buat Logbook
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
