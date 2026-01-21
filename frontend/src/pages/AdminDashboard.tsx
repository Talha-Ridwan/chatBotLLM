import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/Button';
import Input from '../components/Input';
import { logoutUser } from '../api/auth';
import './AdminDashboard.css';

interface User {
  id: number;
  name: string;
  email: string | null;
  role?: string; 
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

const fetchUsers = async () => {
    try {
      const response = await api.post('/admin/see');
      const userList = response.data.Users?.data || [];
      setUsers(userList);
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        console.warn("Unauthorized access attempt detected.");
        navigate('/dashboard'); 
      } else {
        console.error("Failed to fetch users", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser(); 
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const navigateToChat = () => {
    navigate('/Dashboard');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      name: newUser.name,
      password: newUser.password,
      email: newUser.email.trim() === '' ? null : newUser.email
    };

    try {
      await api.post('/admin/create', payload);
      setMessage({ text: 'User created successfully!', type: 'success' });
      setNewUser({ name: '', email: '', password: '' }); 
      fetchUsers(); 
    } catch (error: any) {
      setMessage({ text: 'Failed to create user.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.post('/admin/delete', { id_for_deletion: id });
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="admin-container">
      <div className="navbar">
        <h2>Admin Panel</h2>
        <div className="navbar-buttons">
          <Button text="Chat View" color="blue" onClick={navigateToChat} />
          <Button text="Logout" color="red" onClick={handleLogout} />
        </div>
      </div>

      <div className="admin-content">
        <div className="create-user-section">
          <h3>Create New User</h3>
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleCreateUser}>
            <Input 
              label="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              placeholder="Username"
            />
            <Input 
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              placeholder="Email"
            />
            <Input 
              label="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              placeholder="Password"
            />
            <Button 
              text={loading ? "Creating..." : "Create User"}
              color="green"
              type="submit"
            />
          </form>
        </div>

        <div className="user-list-section">
          <h3>Registered Users</h3>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email ? user.email : "No Email"}</td>
                    <td>
                      <Button 
                        text="Delete"
                        color="red"
                        onClick={() => handleDeleteUser(user.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;