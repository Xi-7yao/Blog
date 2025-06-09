export interface ApiResponse<T> {
    data: T;
    error: { message: string; code: string } | null;
    status: number;
  }
  
  export interface ErrorResponse {
    error: { message: string; code: string };
    status: number;
  }