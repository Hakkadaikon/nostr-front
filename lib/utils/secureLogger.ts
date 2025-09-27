/**
 * セキュアなログ機能
 * プロダクション環境では機密情報を含むログを出力しない
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * セキュリティ配慮されたログ出力
 * プロダクション環境では機密情報を含む可能性があるデバッグログを出力しない
 */
export const secureLog = {
  debug: (message: string, data?: any) => {
    if (isDevelopment || isTest) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? sanitizeLogData(data) : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? sanitizeLogData(data) : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  
  security: (message: string, data?: any) => {
    // セキュリティ関連のログは常に出力するが、機密情報は除去
    console.log(`[SECURITY] ${message}`, data ? sanitizeLogData(data) : '');
  }
};

/**
 * ログデータから機密情報を除去
 */
function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = [
    'nsec', 'privateKey', 'secretKey', 'password', 'token', 'key',
    'nsecPrefix', 'nsecLength', 'nsecType', 'secret'
  ];
  
  const sanitized = { ...data };
  
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  // ネストされたオブジェクトも処理
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * パフォーマンス測定用のログ
 */
export function performanceLog(operation: string, startTime: number): void {
  const duration = performance.now() - startTime;
  secureLog.debug(`[PERF] ${operation} completed in ${duration.toFixed(2)}ms`);
}

/**
 * セキュリティイベントのログ
 */
export function securityLog(event: string, details?: any): void {
  const timestamp = new Date().toISOString();
  secureLog.security(`Security Event: ${event} at ${timestamp}`, details);
}

/**
 * 開発環境でのみデバッグ情報を表示
 */
export function devLog(message: string, data?: any): void {
  if (isDevelopment) {
    console.log(`[DEV] ${message}`, data);
  }
}