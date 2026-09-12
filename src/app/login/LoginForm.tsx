"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("Attempting login with:", email, password);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    console.log("Login result:", res);

    if (res?.error) {
      setError(`Login failed: ${res.error || "Invalid credentials"}`);
      setLoading(false);
    } else {
      console.log("Login successful, refreshing...");
      router.refresh();
    }
  };

  const handleDigiLockerLogin = async () => {
    setLoading(true);
    const res = await signIn("digilocker", {
      token: "mock-token",
      redirect: false,
    });
    
    if (res?.error) {
      setError("DigiLocker authentication failed");
      setLoading(false);
    } else {
      router.refresh();
    }
  };

  return (
    <Tabs defaultValue="digilocker" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 rounded-full p-1 bg-slate-100/90 border border-slate-200/80">
        <TabsTrigger value="digilocker" className="rounded-full py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs">
          DigiLocker
        </TabsTrigger>
        <TabsTrigger value="standard" className="rounded-full py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs">
          Official Login
        </TabsTrigger>
      </TabsList>
      
      {error && (
        <div className="p-3 mb-4 text-xs font-medium text-red-600 bg-red-50/90 border border-red-200 rounded-xl">
          {error}
        </div>
      )}
      
      <TabsContent value="digilocker">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-100 rounded-2xl bg-sky-50/40">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg mb-3 shadow-xs">
            DL
          </div>
          <span className="bg-amber-100 text-amber-900 text-[11px] px-2.5 py-0.5 rounded-full font-bold mb-2">
            Simulated DigiLocker Auth
          </span>
          <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
            Instant KYC verification via Government of India's DigiLocker gateway.
          </p>
          <Button 
            onClick={handleDigiLockerLogin}
            disabled={loading}
            className="w-full rounded-full bg-[#1B3A6B] hover:bg-[#142A4F] text-white py-2.5 text-xs font-semibold shadow-xs"
          >
            {loading ? "Verifying..." : "Authenticate via DigiLocker"}
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="standard">
        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-600">Official Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="officer.mh@gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white text-xs h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-600">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white text-xs h-10"
            />
          </div>
          <button 
            type="submit" 
            className="btn-gov-cta w-full py-2.5 text-xs font-semibold flex items-center justify-center shadow-sm"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>
        <div className="mt-6 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500">
          <p className="font-bold text-slate-700 mb-1">Quick Demo Credentials (pwd: password123)</p>
          <ul className="space-y-0.5 text-slate-600">
            <li>• <code className="font-mono text-slate-700">officer.mh@gov.in</code> (Gov Officer)</li>
            <li>• <code className="font-mono text-slate-700">admin.mh@gov.in</code> (Gov Admin)</li>
            <li>• <code className="font-mono text-slate-700">founder1@cropaitech.com</code> (Startup)</li>
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );
}
