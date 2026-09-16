import { useState } from "react";
import { heroSectionData } from "../assets/assets";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  BikeIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Something went wrong"
        );
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-app-green relative
        items-center justify-center"
      >
        <img
          src={heroSectionData.hero_image}
          alt="Grocery"
          className="absolute inset-0 object-cover w-full h-full opacity-10"
        />

        <div className="relative text-center px-12">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Welcome back to Maurya Grocery
          </h2>

          <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">
            Fresh groceries and organic produce, delivered to your doorstep.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-app-cream">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 mb-6"
            >
              <BikeIcon className="size-8 text-app-green" />

              <span className="text-2xl font-semibold text-app-green">
                Maurya-Grocery
              </span>
            </Link>

            <h1 className="text-2xl font-semibold text-app-green mb-2">
              Sign in to your account
            </h1>

            <p className="text-sm text-app-text-light">
              Don't have an account?

              <Link
                to="/register"
                className="text-orange-500 ml-1 font-semibold
                hover:text-orange-600 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <label className="text-sm flex flex-col gap-1">
              Email Address

              <div className="relative">
                <MailIcon
                  className="absolute left-3.5 top-1/2
                  -translate-y-1/2 size-4 text-app-text-light"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white
                  rounded-xl border border-app-border
                  focus:border-app-green focus:outline-none
                  transition-all"
                />
              </div>
            </label>

            {/* Password */}
            <label className="text-sm flex flex-col gap-1">
              Password

              <div className="relative">
                <LockIcon
                  className="absolute left-3.5 top-1/2
                  -translate-y-1/2 size-4 text-app-text-light"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white
                  rounded-xl border border-app-border
                  focus:border-app-green focus:outline-none
                  transition-all"
                />
              </div>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2
              w-full py-3 bg-green-950 text-white font-semibold
              rounded-xl hover:bg-green-900 transition-colors
              disabled:opacity-50"
            >
              {loading ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;