import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL?.replace('/licenses', '') || 'http://localhost:5001/api');

const api = axios.create({
  baseURL: BASE_URL,
}); 

export const loginUser = async (email, password) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('userInfo', JSON.stringify(res.data.data));
    }
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al iniciar sesión';
  }
};

export const logoutUser = () => {
  localStorage.removeItem('userInfo');
  window.location.reload();
};

export const getLicenses = async () => {
    // Agregar token a las peticiones protegidas (opcional si decides proteger getLicenses)
    // const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    // const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
    
    const res = await api.get('/licenses/all'); 
    return res.data;
};

export const registerUser = async (name, email, password) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
  
  try {
    const res = await api.post('/auth/register', { name, email, password }, config);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al registrar usuario';
  }
};

export const createLicense = async (data) => {
  const res = await api.post('/licenses/create', data);
  return res.data;
};

export const renewLicense = async (data) => {
  const res = await api.post('/licenses/renew', data);
  return res.data;
};

export const updateLicense = async (data) => {
  const res = await api.post('/licenses/update', data);
  return res.data;
};

export const deactivateLicense = async (data) => {
  const res = await api.post('/licenses/deactivate', data);
  return res.data;
};

export const deleteLicense = async (data) => {
  const res = await api.delete('/licenses/delete', { data }); // Axios delete sends body in 'data' config
  return res.data;
};
