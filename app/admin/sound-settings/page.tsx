"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  isElectron,
  playNotificationSound,
  stopNotificationSound,
} from "@/lib/electron-utils";

export default function AdminSoundSettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (!adminToken) {
        router.push("/admin/login");
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Load devices and current selection
  useEffect(() => {
    if (typeof window === "undefined" || !window.electron) return;
    navigator.mediaDevices.enumerateDevices().then((all) => {
      const outputs = all.filter((d) => d.kind === "audiooutput");
      setDevices(outputs);
      console.log(
        "[Sound settings] Audio output devices loaded:",
        outputs.length,
        outputs.map((d) => ({
          id: d.deviceId,
          label: d.label || "(no label)",
        })),
      );
    });
    window.electron.getNotificationOutputDevice?.().then((id) => {
      console.log(
        "[Sound settings] Saved device from Electron:",
        id ?? "(none/empty)",
      );
      setSavedId(id ?? null);
      if (id) setSelectedId(id);
    });
  }, []);

  // Save selection (persists to Electron so real notifications use this device)
  const handleSave = async () => {
    if (!window.electron?.setNotificationOutputDevice) {
      toast.error("Δεν υποστηρίζεται (χρησιμοποιήστε την εφαρμογή Electron)");
      return;
    }
    const deviceIdToSave = selectedId || "";
    const label =
      devices.find((d) => d.deviceId === deviceIdToSave)?.label ??
      "(default/unknown)";
    console.log(
      "[Sound settings] Save clicked — sending to Electron setNotificationOutputDevice:",
      { deviceId: deviceIdToSave || "(empty = default)", label },
    );
    try {
      setIsSaving(true);
      await window.electron.setNotificationOutputDevice(deviceIdToSave);
      setSavedId(deviceIdToSave || null);
      console.log("[Sound settings] Save succeeded.");
      toast.success(
        "Ο ήχος ειδοποιήσεων θα παίζει από την επιλεγμένη συσκευή.",
      );
    } catch (err) {
      console.error("[Sound settings] Save failed:", err);
      toast.error("Σφάλμα κατά την αποθήκευση");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isElectronEnv = isElectron();

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Ρυθμίσεις ήχου</h1>

        {!isElectronEnv && (
          <div className="mb-6 p-4 rounded-lg bg-amber-900/30 border border-amber-700 text-amber-200">
            Οι ρυθμίσεις ήχου λειτουργούν μόνο μέσα στην εφαρμογή Electron
            (desktop).
          </div>
        )}

        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 space-y-6">
          <div>
            <label
              htmlFor="sound-device"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Συσκευή αναπαραγωγής ήχου
            </label>
            <select
              id="sound-device"
              value={selectedId}
              onChange={(e) => {
                const nextId = e.target.value;
                const label =
                  devices.find((d) => d.deviceId === nextId)?.label ??
                  (nextId ? "unknown" : "default");
                console.log("[Sound settings] Device selected:", {
                  deviceId: nextId || "(default)",
                  label,
                });
                setSelectedId(nextId);
              }}
              className="w-full px-4 py-2 rounded-lg bg-[#1a1a1a] border border-gray-600 text-white focus:ring-2 focus:ring-[var(--brand-border)] focus:border-transparent"
              disabled={!isElectronEnv}
            >
              <option value="">Προεπιλογή συστήματος</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Συσκευή ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-white-400 font-bold">
              Προκειμένου να δοκιμάσετε νέα συσκευή πατήστε αποθήκευση συσκευής.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => playNotificationSound()}
              disabled={!isElectronEnv}
              className="bg-[var(--brand-border)] hover:opacity-90 text-white"
            >
              Δοκιμή ήχου
            </Button>
            <Button
              onClick={() => stopNotificationSound()}
              disabled={!isElectronEnv}
              variant="outline"
              className="border-gray-600 text-white hover:bg-[#3a3a3a]"
            >
              Διακοπή δοκιμής
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isElectronEnv || isSaving}
              variant="outline"
              className="border-gray-600 text-white hover:bg-[#3a3a3a]"
            >
              {isSaving ? "Αποθήκευση…" : "Αποθήκευση συσκευής"}
            </Button>
          </div>

          {savedId !== null && savedId !== "" && (
            <p className="text-sm text-gray-400">
              Αποθηκευμένη συσκευή:{" "}
              {devices.find((d) => d.deviceId === savedId)?.label ??
                savedId.slice(0, 12)}
              …
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
