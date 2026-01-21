import api from './axios';

interface LoginResponse {
  token: string;
  role: string;
}

export const loginUser = async (name: string, password: string) => {
  const response = await api.post<LoginResponse>('/login', { name, password });

  localStorage.setItem('token', response.data.token);
  localStorage.setItem('role', response.data.role); 
  
  return response.data;
};


export const logoutUser = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error("Logout failed on server", error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('role'); 
  }
};