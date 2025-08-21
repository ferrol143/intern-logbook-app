"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Plus, Download, Upload, Clock, Calendar, BarChart3, Edit2, Trash2, X, Activity, TrendingUp, Zap, Star, NotebookPen, Home, FileText, Settings, Mail, User, Menu } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import axios from "axios"
import Swal from "sweetalert2"
import { ApiResponse, PaginatedResponse } from "@/app/types/api"

// =============================
// Types
// =============================
interface Activity {
  readonly id: string
  readonly date: string
  readonly author: string
  readonly activity: string
  readonly type: string
  readonly start_time: string
  readonly end_time: string
  readonly work_type: string
  readonly location: string
  readonly description?: string
  readonly proof?: string | null
}

interface ActivityFormData {
  author: string
  tanggal: string
  kegiatan: string
  jenisKegiatan: string
  waktuMulai: string
  waktuSelesai: string
  tipePekerjaan: string
  lokasi: string
  keterangan?: string
  proof?: File | string | null // File object for form submission
}

interface StatisticsData {
  readonly weekly: number
  readonly monthly: number
  readonly total: number
}

const formatTime = (timeString: string): string => {
  return timeString.substring(11, 16); // take "HH:mm" part
}

// =============================
// SweetAlert2 Utility Functions
// =============================
const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ec4899',
    background: '#ffffff',
    timer: 2000,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl px-6 py-3'
    }
  });
};

const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#dc2626',
    background: '#ffffff',
    timer: 2000,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl px-6 py-3'
    }
  });
};

const showConfirmDialog = (title: string, text: string, confirmText: string = 'Ya, Hapus!') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl px-6 py-3',
      cancelButton: 'rounded-xl px-6 py-3'
    }
  });
};

const showLoadingAlert = (title: string) => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl'
    },
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// =============================
// Enhanced Modal Component
// =============================
type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 overflow-y-auto z-10">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-rose-50">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-gray-600 hover:shadow-md transition-all duration-200"
              aria-label="Tutup modal"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}

// =============================
// Enhanced Input Component
// =============================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  className?: string
  required?: boolean
}

const Input: React.FC<InputProps> = ({ label, className = "", error, required = false, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 hover:border-pink-300 ${
        error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 bg-white'
      } ${className}`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
)

// =============================
// Enhanced Select Component
// =============================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  className?: string
  options: { value: string; label: string }[]
  required?: boolean
}

const Select: React.FC<SelectProps> = ({ label, className = "", error, options, required = false, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 hover:border-pink-300 ${
        error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 bg-white'
      } ${className}`}
    >
      <option value="">Pilih {label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
)

// =============================
// Enhanced Textarea Component
// =============================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  className?: string
  required?: boolean
}

const Textarea: React.FC<TextareaProps> = ({ label, className = "", required = false, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <textarea
      {...props}
      rows={3}
      className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-pink-300 transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 resize-none ${className}`}
    />
  </div>
)

// =============================
// Enhanced File Input Component
// =============================
interface FileInputProps {
  label: string
  onChange: (file: File | null) => void
  value?: File | null
  error?: string
  required?: boolean
}

const FileInput: React.FC<FileInputProps> = ({ label, onChange, value, error, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="file"
      onChange={(e) => onChange(e.target.files?.[0] || null)}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 hover:border-pink-300 ${
        error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 bg-white'
      }`}
      accept="image/*,.pdf,.doc,.docx"
    />
    {value && (
      <p className="text-sm text-gray-600 mt-1">File terpilih: {value.name}</p>
    )}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
)

// =============================
// Enhanced Button Component
// =============================
type ButtonVariant = "primary" | "outline" | "danger"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  className?: string
  loading?: boolean
}

const Button: React.FC<ButtonProps> = ({ children, variant = "outline", className = "", disabled, loading = false, ...props }) => {
  const baseClasses = "px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl focus:ring-pink-500/50",
    outline: "border-2 border-pink-200 text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:border-pink-400 hover:text-pink-600 focus:ring-pink-500/50 bg-white",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl focus:ring-red-500/50"
  }

  return (
    <button disabled={disabled || loading} {...props} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  )
}

// =============================
// Enhanced Card Components
// =============================
interface CardBaseProps {
  children: React.ReactNode
  className?: string
}

interface CardProps extends CardBaseProps {
  hover?: boolean
}

const Card: React.FC<CardProps> = ({ children, className = "", hover = true }) => (
  <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden backdrop-blur-sm ${
    hover ? 'hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-pink-200' : ''
  } ${className}`}>
    {children}
  </div>
)

const CardHeader: React.FC<CardBaseProps> = ({ children, className = "" }) => (
  <div className={`p-6 pb-4 ${className}`}>{children}</div>
)

const CardContent: React.FC<CardBaseProps> = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
)

const CardTitle: React.FC<CardBaseProps> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
)

// =============================
// Fixed Sidebar Component
// =============================
interface SidebarProps { 
  isOpen: boolean
  onClose: () => void 
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { icon: Home, label: "Noyaaa", id: "noyaaa", path: "/dashboard/noyaa" },
    { icon: FileText, label: "Lolzpop", id: "ferrol-azki", path: "/dashboard/ferrol-azki" },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-orange-400 to-yellow-500 shadow-2xl z-30 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Admin</h2>
                <p className="text-purple-200 text-xs">Admin System</p>
              </div>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-purple-200 hover:bg-white/10 hover:text-white transition-all duration-200"
              type="button"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group ${
                  isActive
                    ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10"
                    : "text-purple-200 hover:bg-white/10 hover:text-white hover:shadow-md"
                }`}
                type="button"
              >
                <item.icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    !isActive ? "group-hover:scale-110" : ""
                  }`}
                />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="bg-pink-600/5 backdrop-blur-sm rounded-xl p-4 border border-pink-600/5 hover:bg-pink-500/40 transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">Admin User</p>
                <p className="text-purple-200 text-xs truncate">admin@logbook.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// =============================
// Fixed Navbar Component
// =============================
interface NavbarProps { 
  onMenuClick: () => void
  sidebarOpen: boolean
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, sidebarOpen }) => (
  <nav className="bg-white backdrop-blur-md border-b border-pink-200/50 sticky top-0 shadow-sm z-1">
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 group"
            type="button"
            aria-label={sidebarOpen ? "Tutup menu" : "Buka menu"}
          >
            <Menu className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
          
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500 rounded-xl shadow-lg">
              <NotebookPen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Right side content */}
        <div className="flex items-center gap-3">
          {/* Add notification or user menu here if needed */}
        </div>
      </div>
    </div>
  </nav>
)

// =============================
// Activity Form Component - UPDATED WITH SWEETALERT2
// =============================
interface ActivityFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (activity: ActivityFormData | Activity) => void
  initialData?: Activity | null
}

const EMPTY_FORM_DATA: ActivityFormData = {
  author: "",
  tanggal: "",
  kegiatan: "",
  jenisKegiatan: "",
  waktuMulai: "",
  waktuSelesai: "",
  tipePekerjaan: "",
  lokasi: "",
  keterangan: "",
  proof: null
}

const JENIS_KEGIATAN_OPTIONS = [
  { value: "berita-kegiatan", label: "Berita Kegiatan" },
  { value: "berita-acara", label: "Berita Acara" },
  { value: "berita-acara-ujian", label: "Berita Acara Ujian" }
]

const TIPE_PEKERJAAN_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
  { value: "offline", label: "Offline" }
]

const ActivityForm: React.FC<ActivityFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState<ActivityFormData>(EMPTY_FORM_DATA)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<ActivityFormData & { proof?: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pathname = usePathname();

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // bulan 0-11
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formatTime = useCallback((timeString: string): string => {
    return timeString.substring(11, 16); // take "HH:mm" part
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        author: initialData.author,
        tanggal: formatDate(initialData.date),
        kegiatan: initialData.activity,
        jenisKegiatan: initialData.type,
        waktuMulai: formatTime(initialData.start_time),
        waktuSelesai: formatTime(initialData.end_time),
        tipePekerjaan: initialData.work_type,
        lokasi: initialData.location,
        keterangan: initialData.description || "",
        proof: null
      })
    } else {
      setFormData(EMPTY_FORM_DATA)
    }
    setProofFile(null)
    setErrors({})
  }, [initialData, isOpen])

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<ActivityFormData & { proof?: string }> = {}

    if (!formData.tanggal.trim()) {
      newErrors.tanggal = "Tanggal wajib diisi"
    }
    if (!formData.kegiatan.trim()) {
      newErrors.kegiatan = "Kegiatan wajib diisi"
    }
    if (!formData.jenisKegiatan.trim()) {
      newErrors.jenisKegiatan = "Jenis kegiatan wajib dipilih"
    }
    if (!formData.waktuMulai.trim()) {
      newErrors.waktuMulai = "Waktu mulai wajib diisi"
    }
    if (!formData.waktuSelesai.trim()) {
      newErrors.waktuSelesai = "Waktu selesai wajib diisi"
    }
    if (!formData.tipePekerjaan.trim()) {
      newErrors.tipePekerjaan = "Tipe pekerjaan wajib dipilih"
    }
    if (!formData.lokasi.trim()) {
      newErrors.lokasi = "Lokasi kegiatan wajib diisi"
    }
    if (!formData.keterangan?.trim()) {
      newErrors.keterangan = "Keterangan kegiatan wajib diisi"
    }
    if (!proofFile && !initialData) {
      newErrors.proof = "Bukti kegiatan wajib diupload"
    }

    if (formData.waktuMulai && formData.waktuSelesai) {
      const startTime = new Date(`2000-01-01T${formData.waktuMulai}`)
      const endTime = new Date(`2000-01-01T${formData.waktuSelesai}`)

      if (endTime <= startTime) {
        newErrors.waktuSelesai = "Waktu selesai harus setelah waktu mulai"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, proofFile, initialData])

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    
    // Show loading alert
    showLoadingAlert(initialData ? "Mengupdate kegiatan..." : "Menyimpan kegiatan...");
    
    try {
      const author = pathname.includes("ferrol-azki") ? "ferrol-azki" : "noyaaa";
      
      // Create FormData object for multipart form submission
      const formDataToSubmit = new FormData()
      formDataToSubmit.append('author', author)
      formDataToSubmit.append('tanggal', formData.tanggal)
      formDataToSubmit.append('kegiatan', formData.kegiatan)
      formDataToSubmit.append('jenisKegiatan', formData.jenisKegiatan)
      formDataToSubmit.append('waktuMulai', formData.waktuMulai)
      formDataToSubmit.append('waktuSelesai', formData.waktuSelesai)
      formDataToSubmit.append('tipePekerjaan', formData.tipePekerjaan)
      formDataToSubmit.append('lokasi', formData.lokasi)
      formDataToSubmit.append('keterangan', formData.keterangan || '')
      
      // Append file if exists
      if (proofFile) {
        formDataToSubmit.append('proof', proofFile)
      }

      if (initialData) {
        const response = await axios.put(`/api/activities/update/${initialData.id}`, formDataToSubmit, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        })

        if (response.data.success) {
          const updatedActivity: Activity = {
            ...initialData,
            ...formData,
            author,
            proof: response.data.data.proof || initialData.proof
          }
          onSubmit(updatedActivity)
          
          Swal.close();
          await showSuccessAlert("Berhasil!", "Kegiatan berhasil diupdate");

        } else {
          throw new Error(response.data.error || 'Failed to update activity')
        }
      } else {
        // For creating new activity
        const response = await axios.post<ApiResponse>('/api/activities', formDataToSubmit, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        })

        if (response.data.success) {
          const newActivity: Activity = {
            ...response.data.data,
            id: response.data.data.id || `activity-${Date.now()}`,
            author,
            tanggal: formData.tanggal,
            kegiatan: formData.kegiatan,
            jenisKegiatan: formData.jenisKegiatan,
            waktuMulai: formData.waktuMulai,
            waktuSelesai: formData.waktuSelesai,
            tipePekerjaan: formData.tipePekerjaan,
            lokasi: formData.lokasi,
            keterangan: formData.keterangan || '',
            proof: response.data.data.proof
          }
          onSubmit(newActivity)
          
          Swal.close();
          await showSuccessAlert("Berhasil!", "Kegiatan berhasil ditambahkan");
        } else {
          throw new Error(response.data.error || 'Failed to create activity')
        }
      }

      // Reset form
      setFormData(EMPTY_FORM_DATA)
      setProofFile(null)
      setErrors({})
    } catch (error) {
      console.error('Error submitting activity:', error)
      
      Swal.close();
      
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          const validationErrors = error.response.data?.details
          if (validationErrors && Array.isArray(validationErrors)) {
            // Handle Zod validation errors
            const newErrors: any = {}
            validationErrors.forEach((err: any) => {
              if (err.path && err.path.length > 0) {
                newErrors[err.path[0]] = err.message
              }
            })
            setErrors(newErrors)
            await showErrorAlert("Validasi Error", "Mohon periksa kembali form yang diisi");
          } else {
            await showErrorAlert("Error", error.response.data?.error || 'Validation error occurred');
          }
        } else {
          await showErrorAlert("Error", error.response?.data?.error || 'Terjadi kesalahan saat menyimpan data');
        }
      } else {
        await showErrorAlert("Network Error", 'Terjadi kesalahan jaringan. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, proofFile, onSubmit, validateForm, initialData, pathname, isSubmitting])

  const handleChange = useCallback((field: keyof ActivityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const handleFileChange = useCallback((file: File | null) => {
    setProofFile(file)
    if (errors.proof) {
      setErrors(prev => ({ ...prev, proof: undefined }))
    }
  }, [errors.proof])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Tanggal Kegiatan"
          type="date"
          value={formData.tanggal}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("tanggal", e.target.value)}
          required
          error={errors.tanggal}
          disabled={isSubmitting}
        />

        <Input
          label="Kegiatan"
          value={formData.kegiatan}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("kegiatan", e.target.value)}
          required
          error={errors.kegiatan}
          placeholder="Masukkan nama kegiatan"
          disabled={isSubmitting}
        />

        <Select
          label="Jenis Kegiatan"
          value={formData.jenisKegiatan}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange("jenisKegiatan", e.target.value)}
          options={JENIS_KEGIATAN_OPTIONS}
          required
          error={errors.jenisKegiatan}
          disabled={isSubmitting}
        />

        <Input
          label="Waktu Mulai"
          type="time"
          value={formData.waktuMulai}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("waktuMulai", e.target.value)}
          required
          error={errors.waktuMulai}
          disabled={isSubmitting}
        />

        <Input
          label="Waktu Selesai"
          type="time"
          value={formData.waktuSelesai}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("waktuSelesai", e.target.value)}
          required
          error={errors.waktuSelesai}
          disabled={isSubmitting}
        />

        <Select
          label="Tipe Pekerjaan"
          value={formData.tipePekerjaan}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange("tipePekerjaan", e.target.value)}
          options={TIPE_PEKERJAAN_OPTIONS}
          required
          error={errors.tipePekerjaan}
          disabled={isSubmitting}
        />

        <div className="md:col-span-2">
          <Input
            label="Lokasi Kegiatan"
            value={formData.lokasi}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("lokasi", e.target.value)}
            required
            error={errors.lokasi}
            placeholder="Masukkan lokasi kegiatan"
            disabled={isSubmitting}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Keterangan Kegiatan"
            value={formData.keterangan}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("keterangan", e.target.value)}
            required
            placeholder="Masukkan keterangan detail kegiatan"
            disabled={isSubmitting}
          />
          {errors.keterangan && <p className="text-red-500 text-sm mt-1">{errors.keterangan}</p>}
        </div>

        <div className="md:col-span-2">
          <FileInput
            label="Bukti Kegiatan"
            onChange={handleFileChange}
            value={proofFile}
            error={errors.proof}
            required={!initialData}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button 
          variant="outline" 
          onClick={onClose} 
          type="button"
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          type="button"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {initialData ? "Update" : "Tambah"}
        </Button>
      </div>
    </Modal>
  )
}

// =============================
// Activity Table Component - UPDATED WITH SWEETALERT2
// =============================
interface ActivityTableProps {
  activities: Activity[]
  onEdit: (activity: Activity) => void
  onDelete: (id: string) => void
}

const ActivityTable: React.FC<ActivityTableProps> = ({ activities, onEdit, onDelete }) => {
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }, [])

  const formatTime = useCallback((timeString: string): string => {
    return timeString.substring(11, 16); // take "HH:mm" part
  }, []);

  const getJenisKegiatanLabel = useCallback((value: string): string => {
    const option = JENIS_KEGIATAN_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }, [])

  const getTipePekerjaanLabel = useCallback((value: string): string => {
    const option = TIPE_PEKERJAAN_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const result = await showConfirmDialog(
      'Apakah Anda yakin?',
      'Kegiatan yang dihapus tidak dapat dikembalikan!',
      'Ya, Hapus!'
    );
    
    if (result.isConfirmed) {
      onDelete(id);
    }
  }, [onDelete])

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl mb-6 animate-pulse">
          <NotebookPen className="w-10 h-10 text-pink-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada kegiatan yang tercatat</h3>
        <p className="text-gray-500">Mulai dengan menambahkan kegiatan pertama Anda</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-max w-full border-collapse" role="table">
        <thead>
          <tr className="border-b border-pink-200">
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Tanggal</th>
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Bukti</th>
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Kegiatan</th>
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Jenis</th>
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Waktu</th>
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Tipe</th>
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Deskripsi</th>
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Lokasi</th>
            <th scope="col" className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50/30">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr
              key={activity.id}
              className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-rose-50/50 transition-all duration-300"
            >
              <td className="py-4 px-6 font-medium text-gray-900">{formatDate(activity.date)}</td>
              <td className="py-4 px-6 font-medium text-gray-900">
                <img src={`${activity.proof}`} alt="Proof" className="h-20 w-auto object-cover rounded" />
              </td>
              <td className="py-4 px-6">
                <div className="font-semibold text-gray-900">{activity.activity}</div>
              </td>
              <td className="py-4 px-6">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full">
                  {getJenisKegiatanLabel(activity.type)}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-gradient-to-r from-pink-100 to-rose-200 text-pink-700 rounded-full">
                  <Clock className="w-3 h-3" />
                  {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                  activity.work_type === 'online' 
                    ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700'
                    : activity.work_type === 'hybrid'
                    ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700'
                    : 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700'
                }`}>
                  {getTipePekerjaanLabel(activity.work_type)}
                </span>
              </td>
              <td className="py-4 px-6 text-gray-600 max-w-xs">
                <div className="truncate" title={activity.description}>
                  {activity.description || 'Tidak ada deskripsi'}
                </div>
              </td>
              <td className="py-4 px-6 text-gray-600 max-w-xs">
                <div className="truncate" title={activity.location}>
                  {activity.location}
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(activity)}
                    className="inline-flex items-center justify-center w-9 h-9 text-pink-600 hover:text-pink-700 hover:bg-pink-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                    title="Edit kegiatan"
                    aria-label={`Edit kegiatan ${activity.activity}`}
                    type="button"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="inline-flex items-center justify-center w-9 h-9 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                    title="Hapus kegiatan"
                    aria-label={`Hapus kegiatan ${activity.activity}`}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// =============================
// Utility functions for CSV export/import - UPDATED WITH SWEETALERT2
// =============================
const exportToCSV = async (activities: Activity[]): Promise<void> => {
  try {
    showLoadingAlert("Menyiapkan file CSV...");
    
    const headers = ['Tanggal', 'Waktu Mulai', 'Waktu Selesai', 'Kegiatan', 'Deskripsi']
    const csvContent = [
      headers.join(','),
      ...activities.map(activity => [
        activity.activity,
        activity.start_time,
        activity.end_time,
        `"${activity.activity.replace(/"/g, '""')}"`,
        `"${(activity.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logbook-aktivitas-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    Swal.close();
    await showSuccessAlert("Berhasil!", "File CSV berhasil didownload");
  } catch (error) {
    Swal.close();
    await showErrorAlert("Error", "Gagal mengexport file CSV");
  }
}

const importFromCSV = async (file: File, callback: (activities: {
        id: string,
        author: string,
        tanggal: string,
        kegiatan: string,
        jenisKegiatan: string,
        waktuMulai: string,
        waktuSelesai: string,
        tipePekerjaan: string,
        lokasi: string,
        keterangan: string,
        proof?: string | null
      }[]) => void): Promise<void> => {
  showLoadingAlert("Mengimport file CSV...");
  
  const reader = new FileReader()
  reader.onload = async (e: ProgressEvent<FileReader>) => {
    try {
      const text = (e.target?.result as string) || ''
      if (!text) {
        Swal.close();
        await showErrorAlert("Error", "File CSV kosong atau tidak valid");
        return;
      }

      console.log('CSV content:', text)

      // Split by lines and properly parse CSV with robust handling
      const lines = text.split(/\r?\n/) // Handle both \n and \r\n line endings
      
      const importedActivities: {
        id: string,
        author: string,
        tanggal: string,
        kegiatan: string,
        jenisKegiatan: string,
        waktuMulai: string,
        waktuSelesai: string,
        tipePekerjaan: string,
        lokasi: string,
        keterangan: string,
        proof?: string | null
      }[] = lines.slice(1)
      .filter(line => line.trim())
      .map((line, index) => {
        // Robust CSV parsing function
        const parseCSVLine = (line: string): string[] => {
          const values = []
          let current = ''
          let inQuotes = false
          let escapeNext = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            const nextChar = line[i + 1]
            
            if (escapeNext) {
              current += char
              escapeNext = false
            } else if (char === '\\' && inQuotes) {
              escapeNext = true
            } else if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // Handle escaped quotes ("")
                current += char
                i++ // Skip next quote
              } else {
                inQuotes = !inQuotes
              }
            } else if (char === ',' && !inQuotes) {
              values.push(current)
              current = ''
            } else {
              current += char
            }
          }
          values.push(current) // Push the last value
          
          return values
        }
        
        const rawValues = parseCSVLine(line)
        
        // Clean and normalize values with comprehensive handling
        const cleanValues = rawValues.map((val, idx) => {
          if (val === null || val === undefined) return ''
          
          let cleaned = String(val)
            .replace(/^["'\s]+|["'\s]+$/g, '') // Remove quotes and whitespace from start/end
            .replace(/""/g, '"') // Handle escaped quotes
            .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
            .trim()
          
          // Handle various empty value representations
          if (cleaned === 'null' || cleaned === 'NULL' || 
              cleaned === 'undefined' || cleaned === 'n/a' || 
              cleaned === 'N/A' || cleaned === '-' || 
              cleaned === '' || cleaned === ' ') {
            cleaned = ''
          }
          
          return cleaned
        })
        
        console.log('Parsed values:', cleanValues)

        // Parse date from various formats to proper format
        const parseDateString = (dateStr: string): string => {
          if (!dateStr) return new Date().toISOString()
          
          try {
            // Handle various date formats
            let normalizedDate = dateStr.toLowerCase().trim()
            
            // Remove common prefixes/suffixes
            normalizedDate = normalizedDate.replace(/^(date|tanggal):\s*/i, '')
            
            // Handle DD/MM/YYYY or DD-MM-YYYY format
            const ddmmyyyy = normalizedDate.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
            if (ddmmyyyy) {
              let [, day, month, year] = ddmmyyyy
              day = day.padStart(2, '0')
              month = month.padStart(2, '0')
              
              // Handle 2-digit years
              if (year.length === 2) {
                const currentYear = new Date().getFullYear()
                const currentCentury = Math.floor(currentYear / 100) * 100
                year = String(currentCentury + parseInt(year))
              }
              
              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
              if (!isNaN(date.getTime())) {
                return date.toISOString().split("T")[0]
              }
            }
            
            // Handle MM/DD/YYYY format
            const mmddyyyy = normalizedDate.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
            if (mmddyyyy) {
              let [, month, day, year] = mmddyyyy
              // Try MM/DD/YYYY if DD/MM/YYYY failed
              if (parseInt(month) <= 12) {
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                if (!isNaN(date.getTime())) {
                  return date.toISOString().split("T")[0]
                }
              }
            }
            
            // Handle YYYY-MM-DD format
            const yyyymmdd = normalizedDate.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/)
            if (yyyymmdd) {
              const [, year, month, day] = yyyymmdd
              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
              if (!isNaN(date.getTime())) {
                return date.toISOString().split("T")[0]
              }
            }
            
            // Handle relative dates
            if (normalizedDate.includes('today') || normalizedDate.includes('hari ini')) {
              return new Date().toISOString()
            }
            if (normalizedDate.includes('yesterday') || normalizedDate.includes('kemarin')) {
              const yesterday = new Date()
              yesterday.setDate(yesterday.getDate() - 1)
              return yesterday.toISOString()
            }
            if (normalizedDate.includes('tomorrow') || normalizedDate.includes('besok')) {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              return tomorrow.toISOString()
            }
            
            // Handle timestamp (Unix timestamp)
            if (/^\d{10}$/.test(normalizedDate)) {
              return new Date(parseInt(normalizedDate) * 1000).toISOString()
            }
            if (/^\d{13}$/.test(normalizedDate)) {
              return new Date(parseInt(normalizedDate)).toISOString()
            }
            
            // Fallback to native Date parsing
            const date = new Date(dateStr)
            return isNaN(date.getTime()) ? date.toISOString().split("T")[0] : date.toISOString().split("T")[0]
            
          } catch (error) {
            console.warn('Date parsing error for:', dateStr, error)
            return new Date().toISOString()
          }
        }

        // Parse time and combine with date - handle various time formats
        const parseTimeString = (timeStr: string, baseDate: string): string => {
          if (!timeStr) return ''
          
          try {
            let normalizedTime = timeStr.toLowerCase().trim()
            
            // Remove common prefixes/suffixes
            normalizedTime = normalizedTime.replace(/^(time|waktu|jam):\s*/i, '')
            normalizedTime = normalizedTime.replace(/\s*(am|pm|wib|wit|wita)$/i, '')
            
            let hours = 0, minutes = 0, seconds = 0
            const isPM = /pm$/i.test(timeStr)
            const isAM = /am$/i.test(timeStr)
            
            // Handle HH:MM:SS format
            let timeMatch = normalizedTime.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/)
            if (timeMatch) {
              hours = parseInt(timeMatch[1])
              minutes = parseInt(timeMatch[2])
              seconds = parseInt(timeMatch[3])
            } else {
              // Handle HH:MM format
              timeMatch = normalizedTime.match(/^(\d{1,2}):(\d{1,2})$/)
              if (timeMatch) {
                hours = parseInt(timeMatch[1])
                minutes = parseInt(timeMatch[2])
              } else {
                // Handle H or HH format (hours only)
                timeMatch = normalizedTime.match(/^(\d{1,2})$/)
                if (timeMatch) {
                  hours = parseInt(timeMatch[1])
                }
              }
            }
            
            // Handle 12-hour format
            if (isPM && hours < 12) hours += 12
            if (isAM && hours === 12) hours = 0
            
            // Validate time values
            if (hours < 0 || hours > 23) hours = 0
            if (minutes < 0 || minutes > 59) minutes = 0
            if (seconds < 0 || seconds > 59) seconds = 0
            
            const date = new Date(baseDate)
            
            // Handle special cases
            if (
              normalizedTime === '0:00:00' || normalizedTime === '00:00:00' || 
              normalizedTime === '24:00:00' || normalizedTime === '0:00'
            ) {
              if (timeStr === normalizedTime && hours === 0) {
                date.setDate(date.getDate() + 1)
              }
            }
            
            date.setHours(hours, minutes, seconds, 0)
            
            if (!isNaN(date.getTime())) {
              return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
            }
            
            return ''
          } catch (error) {
            console.warn('Time parsing error for:', timeStr, error)
            return ''
          }
        }

        const formattedDate = parseDateString(cleanValues[0])
        const startTime = parseTimeString(cleanValues[5], formattedDate)
        const endTime = parseTimeString(cleanValues[6], formattedDate)

        // Map work type from various representations to expected values
        const mapWorkType = (workTypeStr: string): string => {
          if (!workTypeStr) return 'offline' // default
          
          const normalized = workTypeStr.toLowerCase().trim()
          
          // Online variations
          if (normalized.includes('online') || normalized.includes('daring') || 
              normalized.includes('virtual') || normalized.includes('remote') ||
              normalized.includes('digital') || normalized.includes('web') ||
              normalized === 'ol' || normalized === 'on') {
            return 'online'
          }
          
          // Hybrid variations  
          if (normalized.includes('hybrid') || normalized.includes('campuran') ||
              normalized.includes('blended') || normalized.includes('mixed') ||
              normalized.includes('kombinasi')) {
            return 'hybrid'
          }
          
          // Offline variations (default)
          if (normalized.includes('offline') || normalized.includes('luring') ||
              normalized.includes('onsite') || normalized.includes('fisik') ||
              normalized.includes('langsung') || normalized.includes('tatap muka') ||
              normalized === 'off' || normalized === 'of') {
            return 'offline'
          }
          
          return 'offline' // default fallback
        }

        // Parse and normalize text fields
        const normalizeText = (text: string, maxLength?: number): string => {
          if (!text) return ''
          
          let normalized = String(text)
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with space
            .trim()
          
          // Remove common placeholder texts
          if (normalized.toLowerCase() === 'tidak ada' ||
              normalized.toLowerCase() === 'kosong' ||
              normalized.toLowerCase() === 'empty' ||
              normalized.toLowerCase() === 'none' ||
              normalized === '-' || normalized === '—') {
            normalized = ''
          }
          
          // Truncate if needed
          if (maxLength && normalized.length > maxLength) {
            normalized = normalized.substring(0, maxLength).trim()
          }
          
          return normalized
        }

        // Parse location with fallback options
        const parseLocation = (primaryLocation: string, fallbackLocation: string): string => {
          const primary = normalizeText(primaryLocation)
          const fallback = normalizeText(fallbackLocation)
          
          if (primary) return primary
          if (fallback) return fallback
          return 'Tidak diketahui'
        }

        // Parse activity type with mapping
        const mapActivityType = (typeStr: string): string => {
          if (!typeStr) return 'berita-kegiatan' // default
          
          const normalized = typeStr.toLowerCase().trim()
          
          // Map common Indonesian activity types
          const typeMapping = {
            'online': 'online',
            'hybrid': 'hybrid', 
            'offline': 'offline',
          }
          
          for (const [key, value] of Object.entries(typeMapping)) {
            if (normalized.includes(key)) {
              return value
            }
          }
          
          return normalizeText(typeStr) || 'berita-kegiatan'
        }

        return {
          id: `imported-${Date.now()}-${index}`,
          author: cleanValues[1] || 'Imported',
          tanggal: formattedDate,
          waktuMulai: startTime,
          waktuSelesai: endTime,
          kegiatan: cleanValues[3] || '',
          keterangan: cleanValues[8] || 'Tidak ada deskripsi',
          jenisKegiatan: cleanValues[4] || 'berita-kegiatan',
          tipePekerjaan: mapWorkType(cleanValues[7] || 'offline'),
          lokasi: cleanValues[11] || cleanValues[9] || 'Tidak diketahui', // Column 11 is "Lokasi Kegiatan"
          proof: cleanValues[2] || null
        }
      })
      .filter(activity => {
        const isValid = activity.tanggal && 
                        activity.waktuMulai && 
                        activity.waktuSelesai && 
                        activity.kegiatan.trim()
        
        if (!isValid) {
          console.log('Filtered out invalid activity:', activity)
        }
        
        return isValid
      })

      console.log('Final imported activities:', importedActivities)

      try {
        const response = await axios.post<ApiResponse>('/api/activities', importedActivities, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
          callback(importedActivities);
          Swal.close();
          await showSuccessAlert("Berhasil!", `${importedActivities.length} kegiatan berhasil diimport`);
          return;
        }

        // Jika success = false tapi tidak throw error
        console.warn('API responded with success=false:', response.data);
        Swal.close();
        await showErrorAlert("Error", response.data.message || 'Terjadi kesalahan saat menyimpan data');

      } catch (error: any) {
        Swal.close();
        
        // Axios error handling
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const data = error.response?.data;

          // Validation errors
          if (status === 400 && data?.details && Array.isArray(data.details)) {
            const newErrors: Record<string, string> = {};
            data.details.forEach((err: any) => {
              if (err.path && err.path.length > 0 && err.message) {
                newErrors[err.path[0]] = err.message;
              }
            });
            await showErrorAlert("Validasi Error", "Mohon periksa kembali form yang diisi");
            return;
          }

          // Server errors (5xx)
          if (status && status >= 500) {
            console.error('Server error:', data);
            await showErrorAlert("Server Error", data?.error || 'Terjadi kesalahan server');
            return;
          }

          // Other Axios errors (network, 4xx selain validation)
          console.warn('API error response:', data);
          await showErrorAlert("Error", data?.error || 'Terjadi kesalahan saat menyimpan data');
          return;
        }

        // Non-Axios errors (unexpected)
        console.error('Unexpected error:', error);
        await showErrorAlert("Network Error", 'Terjadi kesalahan jaringan atau tidak diketahui. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error parsing CSV:', error)
      Swal.close();
      await showErrorAlert("Error", "Format file CSV tidak valid. Mohon periksa format file.");
    }
  }
  reader.onerror = async () => {
    Swal.close();
    await showErrorAlert("Error", "Gagal membaca file");
  }
  reader.readAsText(file)
}

// =============================
// Main Dashboard Layout - UPDATED WITH SWEETALERT2
// =============================
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  const fetchActivities = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const response = await axios.get<PaginatedResponse<Activity>>(
        `/api/activities/${pathname.includes("ferrol-azki") ? "ferrol-azki" : "noyaaa"}?page=${pageNumber}&limit=${10}`
      );

      if (response.data.success) {
        setActivities(response.data.data || []);
        setPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.pages);
      } else {
        throw new Error(response.data.error || "Failed to fetch activities");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      await showErrorAlert("Error", "Gagal memuat data kegiatan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities()
  }, []);

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  // Calculate statistics with memoization
  const stats: StatisticsData = useMemo(() => {
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay())
    currentWeekStart.setHours(0, 0, 0, 0)

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let weeklyHours = 0
    let monthlyHours = 0
    let totalHours = 0

    activities.forEach((activity) => {
      const activityDate = new Date(activity.date)
      const [startHour, startMinute] = formatTime(activity.start_time).split(':').map(Number)
      const [endHour, endMinute] = formatTime(activity.end_time).split(':').map(Number)

      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute
      const hours = (endMinutes - startMinutes) / 60

      if (hours > 0) {
        totalHours += hours

        if (activityDate >= currentWeekStart) {
          weeklyHours += hours
        }

        if (activityDate >= currentMonthStart) {
          monthlyHours += hours
        }
      }
    })
  

    return {
      weekly: Math.round(weeklyHours * 100) / 100,
      monthly: Math.round(monthlyHours * 100) / 100,
      total: Math.round(totalHours * 100) / 100,
    }
  }, [activities])

  // Updated handlers for multipart form submission
  const handleAddActivity = useCallback((activityData: ActivityFormData | Activity) => {
    // The actual API call is now handled inside the ActivityForm component
    // This handler just updates the local state after successful submission
    if ('id' in activityData) {
      setActivities((prev) => [...prev, activityData as Activity]);
    }
    setIsFormOpen(false);
  }, []);

  const handleEditActivity = useCallback(async (activityData: Activity | ActivityFormData) => {
    if ('id' in activityData) {
      setActivities((prev) => prev.map((a) => (a.id === activityData.id ? (activityData as Activity) : a)))
      await fetchActivities(page)
    }
    setEditingActivity(null)
    setIsFormOpen(false)
  }, [])

  const handleDeleteActivity = useCallback(async (id: string) => {
    try {
      showLoadingAlert("Menghapus kegiatan...");
      
      // Call API to delete the activity
      const response = await axios.delete(`/api/activities/delete/${id}`)
      
      if (response.data.success) {
        setActivities((prev) => prev.filter((a) => a.id !== id))
        Swal.close();
        await showSuccessAlert("Berhasil!", "Kegiatan berhasil dihapus");
      } else {
        throw new Error(response.data.error || 'Failed to delete activity')
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
      Swal.close();
      await showErrorAlert("Error", "Gagal menghapus kegiatan. Silakan coba lagi.");
    }
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(activities)
  }, [activities])

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      importFromCSV(file, (importedActivities) => {
        // Callback to update the activities state with imported data
        const mappedData = importedActivities.map(activity => ({
          id: activity.id,
          date: activity.tanggal,
          author: activity.author,
          activity: activity.kegiatan,
          type: activity.jenisKegiatan,
          start_time: activity.waktuMulai,
          end_time: activity.waktuSelesai,
          work_type: activity.tipePekerjaan,
          location: activity.lokasi,
          description: activity.keterangan,
          proof: activity.proof || null
      }))

      setActivities((prev) => [...prev, ...mappedData])
      })
      event.target.value = ''
    }
  }, [])

  const openEditForm = useCallback((activity: Activity) => {
    setEditingActivity(activity)
    setIsFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingActivity(null)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/50 flex">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-pink-400/10 to-rose-400/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-rose-400/10 to-pink-400/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/5 to-rose-400/5 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Fixed Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area - with proper margin for desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Fixed Navbar */}
        <Navbar onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        
        {/* Main Content */}
        <main className="flex-1 relative overflow-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-8">

            {/* Welcome Card */}
            <section>
              <Card className="bg-gradient-to-r from-orange-400 to-yellow-500 border-0 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between pt-5">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Halo, Sayangg!</h2>
                      <p className="text-orange-100">Selamat datang di dashboard kita!</p>
                    </div>
                    <div className="hidden md:block">
                      <div className="w-24 h-16 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
                        <NotebookPen className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Statistics Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-pink-100">Total Jam Minggu Ini</CardTitle>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform duration-300">{stats.weekly} jam</div>
                  <div className="flex items-center text-pink-100 text-sm">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Aktivitas dalam 7 hari terakhir
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-rose-100">Total Jam Bulan Ini</CardTitle>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform duration-300">{stats.monthly} jam</div>
                  <div className="flex items-center text-rose-100 text-sm">
                    <Zap className="w-4 h-4 mr-2" />
                    Aktivitas bulan berjalan
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-600 to-rose-700 text-white border-0 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-pink-100">Total Keseluruhan</CardTitle>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform duration-300">{stats.total} jam</div>
                  <div className="flex items-center text-pink-100 text-sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Semua aktivitas yang tercatat
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Activity Table */}
            <section>
              <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/95">
                <CardHeader className="bg-gradient-to-r from-pink-50/80 to-rose-50/50 border-b border-pink-100/50 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-3">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImport}
                        className="hidden"
                        id="import-file"
                        aria-label="Import CSV file"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("import-file")?.click()}
                        className="flex items-center gap-2 shadow-lg text-sm"
                        type="button"
                      >
                        <Upload className="h-4 w-4" />
                        Import CSV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleExport}
                        className="flex items-center gap-2 shadow-lg text-sm"
                        disabled={activities.length === 0}
                        type="button"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => setIsFormOpen(true)}
                      className="flex items-center gap-2 shadow-xl whitespace-nowrap"
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Kegiatan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ActivityTable
                    activities={activities}
                    onEdit={openEditForm}
                    onDelete={handleDeleteActivity}
                  />
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Activity Form Modal */}
            <ActivityForm
              isOpen={isFormOpen}
              onClose={closeForm}
              onSubmit={editingActivity ? handleEditActivity : handleAddActivity}
              initialData={editingActivity}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout