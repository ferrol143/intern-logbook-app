import { prisma } from '../../../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

// ====================
// DELETE Activity
// ====================
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;

    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
    }

    // Delete proof file from disk if exists
    if (activity.proof) {
      const filePath = path.join(process.cwd(), 'public', activity.proof);
      try { await unlink(filePath); } catch { /* ignore if file missing */ }
    }

    await prisma.activity.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Activity deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}