import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { IS_MOCK_MODE } from "@/lib/mockData";

export default async function Login({ searchParams }) {
  const signIn = async (formData) => {
    "use server";

    const origin = headers().get("origin");

    if (IS_MOCK_MODE) {
      console.log("Mock Mode Active: redirecting to admin");
      redirect(`${origin}/admin`);
    }

    const email = formData.get("email");
    const password = formData.get("password");
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect("/login?message=Could not authenticate user");
    }

    console.log("Redirecting to Admin");

    redirect(`${origin}/admin`);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F3] bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Neo-brutalist Auth Card */}
        <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-6 sm:p-8">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-44 h-12 mb-3">
              <Image
                src="/invente/invente_notag.webp"
                alt="Invente '26 Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-[#FFD12E] text-black px-2.5 py-0.5 border border-black text-[11px] font-mono font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> MASTER CONTROL CONSOLE
            </div>
            <h1 className="font-syne font-black text-2xl uppercase tracking-tight text-[#101010]">
              ADMINISTRATIVE ACCESS
            </h1>
            <p className="font-mono text-xs text-gray-600 mt-1">
              Authenticate to manage tournament rounds, quiz sessions, and lab live streams.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" action={signIn}>
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-xs uppercase font-bold tracking-wider text-black mb-1"
              >
                ADMIN EMAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="coordinator@ssn.edu.in"
                required
                className="w-full bg-[#FFFDF9] border-2 border-black px-3 py-2.5 font-mono text-sm shadow-[2px_2px_0px_#101010] focus:bg-[#FFF9A6] focus:outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-xs uppercase font-bold tracking-wider text-black mb-1"
              >
                SECURITY KEY
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••••••"
                required
                className="w-full bg-[#FFFDF9] border-2 border-black px-3 py-2.5 font-mono text-sm shadow-[2px_2px_0px_#101010] focus:bg-[#FFF9A6] focus:outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              className="btn-brutal mt-2 w-full bg-[#FFD12E] hover:bg-[#FFE57F] text-black border-2 border-black font-syne font-black text-sm uppercase py-3 shadow-brutal flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Lock className="w-4 h-4" /> UNLOCK CONTROL DECK <ArrowRight className="w-4 h-4" />
            </button>

            {IS_MOCK_MODE && (
              <div className="bg-[#C1F8FF] border-2 border-black p-3 text-xs font-mono text-black shadow-brutal mt-2">
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#101010]" />
                  <span>MOCK MODE ACTIVE</span>
                </div>
                Database authentication bypassed. Click button with any credentials to preview the full Admin Dashboard.
              </div>
            )}

            {searchParams?.message && (
              <div className="bg-[#FF6B35] text-white border-2 border-black p-3 font-mono text-xs shadow-brutal text-center font-bold">
                {searchParams.message}
              </div>
            )}
          </form>

          {/* Footer badge */}
          <div className="mt-6 pt-4 border-t border-dashed border-gray-300 flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase">
            <span>SSN & SNUC INVENTE &apos;26</span>
            <span>CODECTIONS DECK v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

