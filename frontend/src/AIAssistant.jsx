import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, X, MessageSquare, Sparkles, HelpCircle, AlertTriangle, Send, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import './AIAssistant.css';

const AIAssistant = ({ currentDisease }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const location = useLocation();
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: "Hello! I'm your GenoPredict Assistant. How can I help you today?" }
  ]);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice Transcript:", transcript);
        handleVoiceInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Cancel speech output when the chat window is closed
  useEffect(() => {
    if (!isOpen && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  // Clean up speech output on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start recognition:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = (text) => {
    if (isVoiceEnabled && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Derived context
  const getContext = () => {
    if (location.pathname.startsWith('/more-details/')) {
      const name = decodeURIComponent(location.pathname.split('/').pop());
      return { disease: name, isFromURL: true };
    }
    return currentDisease;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const fetchAiResponse = async (userText) => {
    setLoading(true);
    console.log("Fetching AI Response for:", userText);
    
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          context: getContext()?.disease || 'General medical query'
        }),
        mode: "cors",
      });

      console.log("Chat API HTTP status:", response.status, response.statusText);
      const data = await response.json().catch((err) => {
        console.error("Failed to parse chat JSON response", err);
        return null;
      });
      console.log("Chat API response:", data);

      if (!response.ok) {
        const errorMessage = data?.error || `${response.status} ${response.statusText}`;
        console.error("Chat API returned error:", errorMessage);
        return `AI response not available. (${errorMessage})`;
      }

      const aiReply = data?.response || data?.answer || "AI response not available. Please try again.";
      speak(aiReply);
      return aiReply;
    } catch (error) {
      console.error("Chat request failed:", error);
      return "AI response not available. Please try again.";
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async (transcript) => {
    if (!transcript.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), type: 'user', text: transcript };
    setMessages(prev => [...prev, userMsg]);

    const aiResponse = await fetchAiResponse(transcript);

    setMessages(prev => [
      ...prev, 
      { id: Date.now() + 1, type: 'ai', text: aiResponse }
    ]);
  };

  const handleQuestion = async (questionType) => {
    const activeContext = getContext();
    const userText = questionType === 'what' 
      ? (activeContext?.disease ? `What is ${activeContext.disease}?` : "What is this disease?")
      : (activeContext?.disease ? `Is ${activeContext.disease} serious?` : "Is it serious?");
    
    // Add user message immediately
    const userMsg = { id: Date.now(), type: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);

    const aiResponse = await fetchAiResponse(userText);

    setMessages(prev => [
      ...prev, 
      { id: Date.now() + 1, type: 'ai', text: aiResponse }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue;
    setInputValue('');
    
    // Add user message immediately
    const userMsg = { id: Date.now(), type: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);

    const aiResponse = await fetchAiResponse(userText);

    setMessages(prev => [
      ...prev, 
      { id: Date.now() + 1, type: 'ai', text: aiResponse }
    ]);
  };

  return (
    <div className="ai-assistant-container">
      {isOpen && (
        <div className="ai-chat-window">
          <div className="chat-header">
            <Bot size={20} />
            <h3>GenoPredict AI</h3>
            <div style={{ flex: 1 }}></div>
            <button 
              type="button"
              onClick={() => {
                const newValue = !isVoiceEnabled;
                setIsVoiceEnabled(newValue);
                if (!newValue && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px',
                marginRight: '8px',
                display: 'flex',
                alignItems: 'center',
                opacity: isVoiceEnabled ? 1 : 0.5,
                transition: 'opacity 0.2s'
              }}
              title={isVoiceEnabled ? "Mute Voice Output" : "Unmute Voice Output"}
            >
              {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <Sparkles size={16} style={{ opacity: 0.8 }} />
          </div>
          
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="message ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="spinner" /> AI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-actions">
            <button className="action-btn" onClick={() => handleQuestion('what')} disabled={loading}>
              <HelpCircle size={16} /> What is this disease?
            </button>
            <button className="action-btn" onClick={() => handleQuestion('serious')} disabled={loading}>
              <AlertTriangle size={16} /> Is it serious?
            </button>
          </div>

          <form className="chat-input-container" onSubmit={handleSubmit}>
            <button 
              type="button" 
              className={`mic-btn ${isListening ? 'listening' : ''}`} 
              onClick={isListening ? stopListening : startListening}
              title={isListening ? "Stop Listening" : "Start Voice Input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input 
              type="text" 
              className="chat-input" 
              placeholder={isListening ? "Listening..." : "Ask a question..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="send-btn" disabled={!inputValue.trim() || loading}>
              {loading ? <Loader2 size={18} className="spinner" /> : <Send size={18} />}
            </button>
          </form>

        </div>
      )}

      <button 
        className={`ai-bubble-toggle ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        {isOpen ? <X size={28} /> : <Bot size={32} />}
      </button>
    </div>
  );
};

export default AIAssistant;

