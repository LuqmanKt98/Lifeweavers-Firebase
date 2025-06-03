// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            LWV CLINIC E-DOC
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back! Please sign in to continue.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
