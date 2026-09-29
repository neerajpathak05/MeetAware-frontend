import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [user, setUser] = useState(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [googleMessage, setGoogleMessage] = useState("");

  // =====================================================
  // HISTORY STATE
  // =====================================================

  const [meetings, setMeetings] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("User data error:", error);

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      navigate("/login");
    }
  }, [navigate]);

  // =====================================================
  // HANDLE GOOGLE CALLBACK
  // =====================================================

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const googleStatus = params.get("google");

    if (googleStatus === "connected") {
      setGoogleMessage(
        "Google account connected successfully."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);

  // =====================================================
  // FETCH MEETING HISTORY
  // =====================================================

  useEffect(() => {
    const fetchMeetingHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/meetings/history`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to fetch meeting history."
          );
        }

        console.log(
          "Meeting history received:",
          data.meetings
        );

        setMeetings(data.meetings || []);
      } catch (error) {
        console.error(
          "Meeting history error:",
          error
        );

        setHistoryError(
          error.message ||
            "Unable to load meeting history."
        );
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchMeetingHistory();
  }, [API_URL, navigate]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // =====================================================
  // CONNECT GOOGLE ACCOUNT
  // =====================================================

  const handleGoogleConnect = async () => {
    try {
      setGoogleMessage("");
      setHistoryError("");

      setConnectingGoogle(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/google/auth`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to connect Google."
        );
      }

      if (!data.authUrl) {
        throw new Error(
          "Google authorization URL was not received."
        );
      }

      window.location.href = data.authUrl;
    } catch (error) {
      console.error(
        "Google connection error:",
        error
      );

      setGoogleMessage(
        error.message ||
          "Unable to connect to Google. Please try again."
      );
    } finally {
      setConnectingGoogle(false);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatMeetingDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    try {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return "Date unavailable";
      }

      return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Date unavailable";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>

          <p className="text-sm text-gray-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const firstName =
    user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900">

      {/* ================================================= */}
      {/* NAVBAR */}
      {/* ================================================= */}

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">

          {/* Logo */}

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex min-w-0 cursor-pointer items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              M
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-gray-900">
                MeetAware
              </h1>

              <p className="hidden text-[10px] font-medium uppercase tracking-wider text-gray-400 sm:block">
                Intelligent Meeting Assistant
              </p>
            </div>
          </button>

          {/* Navigation */}

          <div className="hidden items-center gap-8 md:flex">

            <button
              type="button"
              className="text-sm font-medium text-indigo-600"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigate("/meeting")}
              className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
              Meetings
            </button>

          </div>

          {/* User */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800">
                {user.name}
              </p>

              <p className="max-w-40 truncate text-xs text-gray-400">
                {user.email}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : "U"}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 sm:px-3"
            >
              <span className="hidden sm:inline">
                Logout
              </span>

              <span className="sm:hidden">
                Exit
              </span>
            </button>

          </div>

        </div>
      </nav>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">

        {/* ================================================= */}
        {/* WELCOME */}
        {/* ================================================= */}

        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>

            <p className="text-sm font-medium text-indigo-600">
              Dashboard
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Welcome back, {firstName}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Turn your Google Meet conversations into
              transcripts, summaries, decisions and actionable
              insights.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate("/meeting")}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
          >
            Analyze Meeting
            <span>→</span>
          </button>

        </section>

        {/* ================================================= */}
        {/* GOOGLE CONNECTION */}
        {/* ================================================= */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex flex-col gap-5 p-6 sm:p-7 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg font-bold text-gray-800">
                G
              </div>

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h3 className="font-semibold text-gray-900">
                    Connect your Google account
                  </h3>

                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Required
                  </span>

                </div>

                <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                  Connect Google to access your Google Meet
                  conference information and participants.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={handleGoogleConnect}
              disabled={connectingGoogle}
              className="w-full rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {connectingGoogle
                ? "Connecting..."
                : "Connect Google"}
            </button>

          </div>

          {googleMessage && (
            <div className="border-t border-gray-100 px-6 py-4 sm:px-7">
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  googleMessage.includes(
                    "successfully"
                  )
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {googleMessage}
              </div>
            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* QUICK ACTION */}
        {/* ================================================= */}

        <section className="mt-8 grid gap-6 lg:grid-cols-5">

          <div className="relative overflow-hidden rounded-2xl bg-indigo-600 p-7 text-white shadow-sm lg:col-span-3">

            <div className="relative z-10">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg">
                +
              </div>

              <h3 className="mt-6 text-2xl font-bold">
                Analyze a new meeting
              </h3>

              <p className="mt-2 max-w-lg text-sm leading-6 text-indigo-100">
                Enter a Google Meet link to retrieve meeting
                information, capture the conversation and generate
                AI-powered insights.
              </p>

              <button
                type="button"
                onClick={() => navigate("/meeting")}
                className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Start Analysis
              </button>

            </div>

            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10"></div>

            <div className="absolute -bottom-24 right-20 h-52 w-52 rounded-full bg-white/5"></div>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm lg:col-span-2">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Meeting insights
            </p>

            <h3 className="mt-2 text-xl font-bold text-gray-900">
              Everything important in one place
            </h3>

            <div className="mt-6 space-y-4">

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600">
                  ✓
                </div>

                <span className="text-sm text-gray-600">
                  Complete meeting summary
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600">
                  ✓
                </div>

                <span className="text-sm text-gray-600">
                  Speaker discussions
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600">
                  ✓
                </div>

                <span className="text-sm text-gray-600">
                  Decisions and action items
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600">
                  ✓
                </div>

                <span className="text-sm text-gray-600">
                  Deadlines and personal alerts
                </span>
              </div>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* FEATURES */}
        {/* ================================================= */}

        <section className="mt-12">

          <div className="mb-6">

            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Capabilities
            </p>

            <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              From conversation to clarity
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              MeetAware organizes the important information from
              your meetings automatically.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                ≡
              </div>

              <h4 className="mt-4 font-semibold text-gray-900">
                Meeting Summary
              </h4>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Get a concise overview of the complete
                conversation.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                ◉
              </div>

              <h4 className="mt-4 font-semibold text-gray-900">
                Speaker Discussions
              </h4>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Understand what each participant discussed.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                ✓
              </div>

              <h4 className="mt-4 font-semibold text-gray-900">
                Decisions
              </h4>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Identify important decisions made during
                the meeting.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                →
              </div>

              <h4 className="mt-4 font-semibold text-gray-900">
                Action Items
              </h4>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Extract tasks and the people responsible for
                them.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                ◷
              </div>

              <h4 className="mt-4 font-semibold text-gray-900">
                Deadlines
              </h4>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Surface deadlines explicitly mentioned in
                conversations.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                !
              </div>

              <h4 className="mt-4 font-semibold text-gray-900">
                Personal Alerts
              </h4>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Highlight information specifically relevant
                to you.
              </p>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* RECENT MEETINGS / HISTORY */}
        {/* ================================================= */}

        <section className="mt-12">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                History
              </p>

              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                Recent Meetings
              </h3>

            </div>

            {meetings.length > 0 && (
              <span className="text-sm text-gray-400">
                {meetings.length} meeting
                {meetings.length !== 1 ? "s" : ""}
              </span>
            )}

          </div>

          {/* ================================================= */}
          {/* HISTORY LOADING */}
          {/* ================================================= */}

          {historyLoading && (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>

              <p className="mt-4 text-sm text-gray-500">
                Loading your meetings...
              </p>

            </div>
          )}

          {/* ================================================= */}
          {/* HISTORY ERROR */}
          {/* ================================================= */}

          {!historyLoading && historyError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6">

              <p className="text-sm font-semibold text-red-700">
                Unable to load meeting history
              </p>

              <p className="mt-1 text-sm text-red-600">
                {historyError}
              </p>

            </div>
          )}

          {/* ================================================= */}
          {/* NO MEETINGS */}
          {/* ================================================= */}

          {!historyLoading &&
            !historyError &&
            meetings.length === 0 && (
              <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                  —
                </div>

                <h4 className="mt-4 font-semibold text-gray-800">
                  No meetings yet
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Your analyzed meetings will appear here.
                  Start by analyzing your first Google Meet
                  session.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/meeting")}
                  className="mt-5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Analyze your first meeting
                </button>

              </div>
            )}

          {/* ================================================= */}
          {/* MEETING LIST */}
          {/* ================================================= */}

          {!historyLoading &&
            !historyError &&
            meetings.length > 0 && (
              <div className="mt-5 space-y-4">

                {meetings.map((meeting) => (

                  <div
                    key={meeting.id}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                      {/* Meeting information */}

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <span className="h-2 w-2 rounded-full bg-green-500"></span>

                          <span className="text-xs font-semibold uppercase tracking-wider text-green-600">
                            Analyzed
                          </span>

                        </div>

                        <h4 className="mt-2 truncate text-lg font-bold text-gray-900">
                          {meeting.conferenceName ||
                            "Google Meet Session"}
                        </h4>

                        <p className="mt-1 font-mono text-xs text-gray-400">
                          {meeting.meetingCode ||
                            "Meeting code unavailable"}
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          {formatMeetingDate(
                            meeting.createdAt
                          )}
                        </p>

                      </div>

                      {/* Statistics */}

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                        {/* PEOPLE */}

                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">

                          <p className="text-lg font-bold text-gray-900">
                            {meeting.statistics?.participantCount ?? 0}
                          </p>

                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            People
                          </p>

                        </div>

                        {/* TRANSCRIPT */}

                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">

                          <p className="text-lg font-bold text-gray-900">
                            {meeting.statistics?.transcriptEntryCount ?? 0}
                          </p>

                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            Transcript
                          </p>

                        </div>

                        {/* NEW ANALYSIS */}

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/meeting")
                          }
                          className="col-span-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:col-span-1"
                        >
                          New Analysis
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>
            )}

        </section>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <footer className="mt-12 border-t border-gray-200 py-7 text-center">

          <p className="text-xs text-gray-400">
            MeetAware
          </p>

        </footer>

      </main>

    </div>
  );
}

export default Dashboard;