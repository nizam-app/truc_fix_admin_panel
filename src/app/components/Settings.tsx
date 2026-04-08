import { Bell, Lock, User, Globe, CreditCard, Shield } from "lucide-react";
import { useState } from "react";

export function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    fullName: "Admin User",
    email: "admin@truckfix.com",
    phone: "+44 20 7123 4567",
    role: "Super Admin",
    timezone: "GMT",
    language: "English"
  });

  const handleSaveChanges = () => {
    console.log("Saving changes:", formData);
    alert("Settings saved successfully!");
  };

  const handleCancel = () => {
    console.log("Cancelled changes");
    setFormData({
      fullName: "Admin User",
      email: "admin@truckfix.com",
      phone: "+44 20 7123 4567",
      role: "Super Admin",
      timezone: "GMT",
      language: "English"
    });
  };

  const handleChangePhoto = () => {
    console.log("Change photo clicked");
    alert("Photo upload feature would be implemented here");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your admin panel preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <nav className="p-2">
              <button 
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${
                  activeTab === "profile" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <User size={20} />
                <span>Profile</span>
              </button>
              <button 
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${
                  activeTab === "notifications" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Bell size={20} />
                <span>Notifications</span>
              </button>
              <button 
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${
                  activeTab === "security" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Lock size={20} />
                <span>Security</span>
              </button>
              <button 
                onClick={() => setActiveTab("regional")}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${
                  activeTab === "regional" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Globe size={20} />
                <span>Regional</span>
              </button>
              <button 
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${
                  activeTab === "billing" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <CreditCard size={20} />
                <span>Billing</span>
              </button>
              <button 
                onClick={() => setActiveTab("privacy")}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${
                  activeTab === "privacy" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Shield size={20} />
                <span>Privacy</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
                    AD
                  </div>
                  <button 
                    onClick={handleChangePhoto}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Change Photo
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Manager</option>
                </select>
              </div>

              {/* Time Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Zone
                </label>
                <select 
                  value={formData.timezone}
                  onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>GMT</option>
                  <option>BST (British Summer Time)</option>
                  <option>CET (Central European Time)</option>
                  <option>EET (Eastern European Time)</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select 
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleSaveChanges}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button 
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Additional Settings Sections */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Email Notifications</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Service Request Updates</p>
                  <p className="text-sm text-gray-500">Get notified when service requests are updated</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5 text-blue-600 rounded" />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">New User Registrations</p>
                  <p className="text-sm text-gray-500">Receive alerts for new user sign-ups</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5 text-blue-600 rounded" />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Maintenance Reminders</p>
                  <p className="text-sm text-gray-500">Get reminders for scheduled truck maintenance</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5 text-blue-600 rounded" />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Weekly Reports</p>
                  <p className="text-sm text-gray-500">Receive weekly analytics and performance reports</p>
                </div>
                <input type="checkbox" className="h-5 w-5 text-blue-600 rounded" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}