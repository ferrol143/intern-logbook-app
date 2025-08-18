import { prisma } from '../../../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { updateActivitySchema } from '@/app/lib/validations/updateSchema';
import z from 'zod';
import { handleFileUpload } from '@/utils/upload-helpers';

// ====================
// PUT (Update) Activity
// ====================
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
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