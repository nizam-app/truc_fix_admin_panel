import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CreditCard,
  Globe,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession, storeAdminSession } from "../auth";
import { adminFetch } from "../apiClient";

type AdminSettingsResponse = {
  status: string;
  message: string;
  data: {
    profile: {
      _id: string;
      email: string;
      fullName: string;
      phoneNumber: string | null;
      role: string;
      profilePhotoUrl: string | null;
    };
    preferences: {
      timeZone: string;
      language: string;
      notificationsEnabled: boolean;
      securityAlertsEnabled: boolean;
      regionalFormat: string;
      billingEmail: string;
      privacyMode: string;
    };
  };
};

type SettingsForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  profilePhotoUrl: string;
  timeZone: string;
  language: string;
  notificationsEnabled: boolean;
  securityAlertsEnabled: boolean;
  regionalFormat: string;
  billingEmail: string;
  privacyMode: string;
};

const emptyForm: SettingsForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  role: "",
  profilePhotoUrl: "",
  timeZone: "GMT",
  language: "English",
  notificationsEnabled: true,
  securityAlertsEnabled: true,
  regionalFormat: "en-GB",
  billingEmail: "",
  privacyMode: "STANDARD",
};

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

export function Settings() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState<SettingsForm>(emptyForm);
  const [initialData, setInitialData] = useState<SettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const tabs = useMemo(
    () => [
      { id: "profile", label: "Profile", icon: User },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "regional", label: "Regional", icon: Globe },
      { id: "billing", label: "Billing", icon: CreditCard },
      { id: "privacy", label: "Privacy", icon: Shield },
    ],
    []
  );

  const loadSettings = async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Your admin session has expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/admin/settings`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as AdminSettingsResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load admin settings.");
      }

      const nextForm: SettingsForm = {
        fullName: payload.data.profile.fullName || "",
        email: payload.data.profile.email || "",
        phoneNumber: payload.data.profile.phoneNumber || "",
        role: payload.data.profile.role || "",
        profilePhotoUrl: payload.data.profile.profilePhotoUrl || "",
        timeZone: payload.data.preferences.timeZone || "GMT",
        language: payload.data.preferences.language || "English",
        notificationsEnabled: payload.data.preferences.notificationsEnabled ?? true,
        securityAlertsEnabled: payload.data.preferences.securityAlertsEnabled ?? true,
        regionalFormat: payload.data.preferences.regionalFormat || "en-GB",
        billingEmail: payload.data.preferences.billingEmail || payload.data.profile.email || "",
        privacyMode: payload.data.preferences.privacyMode || "STANDARD",
      };

      setFormData(nextForm);
      setInitialData(nextForm);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load admin settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSaveChanges = async () => {
    if (!accessToken) return;

    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/admin/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          profile: {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            profilePhotoUrl: formData.profilePhotoUrl,
          },
          preferences: {
            timeZone: formData.timeZone,
            language: formData.language,
            notificationsEnabled: formData.notificationsEnabled,
            securityAlertsEnabled: formData.securityAlertsEnabled,
            regionalFormat: formData.regionalFormat,
            billingEmail: formData.billingEmail,
            privacyMode: formData.privacyMode,
          },
        }),
      });

      const payload = (await response.json()) as AdminSettingsResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to save admin settings.");
      }

      applySavedProfile(payload);
      setFeedback("Admin settings saved successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save admin settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    setFeedback(null);
    setError(null);
  };

  const applySavedProfile = (payload: AdminSettingsResponse) => {
    const nextForm: SettingsForm = {
      fullName: payload.data.profile.fullName || "",
      email: payload.data.profile.email || "",
      phoneNumber: payload.data.profile.phoneNumber || "",
      role: payload.data.profile.role || "",
      profilePhotoUrl: payload.data.profile.profilePhotoUrl || "",
      timeZone: payload.data.preferences.timeZone || "GMT",
      language: payload.data.preferences.language || "English",
      notificationsEnabled: payload.data.preferences.notificationsEnabled ?? true,
      securityAlertsEnabled: payload.data.preferences.securityAlertsEnabled ?? true,
      regionalFormat: payload.data.preferences.regionalFormat || "en-GB",
      billingEmail: payload.data.preferences.billingEmail || payload.data.profile.email || "",
      privacyMode: payload.data.preferences.privacyMode || "STANDARD",
    };

    setFormData(nextForm);
    setInitialData(nextForm);

    if (session) {
      storeAdminSession({
        ...session,
        user: {
          ...session.user,
          email: payload.data.profile.email,
          adminProfile: {
            ...(session.user.adminProfile || {}),
            fullName: payload.data.profile.fullName,
            phoneNumber: payload.data.profile.phoneNumber || undefined,
            profilePhotoUrl: payload.data.profile.profilePhotoUrl || undefined,
          },
        },
      });
    }
  };

  const handlePhotoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !accessToken) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WebP, or GIF).");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    setFeedback(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const uploadResponse = await adminFetch("/admin/settings/profile-photo", {
        method: "POST",
        body,
      });

      const savePayload = (await uploadResponse.json()) as AdminSettingsResponse & {
        message?: string;
      };

      if (!uploadResponse.ok) {
        throw new Error(savePayload.message || "Unable to upload profile photo.");
      }

      applySavedProfile(savePayload);
      setFeedback("Profile photo updated.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload profile photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const initials =
    formData.fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage your admin profile, communication settings, and platform preferences
        </p>
      </div>

      {(error || feedback) && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || feedback}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white shadow">
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              {activeTab === "profile"
                ? "Profile Settings"
                : activeTab === "notifications"
                  ? "Notification Settings"
                  : activeTab === "regional"
                    ? "Regional Settings"
                    : activeTab === "billing"
                      ? "Billing Settings"
                      : "Privacy Settings"}
            </h2>

            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Loading admin settings...
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === "profile" ? (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Profile Picture
                      </label>
                      <div className="flex items-center gap-4">
                        {formData.profilePhotoUrl ? (
                          <img
                            src={formData.profilePhotoUrl}
                            alt={formData.fullName}
                            className="h-20 w-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-2xl font-semibold text-white">
                            {initials}
                          </div>
                        )}
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
                          className="hidden"
                          onChange={(event) => void handlePhotoFileChange(event)}
                        />
                        <button
                          type="button"
                          disabled={uploadingPhoto || loading}
                          onClick={() => photoInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Change Photo"
                          )}
                        </button>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, WebP, or GIF — max 5 MB
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            fullName: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            phoneNumber: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        disabled
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500"
                      />
                    </div>
                  </>
                ) : null}

                {activeTab === "notifications" ? (
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Platform Notifications</p>
                        <p className="text-sm text-gray-500">
                          Receive admin alerts for service requests, reviews, and updates
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.notificationsEnabled}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            notificationsEnabled: event.target.checked,
                          }))
                        }
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Security Alerts</p>
                        <p className="text-sm text-gray-500">
                          Receive security-sensitive alerts for admin activity
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.securityAlertsEnabled}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            securityAlertsEnabled: event.target.checked,
                          }))
                        }
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                  </div>
                ) : null}

                {activeTab === "regional" ? (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Time Zone
                      </label>
                      <select
                        value={formData.timeZone}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            timeZone: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="GMT">GMT</option>
                        <option value="BST">BST</option>
                        <option value="CET">CET</option>
                        <option value="EET">EET</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            language: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Regional Format
                      </label>
                      <select
                        value={formData.regionalFormat}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            regionalFormat: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en-GB">en-GB</option>
                        <option value="en-US">en-US</option>
                        <option value="fr-FR">fr-FR</option>
                        <option value="de-DE">de-DE</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {activeTab === "billing" ? (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Billing Email
                      </label>
                      <input
                        type="email"
                        value={formData.billingEmail}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            billingEmail: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                      Billing methods and payout instruments are managed from the Financial
                      module. This settings page stores the admin billing contact and
                      communication preference.
                    </div>
                  </div>
                ) : null}

                {activeTab === "privacy" ? (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Privacy Mode
                      </label>
                      <select
                        value={formData.privacyMode}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            privacyMode: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="STANDARD">STANDARD</option>
                        <option value="STRICT">STRICT</option>
                      </select>
                    </div>

                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                      Privacy mode controls how aggressively the admin interface limits
                      sensitive data display and billing-contact exposure across the panel.
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => void handleSaveChanges()}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
