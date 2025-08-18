import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

// Helper function for file upload
export async function handleFileUpload(file: File): Promise<string> {
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