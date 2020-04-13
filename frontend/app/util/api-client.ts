import {NamedError} from 'common/util/named-error';
import {isPojo} from 'common/util/pojo';

export type ApiResponse<DataType> = ErrorResponse | SuccessResponse<DataType>;

export interface SuccessResponse<DataType> {
  status: `ok`;
  data: DataType;
}

export interface ErrorResponse {
  status: `error`;
  message: string;
  code?: string;
  data?: any;
}

export interface FetchOptions {
  method?: `GET` | `POST` | `PUT` | `PATCH` | `DELETE`;

  /** extra headers */
  headers?: {[headerName: string]: string};

  /** request's body, only valid for POST/PUT/PATCH requests */
  body?: string | FormData;

  /** extra params for browser fetch call */
  fetchParams?: Partial<RequestInit>;
}

export type BodyData = string | FormData | {[prop: string]: any};

// https://stackoverflow.com/questions/49434751/how-to-declare-a-function-that-throws-an-error-in-typescript
export function logAndThrow(err: Error): never {
  console.error(err);
  throw err;
}

function normalizeBody(data: BodyData): string | FormData {
  if (data instanceof FormData) {
    return data;
  } else if (typeof data === `object`) {
    if (isPojo(data)) {
      return JSON.stringify(data);
    }
    logAndThrow(new Error(`Invalid data: ${data}, must be plain object or array`));
  }

  return data;
}

function encodeQueryParams(queryParams: Record<string, string | number | boolean>): string {
  return Object.entries(queryParams)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join(`&`);
}

export function statusToMessage(status: number): string {
  const errorStatusMap: {[status: number]: string} = {
    200: `OK`,

    400: `Bad Request`,
    401: `Unauthorized`,
    402: `API Limit Exceeded`,
    403: `Forbidden`,
    404: `Not Found`,
    405: `Method Not Allowed`,
    408: `Request Timeout`,
    413: `Payload Too Large`,
    414: `URI Too Long`,
    429: `Too Many Requests`,
    451: `Unavailable For Legal Reasons`,

    500: `Internal Server Error`,
    501: `Not Implemented`,
    502: `Bad Gateway`,
    503: `Service Unavailable`,
    504: `Gateway Timeout`,
  };

  const errorMsg = errorStatusMap[status] || `Invalid Response`;
  return `${status} (${errorMsg})`;
}

export class FetchResponseError extends NamedError {
  response: Response;
  message: string;

  constructor(response: Response, message = ``) {
    super(message);
    this.response = response;
    this.message = message || `${statusToMessage(response.status)} (${response.url})`;
  }
}

export class ApiError extends NamedError {
  status: number;
  data: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function parseResponse<DataType>(response: Response): Promise<DataType> {
  let responseJson: ApiResponse<DataType>;
  try {
    responseJson = await response.json();
  } catch (err) {
    return logAndThrow(new FetchResponseError(response));
  }

  switch (responseJson.status) {
    case `ok`:
      return responseJson.data;
    case `error`:
      return logAndThrow(new ApiError(responseJson.message, response.status, responseJson.data));
    default:
      logAndThrow(new ApiError(`Invalid Api response. status should be either 'ok' or 'error'`, 400, responseJson));
  }
}

export class ApiClient {
  public async get<DataType>(
    url: string,
    queryParams: {[key: string]: any} = null,
    options?: FetchOptions,
  ): Promise<DataType> {
    const apiUrl = queryParams ? `${url}?${encodeQueryParams(queryParams)}` : url;
    const response = await this.fetch(apiUrl, {method: `GET`, ...options});
    return await parseResponse(response);
  }

  public async post<DataType>(url: string, data: BodyData, options?: FetchOptions): Promise<DataType> {
    const response = await this.fetch(url, {method: `POST`, body: normalizeBody(data), ...options});
    return await parseResponse(response);
  }

  public async put<DataType>(url: string, data: BodyData, options?: FetchOptions): Promise<DataType> {
    const response = await this.fetch(url, {method: `PUT`, body: normalizeBody(data), ...options});
    return await parseResponse(response);
  }

  public async patch<DataType>(url: string, data: BodyData, options?: FetchOptions): Promise<DataType> {
    const response = await this.fetch(url, {method: `PATCH`, body: normalizeBody(data), ...options});
    return await parseResponse(response);
  }

  public async delete<DataType>(url: string, options?: FetchOptions): Promise<DataType> {
    const response = await this.fetch(url, {method: `DELETE`, ...options});
    return await parseResponse(response);
  }

  public async fetch(url: string, options: FetchOptions): Promise<Response> {
    const requestInit: RequestInit = {
      method: options.method,
      headers: options.headers,
      body: options.body,
      ...options.fetchParams,
    };
    return fetch(url, requestInit);
  }
}

export let apiClient: ApiClient;
if (typeof window !== `undefined`) {
  // @ts-ignore window singleton
  apiClient = window.__apiClient = window.__apiClient || new ApiClient();
} else {
  // re-initialize for unit tests in node
  apiClient = new ApiClient();
}
