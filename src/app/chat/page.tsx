"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Chat from "@/components/Chat";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Search, MessageCircle, Circle } from "lucide-react";
import TopNavBar from "@/components/TopNavBar";
import Image from "next/image";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  unreadCount?: number;
  lastMessageAt?: string;
  isOnline?: boolean;
  lastSeen?: string;
  userImages?: {
    imageUrl: string;
  }[];
  userImage?: string;
}

const ROLE_FILTERS = [
  { value: "", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "user", label: "Parent" },
];

export default function ChatPage() {
  const { makeAuthenticatedRequest, user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSearchUser, setSelectedSearchUser] = useState<User | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    if (!user) return;

    try {
      const response = await makeAuthenticatedRequest("/chat/users");
      if (response && typeof response === "object" && "users" in response) {
        const newUsers = response.users as User[];

        // Only update if there are actual changes
        setUsers((currentUsers) => {
          const hasChanges = newUsers.some((newUser) => {
            const currentUser = currentUsers.find((u) => u.id === newUser.id);
            return (
              !currentUser ||
              currentUser.unreadCount !== newUser.unreadCount ||
              currentUser.lastMessageAt !== newUser.lastMessageAt
            );
          });

          return hasChanges ? newUsers : currentUsers;
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }, [user, makeAuthenticatedRequest]);

  // Separate initial load from polling
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setIsLoading(true);
    fetchUsers();
  }, [authLoading, user, router, fetchUsers]);

  // Polling with a longer interval
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUsers();
    }, 5000); // Increased to 5 seconds

    return () => clearInterval(interval);
  }, [fetchUsers, user]);

  // Memoize filtered users to prevent unnecessary re-renders
  const getFilteredUsers = useCallback(() => {
    return users
      .filter((u) => {
        const hasInteraction =
          u.lastMessageAt !== null || (u.unreadCount || 0) > 0;
        const isSelectedSearch = selectedSearchUser?.id === u.id;
        const matchesSearch =
          searchTerm !== "" &&
          (`${u.firstName} ${u.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = roleFilter === "" || u.role === roleFilter;

        return (
          (hasInteraction || isSelectedSearch || matchesSearch) && matchesRole
        );
      })
      .sort((a, b) => {
        if (searchTerm && a.id === selectedSearchUser?.id) return -1;
        if (searchTerm && b.id === selectedSearchUser?.id) return 1;

        if ((a.unreadCount || 0) > 0 && !(b.unreadCount || 0)) return -1;
        if (!(a.unreadCount || 0) && (b.unreadCount || 0)) return 1;

        if (a.lastMessageAt && b.lastMessageAt) {
          return (
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
          );
        }

        if (a.lastMessageAt && !b.lastMessageAt) return -1;
        if (!a.lastMessageAt && b.lastMessageAt) return 1;

        const roleOrder = {
          super_admin: 0,
          admin: 1,
          staff: 2,
          user: 3,
        };
        return (
          (roleOrder[a.role as keyof typeof roleOrder] || 4) -
          (roleOrder[b.role as keyof typeof roleOrder] || 4)
        );
      });
  }, [users, searchTerm, roleFilter, selectedSearchUser]);

  // Update filtered users only when necessary
  useEffect(() => {
    setFilteredUsers(getFilteredUsers());
  }, [getFilteredUsers]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "text-red-600";
      case "admin":
        return "text-purple-600";
      case "staff":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "staff":
        return "Staff";
      case "user":
        return "Parent";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const handleSidebarToggle = () => {
    router.push("/");
  };

  const getMessageStatusIcon = (user: User) => {
    if (!user.unreadCount) return null;

    return (
      <div className="flex items-center">
        <div className="flex items-center bg-blue-500 text-white rounded-full px-2 py-0.5">
          <MessageCircle className="h-3 w-3 mr-1" />
          <span className="text-xs">{user.unreadCount}</span>
        </div>
      </div>
    );
  };

  const getStatusIndicator = (user: User) => {
    return (
      <div className="flex items-center gap-1">
        <Circle
          fill={user.isOnline ? "#22c55e" : "#94a3b8"}
          className={`h-2.5 w-2.5 ${
            user.isOnline ? "text-green-500" : "text-slate-400"
          }`}
        />
        {user.isOnline && (
          <span className="text-xs text-green-600">Online</span>
        )}
      </div>
    );
  };

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    if (searchTerm) {
      setSelectedSearchUser(selectedUser);
      setSearchTerm("");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pt-16">
      <TopNavBar onSidebarToggle={handleSidebarToggle} />
      <div className="container mx-auto py-4 px-4 md:py-8 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 relative h-[calc(100vh-6rem)]">
          {/* Contact List */}
          <div
            className={`col-span-1 bg-white rounded-lg shadow p-4 
              fixed md:relative inset-0 md:inset-auto z-30 top-16 md:top-auto
              transition-transform duration-300 ease-in-out
              ${
                selectedUser
                  ? "translate-x-[-100%] md:translate-x-0"
                  : "translate-x-0"
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Contacts</h2>
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  Back
                </button>
              )}
            </div>

            <div className="space-y-3 mb-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLE_FILTERS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No contacts found
              </p>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleUserSelect(u)}
                    className={`w-full text-left p-3 rounded transition-colors ${
                      selectedUser?.id === u.id
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-sky-100 flex-shrink-0">
                          {u.userImages?.[0] ? (
                            <Image
                              src={u.userImages[0].imageUrl}
                              alt={`${u.firstName}'s photo`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-sky-500">
                              {u.firstName[0]}
                              {u.lastName[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate">
                              {`${u.firstName} ${u.lastName}`}
                            </div>
                            {getStatusIndicator(u)}
                          </div>
                          <div className="text-sm flex items-center space-x-2 mt-0.5">
                            <span
                              className={`${getRoleColor(u.role)} truncate`}
                            >
                              {getRoleLabel(u.role)}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-400 text-xs truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        {getMessageStatusIcon(u)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div
            className={`col-span-1 md:col-span-3 
              fixed md:relative inset-0 md:inset-auto z-20 top-16 md:top-auto
              transition-transform duration-300 ease-in-out
              ${
                selectedUser
                  ? "translate-x-0"
                  : "translate-x-[100%] md:translate-x-0"
              }`}
          >
            {selectedUser ? (
              <div className="h-full md:h-[600px]">
                <Chat
                  receiverId={selectedUser.id}
                  receiverName={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  onBack={() => setSelectedUser(null)}
                />
              </div>
            ) : (
              <div className="h-full md:h-[600px] bg-white rounded-lg shadow flex items-center justify-center text-gray-500">
                Select a contact to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
