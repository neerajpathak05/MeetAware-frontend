import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              M
            </div>

            <span className="text-xl font-bold">
              MeetAware
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/register")}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>

        </div>
      </nav>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-24">
          <div className="mx-auto max-w-3xl text-center">

            <div className="mb-6 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              Intelligent Meeting Assistant
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900 md:text-6xl">
              Turn your meetings into
              <span className="text-blue-600"> actionable insights.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              MeetAware captures your meeting conversation, creates a
              searchable transcript, and helps you understand summaries,
              decisions, action items, deadlines, and important mentions.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/register")}
                className="rounded-lg bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-700"
              >
                Get Started
              </button>

              <button
                onClick={() => navigate("/login")}
                className="rounded-lg border border-gray-300 px-7 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Sign In
              </button>
            </div>

          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-6xl px-6 py-20">

            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Everything you need after a meeting
              </h2>

              <p className="mt-3 text-gray-600">
                Keep the important parts of every conversation organized
                and easy to understand.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">

              {/* Feature 1 */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-xl">
                  📝
                </div>

                <h3 className="text-lg font-semibold">
                  Meeting Transcripts
                </h3>

                <p className="mt-2 leading-6 text-gray-600">
                  Capture the conversation and keep a structured transcript
                  that you can review after the meeting.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-xl">
                  ✨
                </div>

                <h3 className="text-lg font-semibold">
                  AI Meeting Insights
                </h3>

                <p className="mt-2 leading-6 text-gray-600">
                  Get useful summaries, discussions, decisions, action
                  items, and deadlines from your meeting.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-xl">
                  🔔
                </div>

                <h3 className="text-lg font-semibold">
                  Personal Alerts
                </h3>

                <p className="mt-2 leading-6 text-gray-600">
                  Stay aware of important mentions and tasks that are
                  relevant to you.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-2xl bg-blue-600 px-6 py-12 text-center text-white md:px-12">

            <h2 className="text-3xl font-bold">
              Make every meeting more useful.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-blue-100">
              Start using MeetAware to capture conversations and turn them
              into organized meeting insights.
            </p>

            <button
              onClick={() => navigate("/register")}
              className="mt-7 rounded-lg bg-white px-7 py-3 font-semibold text-blue-600 hover:bg-gray-100"
            >
              Get Started
            </button>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <p className="text-center text-sm text-gray-500">
          © 2026 MeetAware. Intelligent Meeting Assistant.
        </p>
      </footer>

    </div>
  );
}

export default Home;