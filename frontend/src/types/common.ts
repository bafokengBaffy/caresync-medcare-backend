export interface ApiResponse<T> { data: T; meta?: unknown; errors?: unknown; }
export interface PageResponse<T> { content: T[]; page: number; size: number; total: number; }
export interface ApiError { code: string; message: string; details?: unknown; requestId?: string; timestamp: string; }
export type SortDir = 'asc' | 'desc';
