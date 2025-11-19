import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
        <p className="text-gray-400 text-lg">Loading...</p>
      </div>
    </div>
  );
}







