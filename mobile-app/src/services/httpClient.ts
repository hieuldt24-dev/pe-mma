import type { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  token?: string | null;
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

export function createApiClient(baseUrl: string, timeoutMs = 15_000) {
  let unauthorizedHandler: ((token: string) => void) | undefined;

  function setUnauthorizedHandler(handler?: (token: string) => void) {
    unauthorizedHandler = handler;
  }

  async function api<T = null>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          Accept: 'application/json',
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
      });
      if (response.status === 401 && options.token) unauthorizedHandler?.(options.token);
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        throw new ApiError(
          'Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.',
          response.status,
        );
      }
      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        data.status !== response.status ||
        typeof data.message !== 'string' ||
        !Object.prototype.hasOwnProperty.call(data, 'data')
      ) {
        throw new ApiError(
          'Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.',
          response.status,
        );
      }
      const result = data as ApiResponse<T>;
      if (!response.ok) throw new ApiError(result.message, response.status);
      return result.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (options.signal?.aborted && !timedOut) throw new Error('Yêu cầu đã được hủy.');
      throw new Error(
        timedOut
          ? 'Kết nối quá thời gian. Vui lòng tải lại dữ liệu trước khi thử thao tác ghi lần nữa.'
          : 'Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ API.',
      );
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
    }
  }

  return { api, setUnauthorizedHandler };
}
