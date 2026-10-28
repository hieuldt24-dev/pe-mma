import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/httpClient';

const client = createApiClient(API_URL);

export const api = client.api;
export const setUnauthorizedHandler = client.setUnauthorizedHandler;
export { ApiError } from '@/services/httpClient';
