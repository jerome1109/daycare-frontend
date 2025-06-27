"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { MessageCircle, Check, CheckCheck } from "lucide-react";

interface Message {
  id: number;
  message: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  isRead: boolean;
  sender: {
    firstName: string;
    lastName: string;
  };
  receiver: {
    firstName: string;
    lastName: string;
  };
}

interface ChatProps {
  receiverId: number;
  receiverName: string;
  onBack?: () => void;
}

export default function Chat({ receiverId, receiverName, onBack }: ChatProps) {
  const { makeAuthenticatedRequest, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `/chat/history/${receiverId}`
      );
      if (response && Array.isArray(response)) {
        setMessages(response as Message[]);
        scrollToBottom();

        const unreadMessages = response.filter(
          (msg: Message) => !msg.isRead && msg.senderId === receiverId
        );
        if (unreadMessages.length > 0) {
          await makeAuthenticatedRequest(`/chat/read/${receiverId}`, {
            method: "PUT",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    setIsFetching(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [receiverId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest("/chat/send", {
        method: "POST",
        body: JSON.stringify({
          receiverId,
          message: newMessage.trim(),
        }),
      });

      if (response && typeof response === "object" && "error" in response) {
        throw new Error(response.error as string);
      }

      setMessages((prev) => [...prev, response as Message]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageStatus = (message: Message, isLastMessage: boolean) => {
    if (message.senderId !== user?.id) return null;

    return (
      <span className="ml-2 text-xs">
        {message.isRead ? (
          <div className="flex items-center">
            <CheckCheck className="h-3 w-3 text-white" />
            {isLastMessage && <span className="ml-1 text-white/90">Seen</span>}
          </div>
        ) : (
          <Check className="h-3 w-3 text-white/70" />
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-semibold">Chat with {receiverName}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isFetching ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="h-12 w-12 mb-2" />
            <p>No messages yet</p>
            <p className="text-sm">
              Start the conversation by sending a message
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            return (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === user?.id
                    ? "justify-end"
                    : "justify-start"
                } animate-messageIn`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 transform transition-all duration-200 hover:scale-[1.02] ${
                    message.senderId === user?.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  <p className="text-sm break-words">{message.message}</p>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span
                      className={
                        message.senderId === user?.id
                          ? "text-white/70"
                          : "text-gray-500"
                      }
                    >
                      {format(new Date(message.createdAt), "MMM d, h:mm a")}
                    </span>
                    {getMessageStatus(message, isLastMessage)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-4 border-t transform transition-transform duration-200"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 whitespace-nowrap transform hover:scale-105 active:scale-95"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
