import { handleFileUpload } from '@/utils/upload-helpers';
import { prisma } from '../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createActivitySchema } from '@/app/lib/validations/createSchema';

// Schema for bulk creation
const bulkCreateActivitySchema = z.array(createActivitySchema).min(1, "At least one activity is required");

// Helper function to process single activity data
async function processActivityData(data: any, proofFile?: File | null) {
  const processedData = { ...data };
  
  if (proofFile && proofFile.size > 0) {
    processedData.proof = await handleFileUpload(proofFile);
  }
  
  return createActivitySchema.parse(processedData);
}

// Helper function to create activity in database
async function createActivity(validatedData: any) {
  return await prisma.activity.create({
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
}

// Helper function for bulk creation (moved inside, not exported)
async function handleBulkCreate(activities: any[]) {
  // Validate all activities first
  const validatedActivities = bulkCreateActivitySchema.parse(activities);
  
  // Use createMany for better performance (but doesn't return created records)
  const result = await prisma.activity.createMany({
    data: validatedActivities.map(activity => ({
      author: activity.author,
      date: activity.tanggal,
      activity: activity.kegiatan,
      type: activity.jenisKegiatan,
      start_time: new Date(`1970-01-01T${activity.waktuMulai}:00Z`),
      end_time: new Date(`1970-01-01T${activity.waktuSelesai}:00Z`),
      work_type: activity.tipePekerjaan,
      location: activity.lokasi,
      description: activity.keterangan || undefined,
      proof: activity.proof || undefined,
    })),
    skipDuplicates: false, // Set to true if you want to skip duplicates
  });
  
  return {
    success: true,
    count: result.count,
    message: `${result.count} activities created successfully`,
  };
}

// ====================
// POST (Create) Activity - Single or Bulk
// ====================
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle multipart/form-data (single activity with file)
    if (contentType.includes('multipart/form-data')) {
      return await handleSingleActivityWithFile(request);
    }
    
    // Handle application/json (single or bulk activities)
    if (contentType.includes('application/json')) {
      return await handleJSONActivities(request);
    }
    
    return NextResponse.json(
      { success: false, error: "Unsupported content type" },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('POST /api/activities error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation error", 
          details: error
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle single activity with file upload
async function handleSingleActivityWithFile(request: NextRequest) {
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
  const validatedData = await processActivityData(newData, proofFile);
  const activity = await createActivity(validatedData);

  return NextResponse.json({
    success: true,
    data: activity,
    message: "Activity created successfully",
  });
}

// Handle JSON activities (single or bulk)
async function handleJSONActivities(request: NextRequest) {
  const body = await request.json();
  
  // Check if it's an array (bulk) or single object
  const isArray = Array.isArray(body);
  const activities = isArray ? body : [body];
  
  // Validate the data
  if (isArray) {
    bulkCreateActivitySchema.parse(activities);
  } else {
    createActivitySchema.parse(body);
  }
  
  // Process activities
  const results = [];
  const errors = [];
  
  // Use transaction for bulk operations
  if (isArray && activities.length > 1) {
    try {
      const createdActivities = await prisma.$transaction(async (tx) => {
        const created = [];
        for (let i = 0; i < activities.length; i++) {
          try {
            const validatedData = createActivitySchema.parse(activities[i]);
            const activity = await tx.activity.create({
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
            created.push(activity);
          } catch (error) {
            throw new Error(`Error at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        return created;
      });
      
      return NextResponse.json({
        success: true,
        data: createdActivities,
        message: `${createdActivities.length} activities created successfully`,
        count: createdActivities.length
      });
      
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Bulk creation failed", 
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }
  } else {
    // Single activity
    const validatedData = createActivitySchema.parse(activities[0]);
    const activity = await createActivity(validatedData);
    
    return NextResponse.json({
      success: true,
      data: activity,
      message: "Activity created successfully",
    });
  }
}