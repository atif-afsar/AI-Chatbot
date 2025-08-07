import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { io } from "socket.io-client";

function App() {
  const [socket, setSocket] = useState(null);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState([
    { role: "bot", message: "Hi! How can I help you today?" },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput === "") return;

    const newUserMsg = { role: "user", message: trimmedInput };

    setConversation((prev) => [...prev, newUserMsg]);
    setInput("");
    setIsTyping(true);
    socket.emit("ai-message", trimmedInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  useEffect(() => {
    const socketInstance = io("http://localhost:3000");
    setSocket(socketInstance);

    socketInstance.on("ai-message-response", (response) => {
      setIsTyping(false);
      let currentText = "";
      const message = response;
      let index = 0;

      const typingInterval = setInterval(() => {
        if (index < message.length) {
          currentText += message.charAt(index);
          const botMessage = { role: "bot", message: currentText };
          setConversation((prev) => [
            ...prev.slice(0, -1),
            botMessage,
          ]);
          index++;
        } else {
          clearInterval(typingInterval);
        }
      }, 20);

      // Initial placeholder to trigger typing
      setConversation((prev) => [...prev, { role: "bot", message: "" }]);
    });

    return () => socketInstance.disconnect();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isTyping]);

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <header className="chat-header">💬 ChatBot Assistant</header>

        <main className="chat-history">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`chat-bubble ${msg.role === "user" ? "outgoing" : "incoming"}`}
            >
              {msg.message}
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble incoming loader">
              <span></span><span></span><span></span>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </main>

        <footer className="chat-input-area">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button onClick={handleSend}>Send</button>
        </footer>
      </div>
    </div>
  );
}

export default App;
