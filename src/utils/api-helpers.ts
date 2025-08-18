// src/utils/api-helpers.ts
import { NextResponse } from 'next/server';
import { ApiResponse } from '@/app/types/api';

export function successResponse<T>(
  data: T,
  message = 'Success',
  status = 200
) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return NextResponse.json(response, { status });
}

export function errorResponse(
  error: string,
  status = 500,
  details?: any
) {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { details }),
  };
  return NextResponse.json(response, { status });
}