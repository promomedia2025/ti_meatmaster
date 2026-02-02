"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  User,
  Edit3,
  Save,
  X,
  Mail,
  Phone,
  Calendar,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  telephone: string;
  date_of_birth: string;
}

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    id: user?.id || 0,
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    telephone: user?.telephone || user?.phone || "",
    date_of_birth: user?.date_of_birth || "",
  });

  const handleEdit = (field: string) => {
    setEditingField(field);
    setIsEditing(true);
  };

  const handleSave = (field: string) => {
    // TODO: Implement save functionality
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

  const handleSaveAllChanges = async () => {
    if (!user?.id) {
      toast.error("Σφάλμα", {
        description: "Δεν βρέθηκε αναγνωριστικό χρήστη",
      });
      return;
    }

    // Validate that all required fields are present
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.telephone
    ) {
      toast.error("Σφάλμα", {
        description: "Όλα τα πεδία είναι υποχρεωτικά",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/auth/user", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          telephone: formData.telephone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || result.message || "Αποτυχία αποθήκευσης"
        );
      }

      // Refresh user data to get updated information
      await refreshUser();

      toast.success("Επιτυχία", {
        description: "Οι αλλαγές αποθηκεύτηκαν επιτυχώς",
      });

      setIsEditing(false);
      setEditingField(null);
    } catch (error) {
      toast.error("Σφάλμα", {
        description:
          error instanceof Error
            ? error.message
            : "Σφάλμα κατά την αποθήκευση των αλλαγών",
      });
    } finally {
      setIsSaving(false);
    }
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
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-start mt-8">
          <button
            onClick={handleSaveAllChanges}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Skeleton className="w-4 h-4 rounded" />
                Αποθήκευση...
              </>
            ) : (
              "Αποθήκευση των αλλαγών"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
