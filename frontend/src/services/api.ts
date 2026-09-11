const API_BASE_URL = '/api';

export interface User {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
}

export interface Documento {
  id: number;
  slot: string;
  archivo_url: string;
  nombre_original: string;
  tamano_bytes: number;
  creado_en: string;
}

export interface ExpedienteStatus {
  id?: number;
  postulante_id?: number;
  estado: 'EN_PROCESO' | 'FINALIZADO';
  pdf_consolidado_url?: string;
  hash_cvd?: string;
  short_hash_cvd?: string;
  total_paginas?: number;
  declaracion_aceptada?: number;
  declaracion_ip?: string;
  declaracion_fecha?: string;
  finalizado_en?: string;
}

export const getToken = (): string | null => {
  return localStorage.getItem('sire_cv_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('sire_cv_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('sire_cv_token');
};

const getHeaders = (isMultipart = false): HeadersInit => {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const api = {
  async registro(data: { dni: string; nombres: string; apellidos: string; email: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Error al completar el registro.');
    }
    return json;
  },

  async login(dni: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ dni, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Credenciales inválidas.');
    }
    return json;
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Sesión no válida.');
    }
    return json.user as User;
  },

  async getDocumentos(): Promise<Documento[]> {
    const res = await fetch(`${API_BASE_URL}/documentos`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Error al obtener los documentos.');
    }
    return json.documentos || [];
  },

  async uploadDocumento(slot: string, file: File): Promise<{ message: string; documento: Documento }> {
    const formData = new FormData();
    formData.append('archivo', file);

    const res = await fetch(`${API_BASE_URL}/documentos/${slot}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Error al subir el documento.');
    }
    return json;
  },

  async getExpedienteStatus(): Promise<ExpedienteStatus> {
    const res = await fetch(`${API_BASE_URL}/expediente`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Error al obtener el estado del expediente.');
    }
    return json.expediente;
  },

  async finalizarExpediente(declaracionAceptada: boolean): Promise<{ message: string; expediente: ExpedienteStatus }> {
    const res = await fetch(`${API_BASE_URL}/expediente/finalizar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ declaracionAceptada }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Error al finalizar el expediente.');
    }
    return json;
  },
};
