import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import api from '../api/axios';
import { logoutUser } from '../api/auth';
import Button from '../components/Button';
import Input from '../components/Input';
import './Dashboard.css';

// --- Types ---
interface User {
  id: number;
  name: string;
  email?: string;
}

interface ChatSession {
  id: number;
  title: string;
  visibility: boolean | number;
  user_id: number;
  created_at: string;
  user?: User;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');
  
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0'); 
  const currentUserName = localStorage.getItem('user_name') || localStorage.getItem('name') || 'You';

  // --- STATE ---
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  
  // Ref to track active chat inside the async polling loop
  const activeChatRef = useRef<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  // --- EFFECTS ---
  useEffect(() => {
    fetchChats();
  }, []);

  // Sync Ref with State
  useEffect(() => {
    activeChatRef.current = activeChat?.id || null;
  }, [activeChat]);

  // --- API CALLS ---
  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/getAllChats');
      const chatList = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setChats(chatList);
    } catch (error) {
      console.error("Failed to load chats", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const response = await api.get(`/chats/${chatId}`);
      
      const history = response.data.messages.map((msg: any) => {
        let normalizedSender: 'user' | 'bot' = 'bot'; 
        if (msg.sender === 'human' || msg.sender === 'user') {
          normalizedSender = 'user';
        }
        return {
          sender: normalizedSender, 
          text: msg.message || msg.content || msg.text 
        };
      });
      
      setMessages(history);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateChat = async () => {
    try {
      const response = await api.post('/createChat');
      const newChat: ChatSession = {
        ...response.data,
        user: { id: currentUserId, name: currentUserName }
      };
      setChats([newChat, ...chats]);
      setActiveChat(newChat);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create chat", error);
    }
  };

  const handleDeleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    try {
      await api.delete(`/chats/${chatId}`);
      setChats(chats.filter(c => c.id !== chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
    } catch (error) {
      alert("Could not delete chat.");
    }
  };

  const handleToggleVisibility = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.patch(`/chats/${chatId}/visibility`);
      const newVisibility = response.data.visibility;
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, visibility: newVisibility } : chat
      ));
      if (activeChat?.id === chatId) {
        setActiveChat(prev => prev ? { ...prev, visibility: newVisibility } : null);
      }
    } catch (error) {
      console.error("Failed to toggle visibility", error);
    }
  };

  // --- NEW: POLLING LOGIC ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;

    const currentMsg = inputMessage;
    const currentChatId = activeChat.id;

    setInputMessage('');
    setSending(true);
    
    // Optimistically add user message
    setMessages(prev => [...prev, { sender: 'user', text: currentMsg }]);

    try {
      // 1. Initial Request (Fire and Forget)
      const response = await api.post(`/chats/${currentChatId}/messages`, {
        message: currentMsg
      });

      // 2. Start Polling
      const botMessageId = response.data.bot_message_id;
      if (!botMessageId) throw new Error("No message ID returned");

      pollForResponse(botMessageId, currentChatId);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'bot', text: "Error: Could not send message." }]);
      setSending(false);
    }
  };

  const pollForResponse = async (messageId: number, chatId: number) => {
    const POLL_INTERVAL = 3000; // 3 Seconds
    const MAX_ATTEMPTS = 100;   // 5 Minutes max (100 * 3s)
    let attempts = 0;

    const checkStatus = async () => {
        // Stop if user switched chats or timed out
        if (activeChatRef.current !== chatId) return;
        if (attempts >= MAX_ATTEMPTS) {
            setMessages(prev => [...prev, { sender: 'bot', text: "Error: Request Timed Out." }]);
            setSending(false);
            return;
        }

        attempts++;

        try {
            const res = await api.get(`/messages/${messageId}/status`);
            const status = res.data.status;

            if (status === 'completed') {
                // Success! Update UI
                setMessages(prev => [...prev, { sender: 'bot', text: res.data.text }]);
                setSending(false);
            } else if (status === 'failed') {
                // Failure
                setMessages(prev => [...prev, { sender: 'bot', text: "Error: AI generation failed." }]);
                setSending(false);
            } else {
                // Still processing... check again in 3s
                setTimeout(checkStatus, POLL_INTERVAL);
            }
        } catch (error) {
            // Network glitch? Try again nicely
            setTimeout(checkStatus, POLL_INTERVAL);
        }
    };

    // Kick off the loop
    setTimeout(checkStatus, POLL_INTERVAL);
  };

  const onSelectChat = (chat: ChatSession) => {
    setActiveChat(chat);
    fetchMessages(chat.id);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Button onClick={handleCreateChat} text="+ New Session" color="#2c3e50" />
        </div>

        <div className="chat-list">
          {loading ? <p className="loading-text">Loading archives...</p> : chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => onSelectChat(chat)} 
              className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
            >
              <div className="chat-info">
                <div className="chat-title">{chat.title || "Unnamed Session"}</div>
                <small className="chat-author">
                  by {chat.user?.name || (chat.user_id === currentUserId ? currentUserName : 'Unknown')}
                </small>
              </div>

              <div className="chat-actions">
                <button onClick={(e) => handleToggleVisibility(chat.id, e)}>
                  {chat.visibility ? "Public" : "Private"}
                </button>
                <button onClick={(e) => handleDeleteChat(chat.id, e)} className="delete-btn">
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
            {userRole === 'admin' && (
                <div style={{ marginBottom: '10px' }}>
                    <Button text="Admin Panel" onClick={() => navigate('/admin')} color="#673ab7" />
                </div>
            )}
            <Button text="Logout" onClick={handleLogout} color="#e74c3c" />
        </div>
      </aside>

      <main className="main-chat-area">
        {!activeChat ? (
          <div className="empty-state">
            <h1>Ready to Connect</h1>
            <p>Select a session to begin.</p>
          </div>
        ) : (
          <>
            <header className="chat-header">
              <div className="header-info">
                <h2>{activeChat.title || "Chat Session"}</h2>
                <span className="author-tag">
                    Host: {activeChat.user?.name || (activeChat.user_id === currentUserId ? currentUserName : "Unknown")}
                </span>
              </div>
              <span className="visibility-badge">
                {activeChat.visibility ? "Public" : "Private"}
              </span>
            </header>

            <section className="messages-feed">
              {loadingMessages ? (
                <p className="loading-text">Retrieving transcript...</p>
              ) : messages.length === 0 ? (
                <p className="loading-text">No data in this session.</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`message-row ${msg.sender}`}>
                    <div className="message-stack">
                      <span className="sender-label">
                        {msg.sender === 'user' ? 'YOU' : 'SYSTEM'}
                      </span>
                      
                      <div className="message-content markdown-body">
                         <ReactMarkdown 
                            children={msg.text}
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({node, inline, className, children, ...props}: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                    <SyntaxHighlighter
                                        {...props}
                                        children={String(children).replace(/\n$/, '')}
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                    />
                                    ) : (
                                    <code className="inline-code" {...props}>
                                        {children}
                                    </code>
                                    )
                                }
                            }}
                         />
                      </div>

                    </div>
                  </div>
                ))
              )}
              {sending && <p className="typing-indicator">System is thinking...</p>}
            </section>

            <footer className="chat-input">
              <form onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                  <Input 
                    label=""
                    placeholder="Enter command..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                </div>
                <div className="button-wrapper">
                  <button 
                    type="submit" 
                    className="send-icon-button"
                    disabled={sending || !activeChat}
                  >
                    {sending ? <span className="spinner">...</span> : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    )}
                  </button>
                </div>
              </form>
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;