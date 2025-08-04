import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, MessageCircle, ChevronDown } from 'lucide-react';
import './App.css';
import TRIcon from './assets/TR icon.png';


function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const taxPrompts = [
    "What are the potential tax implications to consider when selling a home?",
    "Give a summary of adjustments to the NON-GAAP adjusted earnings for each companies.",
    "How to fix the error message “you are not authorized to perform this task” in FCCS page?",
    "What is the company code and default profit centre for GL-CoCode 11000000_1064?",
  ];

  const dropdownOptions = [
    "Controllership",
    "General Accounting",
    "Accounts Payable",
    "Statutory Controlership",
    "Project Managers/Workday",
    "AP",
    "AR",
    "Master Data Team",
    "GSR",
    "GA",
    "TP/IC",
    "LA",
    "BOT",
    "Project Accounting",
    "Group Consolidation",
    "Payroll",
    "Fixed Assets",
    "Lease Accounting",
    "Workday Learning",
    "External Reporting"
  ];

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Backend connection error:', error);
      setConnectionStatus('error');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          history: messages // Send conversation history
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      const botMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${error.message}. Please try again or check if the backend is running.` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/refresh-credentials', {
        method: 'POST',
      });
      
      if (response.ok) {
        console.log('Credentials refreshed successfully');
      } else {
        console.error('Failed to refresh credentials');
      }
    } catch (error) {
      console.error('Error refreshing credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Connection Status Indicator */}
      {connectionStatus === 'error' && (
        <div className="connection-status error">
          ❌ Backend connection failed. Make sure the backend server is running on port 8000.
        </div>
      )}
      {connectionStatus === 'checking' && (
        <div className="connection-status checking">
          🔄 Checking backend connection...
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="brand-container">
            <div className="brand-icon">
              <img src={TRIcon} alt="Thomson Reuters" className="brand-image" />
            </div>
            <span className="brand-name">Thomson Reuters</span>
            <span className="brand-cocounsel">Acc Buddy</span>
          </div>
          
          <button className="start-conversation-btn">
            <MessageCircle size={18} style={{ marginRight: '8px' }} />
            <span>Start a conversation</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          <nav>
            <div className="nav-item">
              <MessageCircle size={18} style={{ marginRight: '8px' }} />
              <span>AP Chatbot</span>
            </div>
            <div className="nav-item">
              <MessageCircle size={18} style={{ marginRight: '8px' }} />
              <span>Commissions Chatbot</span>
            </div>
            <div className="nav-item">
              <MessageCircle size={18} style={{ marginRight: '8px' }} />
              <span>HR Buddy</span>
            </div>
            <div className="nav-item">
              <MessageCircle size={18} style={{ marginRight: '8px' }} />
              <span>Treasury Chatbot</span>
            </div>
            {/* Accounting Chatbot with Dropdown */}
            <div
              className="nav-item dropdown-parent"
              ref={dropdownRef}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
              onClick={() => setDropdownOpen((open) => !open)}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              <MessageCircle size={18} style={{ marginRight: '8px' }} />
              <span>Accounting Chatbot</span>
              <ChevronDown size={16} style={{ marginLeft: '6px' }} />
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <input
                    type="text"
                    className="dropdown-search"
                    placeholder="Search..."
                    value={dropdownSearch}
                    onChange={e => setDropdownSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="dropdown-options">
                    {dropdownOptions
                      .filter(option =>
                        option.toLowerCase().includes(dropdownSearch.toLowerCase())
                      )
                      .map((option, idx) => (
                        <div className="dropdown-option" key={idx}>
                          {option}
                        </div>
                      ))}
                    {dropdownOptions.filter(option =>
                      option.toLowerCase().includes(dropdownSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="dropdown-no-results">No results found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-content">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="header-icon-container">
            <div className="header-icon">
              <img src={TRIcon} alt="Thomson Reuters" className="header-image" />
            </div>
          </div>
          <h1 className="chat-title">Start a conversation</h1>
          <p className="chat-subtitle">Get started with an accounting task or topic.</p>
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              {/* Removed the Quick Action Buttons as requested */}

              {/* Tax Prompts */}
              <div className="prompts-section">
                <div className="prompts-header">
                  <h3>Accounting prompts</h3>
                  <button onClick={handleRefresh} className="refresh-btn" disabled={isLoading}>
                    <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>
                <div className="prompts-list">
                  {taxPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="prompt-item"
                    >
                      <Send size={16} className="prompt-plane-icon" />
                      <span className="prompt-text">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message bot-message">
                  <div className="message-content loading">
                    <div className="loading-dots">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <div className="textarea-container">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Accounting Buddy about an accounting task or topic..."
                className="message-input"
                rows="1"
                disabled={connectionStatus === 'error'}
              />
              {/* Move the send button inside textarea-container */}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading || connectionStatus === 'error'}
                className="send-button"
                style={{ position: 'absolute', right: '10px', bottom: '10px' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
