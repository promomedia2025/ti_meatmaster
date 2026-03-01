"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface MenuSpecial {
  type: "F" | "P";
  special_price: number;
  validity: "forever" | "period" | "recurring";
  special_status: boolean;
  start_date?: string;
  end_date?: string;
  recurring_every?: string[];
  recurring_from?: string;
  recurring_to?: string;
}

interface MenuSpecialFormProps {
  menuId: number;
}

const DAYS_OF_WEEK = ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"];

// Helper function to convert datetime-local to ISO string with timezone offset
const convertLocalDateTimeToISO = (localDateTime: string): string => {
  if (!localDateTime) return "";
  // datetime-local format: "YYYY-MM-DDTHH:mm"
  // Create a date object treating it as local time
  const date = new Date(localDateTime);
  
  // Get timezone offset in minutes
  const timezoneOffset = date.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const offsetMinutes = Math.abs(timezoneOffset) % 60;
  const offsetSign = timezoneOffset <= 0 ? "+" : "-";
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
  
  // Format date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  // Return ISO 8601 format with timezone offset: "YYYY-MM-DDTHH:mm:ss+HH:mm"
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
};

// Helper function to convert ISO string to datetime-local format (in user's timezone)
const convertISOToLocalDateTime = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Get local date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  // Return in datetime-local format: "YYYY-MM-DDTHH:mm"
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function MenuSpecialForm({ menuId }: MenuSpecialFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);
  const [formData, setFormData] = useState<MenuSpecial>({
    type: "F",
    special_price: 0,
    validity: "forever",
    special_status: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing special
  useEffect(() => {
    const fetchSpecial = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/menu-specials/${menuId}`, {
          credentials: "include",
        });

        const result = await response.json();

        if (result.success && result.data) {
          setHasSpecial(true);
          setFormData({
            type: result.data.type || "F",
            special_price: result.data.special_price || 0,
            validity: result.data.validity || "forever",
            special_status: result.data.special_status || false,
            start_date: result.data.start_date
              ? convertISOToLocalDateTime(result.data.start_date)
              : undefined,
            end_date: result.data.end_date
              ? convertISOToLocalDateTime(result.data.end_date)
              : undefined,
            recurring_every: result.data.recurring_every || [],
            recurring_from: result.data.recurring_from || "",
            recurring_to: result.data.recurring_to || "",
          });
        } else {
          setHasSpecial(false);
        }
      } catch (error) {
        console.error("Error fetching menu special:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecial();
  }, [menuId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate special_price
    if (formData.special_price < 0) {
      newErrors.special_price = "Η τιμή πρέπει να είναι μεγαλύτερη ή ίση με 0";
    }
    if (formData.type === "P" && formData.special_price > 100) {
      newErrors.special_price = "Το ποσοστό πρέπει να είναι μεταξύ 0 και 100";
    }

    // Validate period dates
    if (formData.validity === "period") {
      if (!formData.start_date) {
        newErrors.start_date = "Η ημερομηνία έναρξης είναι υποχρεωτική";
      }
      if (!formData.end_date) {
        newErrors.end_date = "Η ημερομηνία λήξης είναι υποχρεωτική";
      }
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (start > end) {
          newErrors.end_date = "Η ημερομηνία λήξης πρέπει να είναι μετά την ημερομηνία έναρξης";
        }
      }
    }

    // Validate recurring fields
    if (formData.validity === "recurring") {
      if (!formData.recurring_every || formData.recurring_every.length === 0) {
        newErrors.recurring_every = "Πρέπει να επιλεγεί τουλάχιστον μία ημέρα";
      }
      if (!formData.recurring_from) {
        newErrors.recurring_from = "Η ώρα έναρξης είναι υποχρεωτική";
      }
      if (!formData.recurring_to) {
        newErrors.recurring_to = "Η ώρα λήξης είναι υποχρεωτική";
      }
      if (formData.recurring_from && formData.recurring_to) {
        if (formData.recurring_from >= formData.recurring_to) {
          newErrors.recurring_to = "Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Prepare payload
      const payload: any = {
        type: formData.type,
        special_price: parseFloat(formData.special_price.toString()),
        validity: formData.validity,
        special_status: formData.special_status,
      };

      // Add conditional fields
      if (formData.validity === "period") {
        payload.start_date = convertLocalDateTimeToISO(formData.start_date!);
        payload.end_date = convertLocalDateTimeToISO(formData.end_date!);
      } else if (formData.validity === "recurring") {
        payload.recurring_every = formData.recurring_every;
        payload.recurring_from = formData.recurring_from;
        payload.recurring_to = formData.recurring_to;
      }

      const response = await fetch(`/api/admin/menu-specials/${menuId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setHasSpecial(true);
        toast.success("Η προσφορά αποθηκεύτηκε με επιτυχία!");
      } else {
        toast.error(`Σφάλμα: ${result.error || "Αποτυχία αποθήκευσης προσφοράς"}`);
      }
    } catch (error) {
      console.error("Error saving menu special:", error);
      toast.error("Προέκυψε σφάλμα κατά την αποθήκευση της προσφοράς");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // Confirm deletion first
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την προσφορά;")) {
      return;
    }

    const deletePromise = async () => {
      const response = await fetch(`/api/admin/menu-specials/${menuId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Αποτυχία διαγραφής προσφοράς");
      }

      setHasSpecial(false);
      // Reset form
      setFormData({
        type: "F",
        special_price: 0,
        validity: "forever",
        special_status: false,
      });

      return result;
    };

    toast.promise(deletePromise(), {
      loading: "Διαγραφή προσφοράς...",
      success: "Η προσφορά διαγράφηκε με επιτυχία!",
      error: (err) => err.message || "Προέκυψε σφάλμα κατά τη διαγραφή της προσφοράς",
    });

    try {
      setDeleting(true);
      await deletePromise();
    } catch (error) {
      console.error("Error deleting menu special:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (
    field: keyof MenuSpecial,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Clear conditional fields when validity changes
      if (field === "validity") {
        if (value === "forever") {
          updated.start_date = undefined;
          updated.end_date = undefined;
          updated.recurring_every = undefined;
          updated.recurring_from = undefined;
          updated.recurring_to = undefined;
        } else if (value === "period") {
          updated.recurring_every = undefined;
          updated.recurring_from = undefined;
          updated.recurring_to = undefined;
        } else if (value === "recurring") {
          updated.start_date = undefined;
          updated.end_date = undefined;
        }
      }

      // Clear errors when field changes
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      return updated;
    });
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const currentDays = prev.recurring_every || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      return { ...prev, recurring_every: newDays };
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Special Type */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Τύπος Προσφοράς <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleInputChange("type", "F")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.type === "F"
                ? "bg-[var(--brand-border)] text-white"
                : "bg-[#2a2a2a] text-gray-300 border border-gray-700 hover:bg-[#3a3a3a]"
            }`}
          >
            Σταθερό Ποσό
          </button>
          <button
            type="button"
            onClick={() => handleInputChange("type", "P")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.type === "P"
                ? "bg-[var(--brand-border)] text-white"
                : "bg-[#2a2a2a] text-gray-300 border border-gray-700 hover:bg-[#3a3a3a]"
            }`}
          >
            Ποσοστό
          </button>
        </div>
      </div>

      {/* Special Price */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Τιμή Προσφοράς <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            €
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            max={formData.type === "P" ? 100 : undefined}
            value={formData.special_price}
            onChange={(e) =>
              handleInputChange("special_price", parseFloat(e.target.value) || 0)
            }
            className={`w-full pl-8 pr-4 py-2 bg-[#2a2a2a] border ${
              errors.special_price ? "border-red-500" : "border-gray-700"
            } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)]`}
            required
          />
        </div>
        {errors.special_price && (
          <p className="mt-1 text-sm text-red-400">{errors.special_price}</p>
        )}
        {formData.type === "P" && (
          <p className="mt-1 text-xs text-gray-400">
            Μέγιστη τιμή: 100 (ποσοστό)
          </p>
        )}
      </div>

      {/* Validity */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Ισχύς <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleInputChange("validity", "forever")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.validity === "forever"
                ? "bg-[var(--brand-border)] text-white"
                : "bg-[#2a2a2a] text-gray-300 border border-gray-700 hover:bg-[#3a3a3a]"
            }`}
          >
            Μόνιμα
          </button>
          <button
            type="button"
            onClick={() => handleInputChange("validity", "period")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.validity === "period"
                ? "bg-[var(--brand-border)] text-white"
                : "bg-[#2a2a2a] text-gray-300 border border-gray-700 hover:bg-[#3a3a3a]"
            }`}
          >
            Περίοδος
          </button>
          <button
            type="button"
            onClick={() => handleInputChange("validity", "recurring")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.validity === "recurring"
                ? "bg-[var(--brand-border)] text-white"
                : "bg-[#2a2a2a] text-gray-300 border border-gray-700 hover:bg-[#3a3a3a]"
            }`}
          >
            Επανάληψη
          </button>
        </div>
      </div>

      {/* Period Fields */}
      {formData.validity === "period" && (
        <div className="space-y-4 bg-[#2a2a2a] p-4 rounded-lg border border-gray-700">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ημερομηνία Έναρξης <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.start_date || ""}
              onChange={(e) => handleInputChange("start_date", e.target.value)}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border ${
                errors.start_date ? "border-red-500" : "border-gray-700"
              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)]`}
              required={formData.validity === "period"}
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-400">{errors.start_date}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ημερομηνία Λήξης <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.end_date || ""}
              onChange={(e) => handleInputChange("end_date", e.target.value)}
              min={formData.start_date || undefined}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border ${
                errors.end_date ? "border-red-500" : "border-gray-700"
              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)]`}
              required={formData.validity === "period"}
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-400">{errors.end_date}</p>
            )}
          </div>
        </div>
      )}

      {/* Recurring Fields */}
      {formData.validity === "recurring" && (
        <div className="space-y-4 bg-[#2a2a2a] p-4 rounded-lg border border-gray-700">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Επανάληψη Κάθε <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    formData.recurring_every?.includes(day)
                      ? "bg-[var(--brand-border)] text-white"
                      : "bg-[#1a1a1a] text-gray-300 border border-gray-700 hover:bg-[#3a3a3a]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {errors.recurring_every && (
              <p className="mt-1 text-sm text-red-400">
                {errors.recurring_every}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Από Ώρα <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={formData.recurring_from || ""}
                onChange={(e) =>
                  handleInputChange("recurring_from", e.target.value)
                }
                className={`w-full px-4 py-2 bg-[#1a1a1a] border ${
                  errors.recurring_from ? "border-red-500" : "border-gray-700"
                } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)]`}
                required={formData.validity === "recurring"}
              />
              {errors.recurring_from && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.recurring_from}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Έως Ώρα <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={formData.recurring_to || ""}
                onChange={(e) =>
                  handleInputChange("recurring_to", e.target.value)
                }
                min={formData.recurring_from || undefined}
                className={`w-full px-4 py-2 bg-[#1a1a1a] border ${
                  errors.recurring_to ? "border-red-500" : "border-gray-700"
                } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)]`}
                required={formData.validity === "recurring"}
              />
              {errors.recurring_to && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.recurring_to}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Special Status */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Κατάσταση Προσφοράς <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm ${
              formData.special_status ? "text-green-400" : "text-red-400"
            }`}
          >
            {formData.special_status ? "Ενεργό" : "Ανενεργό"}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.special_status}
              onChange={(e) =>
                handleInputChange("special_status", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-border)]"></div>
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Επιλέξτε Ενεργό για να ενεργοποιήσετε την Προσφορά και εισάγετε την Ημερομηνία Έναρξης, 
          Ημερομηνία Λήξης και την τιμή του αντικειμένου Προσφοράς σας.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-[var(--brand-border)] text-white rounded-lg font-medium hover:bg-[var(--brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Αποθήκευση..." : "Αποθήκευση Προσφοράς"}
        </button>
        {hasSpecial && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Διαγραφή..." : "Διαγραφή"}
          </button>
        )}
      </div>
    </form>
  );
}
