// src/Api.js - the backend address and one helper for calling it
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const api = async (path, options) => {
  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};