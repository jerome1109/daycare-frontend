import { io, Socket } from "socket.io-client";

interface ServerToClientEvents {
  new_message: (data: {
    receiverId: number;
    message: Record<string, unknown>;
  }) => void;
  messages_read: (data: { senderId: number; receiverId: number }) => void;
  unread_count_update: (data: { userId: number; count: number }) => void;
}

interface ClientToServerEvents {
  join_room: (userId: number) => void;
  leave_room: (userId: number) => void;
  read_messages: (data: { senderId: number; receiverId: number }) => void;
  // Add other client-to-server events as needed
}

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null =
  null;

const getSocket = (
  forceNew = false
): Socket<ServerToClientEvents, ClientToServerEvents> | null => {
  if (typeof window === "undefined") return null;

  const SOCKET_URL =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_SOCKET_URL
      : process.env.NEXT_PUBLIC_SOCKET_URL_DEV;

  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("No auth token found for socket connection");
    return null;
  }

  if (forceNew || !socketInstance) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }

    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["websocket", "polling"], // Try websocket first
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected successfully", {
        id: socketInstance?.id,
        connected: socketInstance?.connected,
      });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", {
        message: error.message,
      });
    });
  }

  return socketInstance;
};

export const initSocket = () => {
  return getSocket(true);
};

export const socket = getSocket();

export const cleanupSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
