import { z } from 'zod';

// Constants
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm
const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const JENIS_KEGIATAN = ["berita-kegiatan", "berita-acara", "berita-acara-ujian"] as const;
const TIPE_PEKERJAAN = ["online", "hybrid", "offline"] as const;

export const createActivitySchema = z.object({
  author: z.string().min(3).max(100),
  tanggal: z.string().regex(dateRegex),
  kegiatan: z.string().min(3).max(100),
  jenisKegiatan: z.enum(JENIS_KEGIATAN),
  waktuMulai: z.string().regex(timeRegex),
  waktuSelesai: z.string().regex(timeRegex),
  tipePekerjaan: z.enum(TIPE_PEKERJAAN),
  lokasi: z.string().min(2).max(100),
  keterangan: z.string().max(255).optional(),
  proof: z.string().optional(),
}).refine(
  (data) => {
    if (data.waktuMulai && data.waktuSelesai) {
      const [sh, sm] = data.waktuMulai.split(":").map(Number);
      const [eh, em] = data.waktuSelesai.split(":").map(Number);
      return eh > sh || (eh === sh && em > sm);
    }
    return true;
  },
  { message: "Waktu selesai harus setelah waktu mulai", path: ["waktuSelesai"] }
);