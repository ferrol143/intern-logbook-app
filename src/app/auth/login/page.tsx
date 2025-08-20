"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops!',
        text: 'Mohon lengkapi semua field yang diperlukan',
        confirmButtonColor: '#f43f5e',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Tidak Valid',
        text: 'Mohon masukkan email yang valid',
        confirmButtonColor: '#f43f5e',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Show loading alert
      Swal.fire({
        title: 'Sedang masuk...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      console.log('Login result:', result);
      
      Swal.close(); // Close loading alert

      if (result?.error) {
        // Show error alert
        let errorMessage = 'Terjadi kesalahan saat login';
        
        switch (result.error) {
          case 'CredentialsSignin':
            errorMessage = 'Email atau password tidak valid';
            break;
          case 'CallbackRouteError':
            errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi.';
            break;
          default:
            errorMessage = result.error;
        }

        await Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: errorMessage,
          confirmButtonColor: '#f43f5e',
        });
      } else if (result?.ok) {
        // Success
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Login berhasil, mengalihkan ke dashboard...',
          timer: 1500,
          showConfirmButton: false,
          confirmButtonColor: '#f43f5e',
        });
        
        // Clear form
        setFormData({ email: '', password: '' });
        
        // Redirect to dashboard
        router.push('/dashboard/noyaa');
      }
    } catch (err) {
      console.error('Login error:', err);
      Swal.close(); // Close loading alert if still open
      
      // Show unexpected error alert
      await Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
        confirmButtonColor: '#f43f5e',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-pink-50 via-rose-25 to-pink-100 p-6 text-gray-800 lg:justify-center lg:p-8 dark:bg-gradient-to-br dark:from-pink-950 dark:via-rose-950 dark:to-pink-900 dark:text-pink-50">
      <main className="flex w-full max-w-md flex-col items-center justify-center">
        {/* Login Card */}
        <div className="w-full rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              {/* <div className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 p-4">
                <Heart className="h-8 w-8 text-white" fill="currentColor" />
              </div> */}
            </div>
            <h1 className="mb-2 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent dark:from-pink-300 dark:to-rose-300">
              Selamat Datang
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Masuk ke akun kamu untuk melanjutkan
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-pink-400"
                  placeholder="masukkan@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 py-3 text-gray-900 placeholder-gray-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-pink-400"
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-rose-600 hover:to-pink-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:from-rose-500 disabled:hover:to-pink-500"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Sedang masuk...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium text-rose-600 hover:text-rose-500 dark:text-pink-400 dark:hover:text-pink-300"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}