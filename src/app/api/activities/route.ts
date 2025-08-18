import { prisma } from '../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

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

// Helper function for file upload
async function handleFileUpload(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'activities');
  await mkdir(uploadDir, { recursive: true });

  const timestamp = Date.now();
  const fileExt = path.extname(file.name);
  const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/activities/${fileName}`;
}

// ====================
// POST (Create) Activity
// ====================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const newData: any = {
      author: formData.get('author') as string,
      tanggal: formData.get('tanggal') as string,
      kegiatan: formData.get('kegiatan') as string,
      jenisKegiatan: formData.get('jenisKegiatan') as string,
      waktuMulai: formData.get('waktuMulai') as string,
      waktuSelesai: formData.get('waktuSelesai') as string,
      tipePekerjaan: formData.get('tipePekerjaan') as string,
      lokasi: formData.get('lokasi') as string,
      keterangan: formData.get('keterangan') as string | undefined,
    };

    const proofFile = formData.get('proof') as File | null;
    if (proofFile && proofFile.size > 0) {
      newData.proof = await handleFileUpload(proofFile);
    }

    const validatedData = createActivitySchema.parse(newData);

    const activity = await prisma.activity.create({
      data: {
        author: validatedData.author,
        date: validatedData.tanggal,
        activity: validatedData.kegiatan,
        type: validatedData.jenisKegiatan,
        start_time: new Date(`1970-01-01T${validatedData.waktuMulai}:00Z`),
        end_time: new Date(`1970-01-01T${validatedData.waktuSelesai}:00Z`),
        work_type: validatedData.tipePekerjaan,
        location: validatedData.lokasi,
        description: validatedData.keterangan || undefined,
        proof: validatedData.proof || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: activity,
      message: "Activity created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error},
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
