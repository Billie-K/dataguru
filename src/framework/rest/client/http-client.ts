import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';
import type { SearchParamOptions } from '@/types';
import axios from 'axios';
import Cookies from 'js-cookie';
import Router from "next/router";
import { useToken } from '@/lib/hooks/use-token';

const Axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_REST_API_ENDPOINT,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Change request data/error here
Axios.interceptors.request.use(
  (config) => {
    const token = Cookies.get(AUTH_TOKEN_KEY);
    const meUrl = config.url?.endsWith('user/me/');

    // checks if requests wants to access the loggen in user's endpoint
    // then prefixes the token with auth header type defined in Django settings
    // else it returns the token as is
    if (meUrl) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token ? token : ''}`,
      };
      return config;
    } else {
      config.headers = {
        ...config.headers,
        Authorization: `${token ? token : ''}`,
      };
      return config;
    }
  }
);

// Change response data/error here
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (
      (error.response && error.response.status === 401) ||
      (error.response && error.response.status === 403) ||
      (error.response &&
        error.response.data.message === 'DATAGURU.NOT_AUTHORIZED')
    ) {
      // const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
      // return Axios.post('/token/refresh/', {
      //   'refresh': refreshToken
      // })
      // .then(res => {
      //   if (res.status === 201 || res.status === 200) {
      //     const { setToken } = useToken();
      //     setToken(res.data);
      //     axios.defaults.headers.common['Authorization'] = Cookies.get(AUTH_TOKEN_KEY);
      //     return axios(originalRequest);
      //   }
      // })
      Cookies.remove(AUTH_TOKEN_KEY);
      Router.reload();
    }
    return Promise.reject(error);
  }
);

export class HttpClient {
  static async get<T>(url: string, params?: unknown) {
    const response = await Axios.get<T>(url, { params });
    return response.data;
  }

  static async post<T>(url: string, data: unknown, options?: any) {
    const response = await Axios.post<T>(url, data, options);
    return response.data;
  }

  static async put<T>(url: string, data: unknown) {
    const response = await Axios.put<T>(url, data);
    return response.data;
  }

  static async delete<T>(url: string) {
    const response = await Axios.delete<T>(url);
    return response.data;
  }

  // search parameters for api filter 
  static formatSearchParams(params: Partial<SearchParamOptions>) {
    return Object.entries(params)
      .filter(([, value]) => Boolean(value))
      .map(([k, v]) =>
        ['type', 'categories', 'tags', 'author', 'manufacturer'].includes(k)
          ? `${v}`
          : `${v}`
      )
      .join('&');
  }
}
