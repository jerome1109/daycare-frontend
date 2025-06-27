"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Settings,
  Bell,
  MessageCircle,
  UserCircle2,
  Baby,
  UserCog,
  Utensils,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { socket, initSocket } from "@/lib/socket";
import { toast } from "sonner";
import TopNavBar from "@/components/TopNavBar";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  className?: string;
}

const NavLink = ({
  item,
  isActive,
  isSidebarCollapsed,
}: {
  item: NavItem;
  isActive: boolean;
  isSidebarCollapsed: boolean;
}) => (
  <Link
    href={item.href}
    className={`flex items-center ${
      isSidebarCollapsed ? "justify-center" : "space-x-3"
    } px-4 py-2.5 rounded-lg transition-colors relative ${
      isActive
        ? "text-sky-600 bg-sky-50 hover:bg-sky-100"
        : "text-sky-700 hover:bg-sky-50"
    } ${item.className || ""}`}
    title={isSidebarCollapsed ? item.label : undefined}
  >
    {item.icon}
    {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
    {item.badge && item.badge > 0 && (
      <span
        className={`absolute ${
          isSidebarCollapsed ? "top-0 right-0" : "right-2"
        } bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1`}
      >
        {item.badge > 99 ? "99+" : item.badge}
      </span>
    )}
  </Link>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, makeAuthenticatedRequest, subscription } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);

      // Auto-collapse sidebar on small screens
      if (width < 768) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(true);
      } else if (width < 1024) {
        setIsSidebarCollapsed(true);
        setIsSidebarOpen(true);
      } else {
        setIsSidebarCollapsed(false);
        setIsSidebarOpen(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    if (user) {
      console.log("User available, initializing socket");
      initSocket();
    }
  }, [user]);

  useEffect(() => {
    const initializeSocket = async () => {
      if (!user || !socket) {
        console.log("Cannot initialize socket:", {
          hasUser: !!user,
          hasSocket: !!socket,
        });
        return;
      }

      try {
        console.log("Initializing socket connection...");
        await fetchUnreadCount();

        if (!socket.connected) {
          console.log("Socket not connected, attempting connection...");
          socket.connect();
        }

        console.log("Joining room for user:", user.id);
        socket.emit("join_room", user.id);
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    initializeSocket();

    return () => {
      if (socket && user) {
        console.log("Cleaning up socket connection...");
        socket.emit("leave_room", user.id);
        socket.disconnect();
      }
    };
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (!user || !socket || !subscription?.enableChatSystem) return;

    const onConnect = () => {
      console.log("Socket connected");
      setIsSocketConnected(true);
      fetchUnreadCount();
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsSocketConnected(false);
    };

    const onNewMessage = (data: {
      receiverId: number;
      message: Record<string, unknown>;
    }) => {
      console.log("New message received:", data);
      if (data.receiverId === user.id) {
        fetchUnreadCount();
        toast.info("New message received");

        // Send push notification if supported
        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification("New Message", {
            body: "You have received a new message",
            icon: "/logo.png", // Add your app logo path here
          });

          notification.onclick = () => {
            window.focus();
            router.push("/chat");
          };
        }
        // Request permission if not already granted
        else if (
          "Notification" in window &&
          Notification.permission !== "denied"
        ) {
          Notification.requestPermission();
        }
      }
    };

    const onMessagesRead = (data: { senderId: number; receiverId: number }) => {
      console.log("Messages read:", data);
      if (data.receiverId === user.id) {
        fetchUnreadCount();
      }
    };

    const onUnreadCountUpdate = (data: { userId: number; count: number }) => {
      console.log("Unread count update:", data);
      if (data.userId === user.id) {
        setUnreadCount(data.count);
      }
    };

    const addListeners = () => {
      if (!socket) return;

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("new_message", onNewMessage);
      socket.on("messages_read", onMessagesRead);
      socket.on("unread_count_update", onUnreadCountUpdate);
    };

    const removeListeners = () => {
      if (!socket) return;

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", onNewMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("unread_count_update", onUnreadCountUpdate);
    };

    addListeners();

    return () => {
      removeListeners();
    };
  }, [user, fetchUnreadCount, router, subscription?.enableChatSystem]);

  // const handleLogout = () => {
  //   if (socket) {
  //     cleanupSocket();
  //   }
  //   logout();
  //   router.push("/login");
  // };

  const handleSidebarToggle = () => {
    if (windowWidth < 768) {
      // On mobile, toggle open/closed
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      // On desktop, toggle between collapsed and expanded
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
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
      label: "Staff",
      href: "/admin/staff",
      icon: <UserCog className="h-5 w-5" />,
    },
    {
      label: "Parents",
      href: "/admin/parents",
      icon: <UserCircle2 className="h-5 w-5" />,
    },
    {
      label: "Children",
      href: "/admin/children",
      icon: <Baby className="h-5 w-5" />,
    },
    {
      label: "Meals",
      href: "/admin/meals",
      icon: <Utensils className="h-5 w-5" />,
    },
    {
      label: "Schedule",
      href: "/admin/schedule",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: "Activities",
      href: "/admin/activities",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      label: "Notices",
      href: "/admin/notices",
      icon: <Bell className="h-5 w-5" />,
    },
  ];

  const sidebarWidth = isSidebarCollapsed ? "w-16" : "w-64";

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
              {user?.daycare?.name || "Daycare"} Admin
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

      <TopNavBar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 z-30 h-full ${sidebarWidth} transform bg-white pt-16 shadow-md border-r border-sky-100 transition-all duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="mt-8 px-2">
          <ul className="space-y-2">
            {isClient &&
              navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <NavLink
                      item={item}
                      isActive={isActive}
                      isSidebarCollapsed={isSidebarCollapsed}
                    />
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && windowWidth < 768 && (
        <div
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`pt-16 transition-all duration-300 ${
          isSidebarOpen
            ? isSidebarCollapsed
              ? "pl-16 md:pl-16"
              : "pl-0 md:pl-64"
            : "pl-0"
        }`}
      >
        <main className="min-h-screen bg-sky-50 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
