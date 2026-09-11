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
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="digilocker">DigiLocker</TabsTrigger>
        <TabsTrigger value="standard">Standard Login</TabsTrigger>
      </TabsList>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <TabsContent value="digilocker">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
          <p className="text-sm text-slate-600 text-center mb-6">
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium block mb-2 w-max mx-auto">
              Simulated for demo
            </span>
            Sign in securely using your verified DigiLocker identity.
          </p>
          <Button 
            onClick={handleDigiLockerLogin}
            disabled={loading}
            className="w-full bg-[#1B3A6B] hover:bg-[#142A4F]"
          >
            {loading ? "Connecting..." : "Sign in with DigiLocker"}
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="standard">
        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#D97706] hover:bg-[#b56305]"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-6 text-xs text-slate-500">
          <p className="font-semibold mb-1">Demo Accounts (Password: password123)</p>
          <ul className="space-y-1">
            <li>officer.mh@gov.in (Officer)</li>
            <li>admin.mh@gov.in (Admin)</li>
            <li>founder1@cropaitech.com (Startup)</li>
            <li>founder2@geospatialanalytics.com (Startup)</li>
            <li>founder3@medlinksolutions.com (Startup)</li>
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );
}
