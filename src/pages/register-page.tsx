import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CheckSquare, Mail, User, Lock, Eye, EyeOff } from "lucide-react";
import { register as registerUser } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RegisterFormValues = {
  email: string;
  username: string;
  password: string;
};

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { email: "", username: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, username, password }) => {
    setError("");
    try {
      await registerUser(email, username, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Register failed");
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-xl">
        <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center p-1.5">
          <div className="w-full h-full rounded-xl bg-raised flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-accent" />
          </div>
        </div>

        <h1 className="mt-4 text-xl font-semibold text-center text-fg">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-muted text-center">
          Sign up to start organizing your tasks
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3.5">
          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-email" className="text-xs font-medium text-muted">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                id="register-email"
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
            <label htmlFor="register-username" className="text-xs font-medium text-muted">
              Username
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                id="register-username"
                type="text"
                autoComplete="username"
                placeholder="yourusername"
                className="pl-9"
                {...register("username", { required: true })}
              />
            </div>
            {errors.username && (
              <span className="text-xs text-danger">Username is required</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-password" className="text-xs font-medium text-muted">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className="pl-9 pr-9"
                {...register("password", { required: true, minLength: 6 })}
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
              <span className="text-xs text-danger">
                Password must be at least 6 characters
              </span>
            )}
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
