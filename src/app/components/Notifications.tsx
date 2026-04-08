import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle, Info, DollarSign, Wrench, Package, Users, Trash2, Check } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "urgent",
    icon: AlertTriangle,
    title: "Critical Stock Alert",
    message: "Tire 18\" inventory is critically low (3 units remaining)",
    time: "5 minutes ago",
    read: false,
    category: "Inventory"
  },
  {
    id: 2,
    type: "financial",
    icon: DollarSign,
    title: "Payment Overdue",
    message: "Invoice INV-2025-005 from City Movers is now 4 days overdue (£1,500)",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "service",
    icon: Wrench,
    title: "New Service Request",
    message: "Urgent brake repair requested by Swift Logistics for Truck #TRK-1001",
    time: "2 hours ago",
    read: false,
    category: "Services"
  },
  {
    id: 4,
    type: "success",
    icon: CheckCircle,
    title: "Service Completed",
    message: "Engine repair for Fast Freight Co has been marked as completed by Mike Johnson",
    time: "3 hours ago",
    read: true,
    category: "Services"
  },
  {
    id: 5,
    type: "info",
    icon: Info,
    title: "Low Stock Warning",
    message: "Engine Oil (5L) is below minimum stock level (8/15 units)",
    time: "5 hours ago",
    read: true,
    category: "Inventory"
  },
  {
    id: 6,
    type: "user",
    icon: Users,
    title: "New User Registration",
    message: "New fleet manager registered: James Wilson from Metro Logistics",
    time: "1 day ago",
    read: true,
    category: "Users"
  },
  {
    id: 12,
    type: "financial",
    icon: DollarSign,
    title: "Payment Received",
    message: "Payment of £850 received from Swift Logistics for Invoice INV-2025-001",
    time: "1 day ago",
    read: true,
  },
  {
    id: 8,
    type: "service",
    icon: Wrench,
    title: "Service Scheduled",
    message: "Transmission service scheduled for Global Transport on March 16, 2025",
    time: "2 days ago",
    read: true,
    category: "Services"
  },
];

export function Notifications() {
  const [filter, setFilter] = useState("All");
  const [notificationsList, setNotificationsList] = useState(notifications);

  const filteredNotifications = notificationsList.filter((notification) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !notification.read;
    return notification.category === filter;
  });

  const unreadCount = notificationsList.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotificationsList(notificationsList.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotificationsList(notificationsList.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotificationsList(notificationsList.filter(n => n.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-100 text-red-600";
      case "financial":
        return "bg-green-100 text-green-600";
      case "service":
        return "bg-blue-100 text-blue-600";
      case "success":
        return "bg-green-100 text-green-600";
      case "info":
        return "bg-yellow-100 text-yellow-600";
      case "user":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with important alerts and messages</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Check size={20} />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Notifications</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{notificationsList.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Unread</p>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{unreadCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Urgent Alerts</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {notificationsList.filter(n => n.type === "urgent").length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Today</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {notificationsList.filter(n => n.time.includes("hour") || n.time.includes("minute")).length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200">
          {["All", "Unread", "Services", "Financial", "Inventory", "Users"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}
              {tab === "Unread" && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No notifications to display</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(notification.type)}`}>
                    <notification.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {notification.category}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}