"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  User,
  Edit3,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  telephone: string;
  date_of_birth: string;
  address: string;
  city: string;
  postcode: string;
  created_at: string;
  updated_at: string;
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserProfile>({
    id: user?.id || 0,
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    telephone: user?.telephone || user?.phone || "",
    date_of_birth: user?.date_of_birth || "",
    address: user?.address || "",
    city: user?.city || "",
    postcode: user?.postcode || "",
    created_at: user?.created_at || "",
    updated_at: user?.updated_at || "",
  });

  const handleEdit = (field: string) => {
    setEditingField(field);
    setIsEditing(true);
  };

  const handleSave = (field: string) => {
    // TODO: Implement save functionality
    console.log(`Saving ${field}:`, formData[field as keyof UserProfile]);
    setEditingField(null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingField(null);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || 0,
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        telephone: user.telephone || user.phone || "",
        date_of_birth: user.date_of_birth || "",
        address: user.address || "",
        city: user.city || "",
        postcode: user.postcode || "",
        created_at: user.created_at || "",
        updated_at: user.updated_at || "",
      });
    }
  }, [user]);

  const renderEditableField = (
    label: string,
    field: keyof UserProfile,
    type: string = "text",
    icon?: React.ReactNode
  ) => {
    const isCurrentlyEditing = editingField === field;
    const value = formData[field];

    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <label className="text-gray-300 text-sm font-medium">{label}</label>
          </div>
          {!isCurrentlyEditing && (
            <button
              onClick={() => handleEdit(field)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              disabled={isEditing}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isCurrentlyEditing ? (
          <div className="flex items-center gap-2">
            <input
              type={type}
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => handleSave(field)}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-white">
            {value || (
              <span className="text-gray-500 italic">Not provided</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Please log in</h1>
          <p className="text-gray-400">
            You need to be logged in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {formData.first_name} {formData.last_name}
              </h1>
              <p className="text-gray-400">{formData.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEditableField(
              "First Name",
              "first_name",
              "text",
              <User className="w-4 h-4 text-gray-400" />
            )}
            {renderEditableField(
              "Last Name",
              "last_name",
              "text",
              <User className="w-4 h-4 text-gray-400" />
            )}
            {renderEditableField(
              "Email",
              "email",
              "email",
              <Mail className="w-4 h-4 text-gray-400" />
            )}
            {renderEditableField(
              "Phone",
              "telephone",
              "tel",
              <Phone className="w-4 h-4 text-gray-400" />
            )}
            {renderEditableField(
              "Date of Birth",
              "date_of_birth",
              "date",
              <Calendar className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Address Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEditableField(
              "Address",
              "address",
              "text",
              <MapPin className="w-4 h-4 text-gray-400" />
            )}
            {renderEditableField(
              "City",
              "city",
              "text",
              <MapPin className="w-4 h-4 text-gray-400" />
            )}
            {renderEditableField(
              "Postcode",
              "postcode",
              "text",
              <MapPin className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <label className="text-gray-300 text-sm font-medium">
                  Member Since
                </label>
              </div>
              <div className="text-white">
                {formData.created_at
                  ? new Date(formData.created_at).toLocaleDateString()
                  : "Not available"}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <label className="text-gray-300 text-sm font-medium">
                  Last Updated
                </label>
              </div>
              <div className="text-white">
                {formData.updated_at
                  ? new Date(formData.updated_at).toLocaleDateString()
                  : "Not available"}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isEditing ? "Cancel Editing" : "Edit Profile"}
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            disabled={!isEditing}
          >
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}
