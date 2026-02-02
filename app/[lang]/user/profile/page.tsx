"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  User,
  Edit3,
  Check,
  X,
  Mail,
  Phone,
  Loader2,
  ArrowLeft,
  Save,
} from "lucide-react";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  telephone: string;
  date_of_birth: string;
}

export default function UserProfilePage() {
  const { user, refreshUser, isAuthenticated, isLoading } = useAuth() as any; 
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialized = useRef(false);

  const [formData, setFormData] = useState<UserProfile>({
    id: 0,
    email: "",
    first_name: "",
    last_name: "",
    telephone: "",
    date_of_birth: "",
  });

<<<<<<< HEAD
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
=======
  // --- Redirect Logic ---
>>>>>>> d247a5fbfbf81f219b33b9d15b7e0ba36a940c8b
  useEffect(() => {
    if (isLoading) return;
    if (!isLoading && isAuthenticated === false) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // --- Sync Data from Auth Context ---
  useEffect(() => {
    if (user && (!isInitialized.current || user.id !== formData.id)) {
      setFormData({
        id: user.id || 0,
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        telephone: user.telephone || user.phone || "",
        date_of_birth: user.date_of_birth || "",
      });
      isInitialized.current = true;
      setHasUnsavedChanges(false);
    }
  }, [user]);

  const getInitials = () => {
    const first = formData.first_name?.charAt(0) || "";
    const last = formData.last_name?.charAt(0) || "";
    if (!first && !last) return user?.email?.charAt(0).toUpperCase() || "U";
    return (first + last).toUpperCase();
  };

  const handleEdit = (field: string) => {
    setEditingField(field);
    setIsEditing(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleConfirmLocal = () => {
    setEditingField(null);
    setIsEditing(false);
  };

  const handleCancelLocal = (field: keyof UserProfile) => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        [field]: (user as any)[field] || (user as any)[field === 'telephone' ? 'phone' : field] || ""
      }));
    }
    setEditingField(null);
    setIsEditing(false);
    // Recalculate if still has changes (simplified check)
    setHasUnsavedChanges(false); 
  };

  const handleSaveChanges = async () => {
    if (!user?.id) return;

    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error("Σφάλμα", { description: "Τα πεδία Όνομα, Επώνυμο και Email είναι υποχρεωτικά" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        telephone: formData.telephone, 
        phone: formData.telephone,
      };

      const response = await fetch("/api/auth/user", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || (result && !result.success)) {
        throw new Error(result?.error || "Αποτυχία αποθήκευσης");
      }

      toast.success("Επιτυχία", { description: "Το προφίλ ενημερώθηκε" });
      await refreshUser(); 
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Σφάλμα", { description: "Σφάλμα κατά την αποθήκευση" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditableField = (
    label: string,
    field: keyof UserProfile,
    type: string = "text",
    icon?: React.ReactNode
  ) => {
    const isCurrentlyEditing = editingField === field;
    const value = formData[field];

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* ICON: Brand Orange #ff9328 */}
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-[#ff9328]">
               {icon}
            </div>
            <label className="text-zinc-400 text-sm font-medium">{label}</label>
          </div>
          {!isCurrentlyEditing && (
            <button
              onClick={() => handleEdit(field)}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              disabled={isSaving || (isEditing && !isCurrentlyEditing)}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isCurrentlyEditing ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              type={type}
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="flex-1 bg-black text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-[#ff9328] focus:outline-none transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmLocal();
                if (e.key === 'Escape') handleCancelLocal(field);
              }}
            />
            <button onClick={handleConfirmLocal} className="text-white hover:bg-zinc-800 p-2 rounded-lg transition-colors">
              <Check className="w-4 h-4 text-green-500" />
            </button>
            <button onClick={() => handleCancelLocal(field)} className="text-zinc-500 hover:text-[#ff9328] hover:bg-zinc-800 p-2 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-white text-lg font-medium pl-11">
            {value || <span className="text-zinc-600 italic">Δεν έχει οριστεί</span>}
          </div>
        )}
      </div>
    );
  };

  if (isLoading || (!user && isAuthenticated !== false)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff9328] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center border-4 border-black shadow-xl shrink-0">
              <span className="text-3xl font-bold text-white tracking-wider">
                {getInitials()}
              </span>
            </div>
            <div className="overflow-hidden">
              <h1 className="text-3xl font-bold text-white truncate mb-1">
                {formData.first_name} {formData.last_name}
              </h1>
              <p className="text-zinc-400 truncate">{formData.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link 
            href="/user" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-medium hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Πίσω στο προφίλ</span>
          </Link>

          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <span className="text-sm text-[#ff9328] animate-pulse hidden sm:inline-block">
                • Μη αποθηκευμένες αλλαγές
              </span>
            )}
            <button
              onClick={handleSaveChanges}
              disabled={isSaving || !hasUnsavedChanges}
              className={`
                px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 text-sm
                ${hasUnsavedChanges 
                  ? "bg-[#ff9328] text-white hover:bg-[#915316] shadow-[0_0_20px_rgba(255,147,40,0.2)] cursor-pointer" 
                  : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"}
              `}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Αποθήκευση
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderEditableField("Όνομα", "first_name", "text", <User className="w-4 h-4" />)}
          {renderEditableField("Επώνυμο", "last_name", "text", <User className="w-4 h-4" />)}
          {renderEditableField("Email", "email", "email", <Mail className="w-4 h-4" />)}
          {renderEditableField("Τηλέφωνο", "telephone", "tel", <Phone className="w-4 h-4" />)}
        </div>
      </div>
    </div>
  );
}