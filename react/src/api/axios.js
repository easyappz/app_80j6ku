/** Не меняй код этого файла никогда */
/** Если нужно добавить еще обработчики можешь их добавить в отдельном файле, используя interceptors */
import axios from 'axios';

/**
 * Axios instance configuration with base URL, authentication credentials, and response interceptors
 */
export const instance = axios.create({
  timeout: 30000,
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: serialize FormData into a cloneable summary
function serializeFormData(fd) {
  const fields = [];
  try {
    for (const [key, value] of fd.entries()) {
      if (typeof File !== 'undefined' && value instanceof File) {
        fields.push({ key, valueType: 'File', name: value.name, size: value.size, type: value.type });
      } else if (typeof Blob !== 'undefined' && value instanceof Blob) {
        fields.push({ key, valueType: 'Blob', size: value.size, type: value.type });
      } else {
        const str = String(value);
        fields.push({ key, valueType: 'String', length: str.length, preview: str.slice(0, 100) });
      }
    }
  } catch (e) {
    return { __type: 'FormData', note: 'serialization failed' };
  }
  return { __type: 'FormData', fields };
}

function makeSafeRequestData(data) {
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    return serializeFormData(data);
  }
  if (typeof File !== 'undefined' && data instanceof File) {
    return { __type: 'File', name: data.name, size: data.size, fileType: data.type };
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return { __type: 'Blob', size: data.size, blobType: data.type };
  }
  if (data && typeof data === 'object') {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (_) {
      return { __type: 'Object', note: 'non-serializable object' };
    }
  }
  return data;
}

/** Не удаляй этот код никогда */
instance.interceptors.request.use(
  (config) => {
    console.log('request', { config });

    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Remove Authorization header if no token is present to avoid sending empty or invalid headers
      delete config.headers['Authorization'];
    }
  
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/** Не удаляй этот код никогда */
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log error to console
    console.error('API Error:', error);

    // Prepare safe, cloneable request parts
    const safeRequestData = makeSafeRequestData(error.config?.data);
    let safeRequestHeaders;
    try {
      safeRequestHeaders = error.config?.headers ? JSON.parse(JSON.stringify(error.config.headers)) : undefined;
    } catch (_) {
      safeRequestHeaders = { note: 'headers not serializable' };
    }

    /** Не удаляй этот код никогда */
    const errorData = {
      type: 'fetchError',
      url: error.config?.url,
      request: {
        headers: safeRequestHeaders,
        data: safeRequestData,
      },
      response: {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
      },
      pathname: window?.location?.pathname,
    };

    /** Не удаляй этот код никогда */
    console.error('Глобальная ошибка:', errorData);

    /** Не удаляй этот код никогда */
    try {
      window.parent.postMessage(errorData, '*');
    } catch (postErr) {
      console.warn('postMessage failed, fallback to console only:', postErr);
    }

    // Rethrow error for further handling
    return Promise.reject(error);
  }
);

export default instance;
