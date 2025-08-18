import { prisma } from '../../../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

// Constants
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm
const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const JENIS_KEGIATAN = ["berita-kegiatan", "berita-acara", "berita-acara-ujian"] as const;
const TIPE_PEKERJAAN = ["online", "hybrid", "offline"] as const;

// Zod schema for PUT (update)
export const updateActivitySchema = z.object({
  author: z.string().min(3).max(100).optional(),
  tanggal: z.string().regex(dateRegex).optional(),
  kegiatan: z.string().min(3).max(100).optional(),
  jenisKegiatan: z.enum(JENIS_KEGIATAN).optional(),
  waktuMulai: z.string().regex(timeRegex).optional(),
  waktuSelesai: z.string().regex(timeRegex).optional(),
  tipePekerjaan: z.enum(TIPE_PEKERJAAN).optional(),
  lokasi: z.string().min(2).max(100).optional(),
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
// PUT (Update) Activity
// ====================
export async function PUT(request: NextRequest, context : { params: { id: string } }) {
  try {
    const id = await context.params.id;
    const formData = await request.formData();

    const updateData: any = {
      author: formData.get('author') as string | undefined,
      tanggal: formData.get('tanggal') as string | undefined,
      kegiatan: formData.get('kegiatan') as string | undefined,
      jenisKegiatan: formData.get('jenisKegiatan') as string | undefined,
      waktuMulai: formData.get('waktuMulai') as string | undefined,
      waktuSelesai: formData.get('waktuSelesai') as string | undefined,
      tipePekerjaan: formData.get('tipePekerjaan') as string | undefined,
      lokasi: formData.get('lokasi') as string | undefined,
      keterangan: formData.get('keterangan') as string | undefined,
    };

    const proofFile = formData.get('proof') as File | null;
    if (proofFile && proofFile.size > 0) {
      updateData.proof = await handleFileUpload(proofFile);
    }

    const validatedData = updateActivitySchema.parse(updateData);

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        author: validatedData.author,
        date: validatedData.tanggal,
        activity: validatedData.kegiatan,
        type: validatedData.jenisKegiatan,
        start_time: validatedData.waktuMulai ? new Date(`1970-01-01T${validatedData.waktuMulai}:00Z`) : undefined,
        end_time: validatedData.waktuSelesai ? new Date(`1970-01-01T${validatedData.waktuSelesai}:00Z`) : undefined,
        work_type: validatedData.tipePekerjaan,
        location: validatedData.lokasi,
        description: validatedData.keterangan || undefined,
        proof: validatedData.proof || undefined,
      },
    });

    return NextResponse.json({ success: true, data: activity, message: "Activity updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Validation error", details: error }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}