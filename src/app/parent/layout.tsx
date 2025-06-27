"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Bell, Settings, Users, MessageCircle } from "lucide-react";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import TopNavBar from "@/components/TopNavBar";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, makeAuthenticatedRequest, subscription } = useAuth();

  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !subscription?.enableChatSystem) return;
    try {
      const response = await makeAuthenticatedRequest("/chat/unread-count");
      if (response && typeof response === "object" && "count" in response) {
        setUnreadCount(Number(response.count));
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user, makeAuthenticatedRequest, subscription?.enableChatSystem]);

  useEffect(() => {
    if (!user || !socket || !subscription?.enableChatSystem) return;

    const onNewMessage = (data: {
      receiverId: number;
      message: Record<string, unknown>;
    }) => {
      console.log("New message received:", data);
      if (data.receiverId === user.id) {
        setUnreadCount((prev) => prev + 1);
        toast.info("New message received");
      }
    };

    const onMessagesRead = (data: { senderId: number; receiverId: number }) => {
      console.log("Messages read:", data);
      if (data.receiverId === user.id) {
        setUnreadCount(0);
      }
    };

    const onUnreadCountUpdate = (data: { userId: number; count: number }) => {
      console.log("Unread count update:", data);
      if (data.userId === user.id) {
        setUnreadCount(data.count);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    if (!socket.connected) {
      console.log("Connecting socket...");
      socket.connect();
    }

    // Add event listeners
    if (socket) {
      socket.on("new_message", onNewMessage);
      socket.on("messages_read", onMessagesRead);
      socket.on("unread_count_update", onUnreadCountUpdate);

      // Join user's room
      socket.emit("join_room", user.id);
    }

    return () => {
      if (socket) {
        // Leave room and remove listeners
        socket.emit("leave_room", user.id);
        socket.off("new_message", onNewMessage);
        socket.off("messages_read", onMessagesRead);
        socket.off("unread_count_update", onUnreadCountUpdate);
      }
    };
  }, [user, fetchUnreadCount, subscription?.enableChatSystem]);

  // Add socket connection status
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    if (!socket || !subscription?.enableChatSystem) return;

    const onConnect = () => {
      console.log("Socket connected");
      setIsSocketConnected(true);
      fetchUnreadCount();
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsSocketConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
    };
  }, [fetchUnreadCount, subscription?.enableChatSystem]);

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     router.push("/login");
  //   } catch (error) {
  //     console.error("Logout error:", error);
  //   }
  // };

  const navItems = [
    {
      label: "Dashboard",
      href: "/parent/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Children",
      href: "/parent/children",
      icon: <Users className="h-5 w-5" />,
    },
    // Add Messages conditionally based on subscription
    ...(subscription?.enableChatSystem
      ? [
          {
            label: "Messages",
            href: "/chat",
            icon: <MessageCircle className="h-5 w-5" />,
            badge: unreadCount > 0 ? unreadCount : undefined,
            className: !isSocketConnected ? "opacity-75" : "",
          },
        ]
      : []),
    {
      label: "Notices",
      href: "/parent/notices",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/parent/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Top Bar */}
      {/* <div className="fixed top-0 z-40 w-full bg-white shadow-sm border-b border-sky-100">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 text-sky-600 hover:bg-sky-50"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-sky-800">
              Parent Portal
            </h1>
          </div>
          <div className="flex items-center">
            <span className="mr-4 text-sky-700">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center rounded-lg p-2 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div> */}
      <TopNavBar onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Sidebar */}
      <div
        className={`fixed left-0 z-30 h-full w-64 transform bg-white pt-16 shadow-md border-r border-sky-100 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {isClient &&
              navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center rounded-lg px-4 py-2 transition-colors ${
                        isActive
                          ? "bg-sky-100 text-sky-800 font-medium"
                          : "text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                      }`}
                    >
                      <div
                        className={isActive ? "text-sky-800" : "text-sky-600"}
                      >
                        {item.icon}
                      </div>
                      <span className="ml-3">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`pt-16 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        } min-h-screen transition-margin duration-300`}
      >
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
