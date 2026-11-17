export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'AI_INSUFFICIENT_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VERSION_CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA'
  | 'AI_LIMIT_REACHED'
  | 'RATE_LIMITED'
  | 'AI_PROVIDER_ERROR'
  | 'AI_INVALID_OUTPUT'
  | 'EXPORT_FAILED';

export interface ValidationErrorDetail {
  path: string;
  code: string;
  message?: string;
}

export interface AppErrorResponse {
  error: {
    code: AppErrorCode;
    message: string;
    details?: ValidationErrorDetail[];
    currentVersion?: number;
    currentData?: any;
  };
}

export class AppError extends Error {
  code: AppErrorCode;
  statusCode: number;
  details?: ValidationErrorDetail[];

  constructor(code: AppErrorCode, message: string, statusCode = 400, details?: ValidationErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
