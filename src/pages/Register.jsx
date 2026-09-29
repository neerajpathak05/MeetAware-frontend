import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  // -----------------------------
  // Google Sign-In
  // -----------------------------
  const handleGoogleResponse = async (response) => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      if (!response?.credential) {
        throw new Error(
          "Google did not provide a valid credential."
        );
      }

      const result = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: response.credential,
          }),
        }
      );

      let data = {};

      try {
        data = await result.json();
      } catch {
        data = {};
      }

      if (!result.ok) {
        throw new Error(
          data.message || "Google registration failed."
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          "Google sign-in response was incomplete."
        );
      }

      // Save authentication data
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Go to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Google registration error:", error);

      setError(
        error.message ||
          "Unable to register with Google. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Load Google Identity Services
  // -----------------------------
  useEffect(() => {
    let script;

    const loadGoogle = () => {
      if (
        !window.google ||
        !window.google.accounts ||
        !googleButtonRef.current ||
        googleInitializedRef.current
      ) {
        return;
      }

      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        setError(
          "Google Sign-In is not configured."
        );
        return;
      }

      googleInitializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: "outline",
          size: "large",
          width: 350,
          text: "continue_with",
          shape: "rectangular",
        }
      );
    };

    // Google script already available
    if (window.google) {
      loadGoogle();
      return;
    }

    // Check whether the script already exists
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        loadGoogle
      );

      return () => {
        existingScript.removeEventListener(
          "load",
          loadGoogle
        );
      };
    }

    // Load Google Identity Services
    script = document.createElement("script");

    script.src =
      "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = loadGoogle;

    document.head.appendChild(script);

    return () => {
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // -----------------------------
  // Normal Registration
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Basic validation
    if (
      !normalizedName ||
      !normalizedEmail ||
      !password.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: normalizedName,
            email: normalizedEmail,
            password,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to create your account."
        );
        return;
      }

      setName("");
      setEmail("");
      setPassword("");

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        "Unable to connect to MeetAware. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              M
            </div>

            <span className="text-xl font-bold text-gray-900">
              MeetAware
            </span>
          </Link>

          <Link
            to="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>

        </div>
      </nav>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* Register Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

            {/* Header */}
            <div className="text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-600">
                M
              </div>

              <h1 className="mt-5 text-2xl font-bold text-gray-900">
                Create your account
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Start organizing your meetings with MeetAware
              </p>

            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                role="status"
                className="mt-6 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            {/* Google Sign-In */}
            <div className="mt-7 flex justify-center">
              <div ref={googleButtonRef}></div>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">

              <div className="h-px flex-1 bg-gray-200"></div>

              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Or continue with email
              </span>

              <div className="h-px flex-1 bg-gray-200"></div>

            </div>

            {/* Registration Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your full name"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Create a password"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Password must be at least 6 characters.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>

            {/* Login Link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Sign in
              </Link>
            </p>

          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-xs text-gray-400">
            By creating an account, you agree to use MeetAware responsibly.
          </p>

        </div>

      </main>
    </div>
  );
}

export default Register;