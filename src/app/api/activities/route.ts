import { handleFileUpload } from '@/utils/upload-helpers';
import { prisma } from '../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createActivitySchema } from '@/app/lib/validations/createSchema';

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
