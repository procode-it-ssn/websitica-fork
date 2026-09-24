import { signOut } from "@/app/_actions/user";
import { LogOut } from "lucide-react";

export default function Logout() {
  return (
    <form action={signOut} className="flex">
      <button
        type="submit"
        className="btn-brutal bg-white hover:bg-red-50 text-red-600 border-2 border-black font-mono font-bold text-xs uppercase px-3.5 py-2 shadow-brutal flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        <span>EJECT / LOGOUT</span>
      </button>
    </form>
  );
}

