import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth'; 
import Button from '../components/Button';
import Input from '../components/Input';
import './login.css';

const Login = () => {
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    try {
      const userData = await loginUser(name, password);
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error(err);
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <Input 
          label="Username" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Enter your username"
        />
        
        <Input 
          label="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter your password"
        />
        
        <Button 
          text={loading ? "Logging in..." : "Login"} 
          type="submit"
          color={loading ? "#ccc" : "blue"} 
        />
      </form>
    </div>
  );
};

export default Login;