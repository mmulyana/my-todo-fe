import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { login } from "../api";
import { AuthCard } from "../components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  });

  return (
    <AuthCard
      title="Sign in to continue"
      subtitle="Please sign in to manage your tasks"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-accent font-medium hover:underline"
          >
            Sign Up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3.5">
        {error && (
          <p
            role="alert"
            className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
          >
            {error}
          </p>
        )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-xs font-medium text-muted">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                className="pl-9"
                {...register("email", { required: true })}
              />
            </div>
            {errors.email && (
              <span className="text-xs text-danger">Email is required</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-muted">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-9 pr-9"
                {...register("password", { required: true })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-danger">Password is required</span>
            )}
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </AuthCard>
  );
}
