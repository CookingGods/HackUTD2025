import React, { useState, useEffect, useRef } from 'react';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getInitialSummary = async () => {
      const initialQuery = "What are the main issues users are reporting?";
      const userMessage = { role: "user", content: initialQuery };

      try {
        const response = await fetch('http://localhost:5001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [userMessage] }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const botMessage = { role: "assistant", content: data.response };
        setMessages([userMessage, botMessage]);
      } catch (error) {
        console.error("Failed to fetch initial summary:", error);
        setMessages([
          { role: "assistant", content: `Error: Could not connect to the chatbot. ${error.message}` },
        ]);
      }
    };

    getInitialSummary();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const newUserMessage = { role: "user", content: currentInput };
    const messageHistory = [...messages, newUserMessage];
    setMessages(messageHistory);
    setCurrentInput("");

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messageHistory }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const botMessage = { role: "assistant", content: data.response };
      setMessages([...messageHistory, botMessage]);
    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      setMessages([
        ...messageHistory,
        { role: "assistant", content: `Error: Could not get a response. ${error.message}` },
      ]);
    }
  };

  const Message = ({ role, content }) => (
    <div
      className={`my-2 p-3 rounded-lg max-w-lg ${
        role === "user"
          ? "bg-blue-600 text-white self-end"
          : " self-start"
      }`}
    >
      {content}
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 font-sans overflow-hidden min-w-[800px]">
      <div
        className="flex-grow flex flex-col overflow-y-auto p-4 bg-white rounded-lg shadow-inner border border-gray-200"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#CBD5E0 #F7FAFC",
          minHeight: 0, 
        }}
      >
        {messages.slice(1).map((msg, index) => (
          <Message key={index} role={msg.role} content={msg.content} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex mt-4">
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          style={{backgroundColor: "#e20074"}}
          className=" text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          Send
        </button>
      </form>

      <style>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: #CBD5E0;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background-color: #F7FAFC;
        }
      `}</style>
    </div>
  );
}

export default Chatbot;
