import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MeetingRecorder from "../components/MeetingRecorder";

function Meeting() {
  const navigate = useNavigate();

  const [meetingLink, setMeetingLink] = useState("");
  const [meeting, setMeeting] = useState(null);

  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  // =====================================================
  // NORMALIZE MEETING DATA
  // =====================================================

  const normalizeMeeting = (data) => {
    const sourceMeeting =
      data?.meeting || data || {};

    return {
      ...sourceMeeting,

      id:
        sourceMeeting.id ||
        sourceMeeting._id,

      participants:
        data?.participants ||
        sourceMeeting.participants ||
        [],

      transcript:
        data?.transcript ||
        sourceMeeting.transcript ||
        [],

      statistics:
        data?.statistics ||
        sourceMeeting.statistics ||
        {},

      aiAnalysis:
        data?.aiAnalysis ||
        sourceMeeting.aiAnalysis ||
        null,
    };
  };

  // =====================================================
  // RESTORE SAVED MEETING AFTER REFRESH
  // =====================================================

  useEffect(() => {
    const restoreMeeting = async () => {
      try {
        const token =
          localStorage.getItem("token");

        if (!token) {
          setRestoring(false);
          navigate("/login");
          return;
        }

        const savedMeetingId =
          localStorage.getItem(
            "activeMeetingId"
          );

        // No previously opened meeting
        if (!savedMeetingId) {
          setRestoring(false);
          return;
        }

        console.log(
          "Restoring meeting:",
          savedMeetingId
        );

        const response = await fetch(
          `${API_URL}/api/meetings/${savedMeetingId}`,
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

        // Session expired
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem(
            "activeMeetingId"
          );

          navigate("/login");
          return;
        }

        // Meeting no longer exists
        if (response.status === 404) {
          console.log(
            "Saved meeting was not found."
          );

          localStorage.removeItem(
            "activeMeetingId"
          );

          setRestoring(false);
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to restore meeting."
          );
        }

        console.log(
          "Restored meeting:",
          data
        );

        const restoredMeeting =
          normalizeMeeting(data);

        setMeeting(restoredMeeting);

        // Restore meeting link too
        if (restoredMeeting.meetingLink) {
          setMeetingLink(
            restoredMeeting.meetingLink
          );
        }

        setSuccess(
          "Meeting restored successfully."
        );

      } catch (error) {
        console.error(
          "Meeting restore error:",
          error
        );

        // Do not keep a broken meeting ID forever
        localStorage.removeItem(
          "activeMeetingId"
        );

        setError(
          error.message ||
            "Unable to restore meeting."
        );

      } finally {
        setRestoring(false);
      }
    };

    restoreMeeting();
  }, [API_URL, navigate]);

  // =====================================================
  // FETCH GOOGLE MEET
  // =====================================================

  const fetchMeeting = async () => {
    try {
      setError("");
      setSuccess("");
      setMeeting(null);

      if (!meetingLink.trim()) {
        setError(
          "Please enter a Google Meet link."
        );
        return;
      }

      const token =
        localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/meetings/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            meetingLink:
              meetingLink.trim(),
          }),
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
            "Unable to fetch meeting."
        );
      }

      console.log(
        "Meeting API response:",
        data
      );

      const normalizedMeeting =
        normalizeMeeting(data);

      // =====================================================
      // SAVE ACTIVE MEETING ID
      // =====================================================

      if (normalizedMeeting.id) {
        localStorage.setItem(
          "activeMeetingId",
          String(normalizedMeeting.id)
        );
      }

      setMeeting(
        normalizedMeeting
      );

      setSuccess(
        "Meeting connected successfully."
      );

    } catch (error) {
      console.error(
        "Meeting fetch error:",
        error
      );

      setError(
        error.message ||
          "Unable to retrieve meeting."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UPDATE TRANSCRIPT
  // =====================================================

  const handleTranscriptUpdate = (
    transcript
  ) => {
    console.log(
      "Updating frontend transcript:",
      transcript
    );

    if (!Array.isArray(transcript)) {
      console.warn(
        "Invalid transcript received:",
        transcript
      );

      return;
    }

    setMeeting(
      (previousMeeting) => {
        if (!previousMeeting) {
          return previousMeeting;
        }

        return {
          ...previousMeeting,

          transcript:
            transcript,

          statistics: {
            ...previousMeeting.statistics,

            transcriptEntryCount:
              transcript.length,

            transcriptCount:
              transcript.length,
          },
        };
      }
    );

    setSuccess(
      "Meeting audio transcribed successfully."
    );
  };

  // =====================================================
  // AI MEETING ANALYSIS
  // =====================================================

  const handleAnalyzeMeeting =
    async () => {
      try {
        setError("");
        setSuccess("");

        if (!meeting?.id) {
          setError(
            "Meeting information is not available."
          );
          return;
        }

        if (
          !meeting.transcript ||
          meeting.transcript.length === 0
        ) {
          setError(
            "Please record and transcribe the meeting before analyzing it."
          );
          return;
        }

        const token =
          localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        setAnalyzing(true);

        const response = await fetch(
          `${API_URL}/api/meetings/${meeting.id}/analyze`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
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
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          navigate("/login");
          return;
        }

        console.log(
          "AI analysis response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to analyze meeting."
          );
        }

        setMeeting(
          (previousMeeting) => ({
            ...previousMeeting,

            aiAnalysis:
              data.aiAnalysis || {},
          })
        );

        setSuccess(
          "Meeting analysis completed successfully."
        );

      } catch (error) {
        console.error(
          "AI analysis error:",
          error
        );

        setError(
          error.message ||
            "Unable to analyze meeting."
        );

      } finally {
        setAnalyzing(false);
      }
    };

  // =====================================================
  // RESTORING SCREEN
  // =====================================================

  if (restoring) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                M
              </div>

              <span className="font-bold text-gray-900">
                MeetAware
              </span>

            </div>

          </div>
        </div>

        <div className="flex min-h-[70vh] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>

            <p className="mt-4 text-sm text-gray-500">
              Restoring your meeting...
            </p>

          </div>

        </div>
      </div>
    );
  }

  // =====================================================
  // LOADING GOOGLE MEET
  // =====================================================

  if (!meeting && loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">

        <div className="border-b border-gray-200 bg-white">

          <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                M
              </div>

              <span className="font-bold text-gray-900">
                MeetAware
              </span>

            </div>

          </div>

        </div>

        <div className="flex min-h-[70vh] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>

            <p className="mt-4 text-sm text-gray-500">
              Connecting to your meeting...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900">

      {/* NAVBAR */}

      <nav className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
            >
              ←
            </button>

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                M
              </div>

              <span className="font-bold text-gray-900">
                MeetAware
              </span>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            Dashboard
          </button>

        </div>

      </nav>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">

        {/* HEADER */}

        <div className="mb-8">

          <p className="text-sm font-medium text-indigo-600">
            Meeting Analysis
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Analyze your meeting
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Connect a Google Meet session, capture the
            conversation and turn it into useful insights.
          </p>

        </div>

        {/* CONNECT MEETING */}

        {!meeting && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="max-w-2xl">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                G
              </div>

              <h2 className="mt-5 text-xl font-bold text-gray-900">
                Connect a Google Meet
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter the meeting link below to retrieve
                the meeting information and participants.
              </p>

            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">

              <input
                type="text"
                value={meetingLink}
                onChange={(e) =>
                  setMeetingLink(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchMeeting();
                  }
                }}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

              <button
                type="button"
                onClick={fetchMeeting}
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Connecting..."
                  : "Connect Meeting"}
              </button>

            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

          </section>
        )}

        {/* MEETING */}

        {meeting && (
          <>

            {/* OVERVIEW */}

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-100 p-6 sm:p-7">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-green-500"></span>

                    <span className="text-xs font-semibold uppercase tracking-wider text-green-600">
                      Meeting connected
                    </span>

                  </div>

                  <h2 className="mt-3 text-2xl font-bold text-gray-900">
                    {meeting.conferenceName ||
                      "Google Meet Session"}
                  </h2>

                  <p className="mt-1 font-mono text-sm text-gray-400">
                    {meeting.meetingCode ||
                      "Meeting code unavailable"}
                  </p>

                </div>

              </div>

              <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

                <div className="p-6">

                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Start
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {meeting.startTime ||
                      "Not available"}
                  </p>

                </div>

                <div className="p-6">

                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    End
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {meeting.endTime ||
                      "Not available"}
                  </p>

                </div>

                <div className="p-6">

                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Participants
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {meeting.participants?.length ||
                      0}
                  </p>

                </div>

              </div>

            </section>

            {/* PARTICIPANTS + RECORDER */}

            <section className="mt-6 grid gap-6 lg:grid-cols-3">

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      People
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                      Participants
                    </h2>

                  </div>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                    {meeting.participants?.length ||
                      0}
                  </span>

                </div>

                <div className="mt-5">

                  {meeting.participants &&
                  meeting.participants.length > 0 ? (
                    <div className="max-h-82.5 space-y-2 overflow-y-auto pr-1">

                      {meeting.participants.map(
                        (
                          participant,
                          index
                        ) => (
                          <div
                            key={
                              participant.id ||
                              index
                            }
                            className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 transition hover:bg-gray-50"
                          >

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                              {participant.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "?"}
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-gray-800">
                                {participant.name ||
                                  "Unknown Participant"}
                              </p>

                              <p className="text-xs text-gray-400">
                                {participant.type ||
                                  "Participant"}
                              </p>

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
                      No participants found.
                    </div>
                  )}

                </div>

              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">

                <div className="mb-5">

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Recording
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-gray-900">
                    Capture meeting audio
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Capture the meeting tab audio to generate
                    the transcript.
                  </p>

                </div>

                <MeetingRecorder
                  meetingId={meeting.id}
                  onTranscriptUpdate={
                    handleTranscriptUpdate
                  }
                />

              </div>

            </section>

            {/* TRANSCRIPT */}

            <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Conversation
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-gray-900">
                    Meeting Transcript
                  </h2>

                </div>

                <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                  {meeting.transcript?.length ||
                    0}{" "}
                  entries
                </span>

              </div>

              {meeting.transcript &&
              meeting.transcript.length > 0 ? (
                <div className="max-h-140 overflow-y-auto p-5 sm:p-6">

                  <div className="space-y-1">

                    {meeting.transcript.map(
                      (
                        entry,
                        index
                      ) => (
                        <div
                          key={index}
                          className="group rounded-xl px-4 py-4 transition hover:bg-gray-50"
                        >

                          <div className="flex gap-4">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                              {entry.speaker
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "?"}
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="text-sm font-semibold text-gray-900">
                                  {entry.speaker ||
                                    "Unknown Speaker"}
                                </span>

                                {entry.startTime && (
                                  <span className="text-xs text-gray-400">
                                    {entry.startTime}
                                  </span>
                                )}

                              </div>

                              <p className="mt-1.5 text-sm leading-6 text-gray-600">
                                {entry.text}
                              </p>

                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>
              ) : (
                <div className="p-10 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    !
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-800">
                    No transcript yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                    Start Meeting Capture above and stop the
                    recording when the conversation is complete.
                  </p>

                </div>
              )}

            </section>

            {/* AI ANALYSIS BUTTON */}

            {meeting.transcript &&
            meeting.transcript.length > 0 && (
              <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 sm:p-7">

                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      AI Insights
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-gray-900">
                      Understand the meeting
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      Generate a structured analysis of the
                      conversation, including decisions, tasks,
                      deadlines and personal alerts.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleAnalyzeMeeting
                    }
                    disabled={analyzing}
                    className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analyzing
                      ? "Analyzing..."
                      : meeting.aiAnalysis
                        ? "Analyze Again"
                        : "Analyze Meeting"}
                  </button>

                </div>

              </section>
            )}

            {/* STATUS */}

            {(error || success) && (
              <div className="mt-6">

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && !error && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

              </div>
            )}

            {/* AI RESULTS */}

            {meeting.aiAnalysis && (
              <section className="mt-8">

                <div className="mb-6">

                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    Analysis Results
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-gray-900">
                    Meeting insights
                  </h2>

                </div>

                {/* SUMMARY */}

                {meeting.aiAnalysis.summary && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Summary
                    </p>

                    <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
                      {meeting.aiAnalysis.summary}
                    </p>

                  </div>
                )}

                {/* SPEAKER DISCUSSIONS */}

                {meeting.aiAnalysis
                  .speakerDiscussions?.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <div className="mb-5">

                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Discussion
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        Speaker Discussions
                      </h3>

                    </div>

                    <div className="grid gap-3 md:grid-cols-2">

                      {meeting.aiAnalysis.speakerDiscussions.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={index}
                            className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                          >

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                {item.speaker
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "?"}
                              </div>

                              <h4 className="font-semibold text-gray-900">
                                {item.speaker ||
                                  "Unknown"}
                              </h4>

                            </div>

                            <p className="mt-3 text-sm leading-6 text-gray-600">
                              {item.discussion ||
                                "No discussion details available."}
                            </p>

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

                {/* DECISIONS + PERSONAL ALERTS */}

                <div className="mt-6 grid gap-6 lg:grid-cols-2">

                  {meeting.aiAnalysis.decisions?.length >
                    0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Decisions
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        What was decided
                      </h3>

                      <div className="mt-5 space-y-3">

                        {meeting.aiAnalysis.decisions.map(
                          (
                            decision,
                            index
                          ) => (
                            <div
                              key={index}
                              className="flex gap-3 rounded-xl bg-gray-50 p-4"
                            >

                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                                ✓
                              </span>

                              <p className="text-sm leading-6 text-gray-700">
                                {decision}
                              </p>

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  {meeting.aiAnalysis.personalAlerts?.length >
                    0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">

                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                        Personal Alerts
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        Relevant to you
                      </h3>

                      <div className="mt-5 space-y-3">

                        {meeting.aiAnalysis.personalAlerts.map(
                          (
                            alert,
                            index
                          ) => (
                            <div
                              key={index}
                              className="rounded-xl border border-amber-100 bg-white p-4"
                            >

                              <p className="text-sm leading-6 text-gray-700">
                                {alert}
                              </p>

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

                </div>

                {/* ACTION ITEMS */}

                {meeting.aiAnalysis.actionItems?.length >
                  0 && (
                  <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Tasks
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-gray-900">
                      Action Items
                    </h3>

                    <div className="mt-5 overflow-x-auto">

                      <div className="min-w-150">

                        <div className="grid grid-cols-3 gap-4 border-b border-gray-100 px-4 pb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">

                          <span>
                            Person
                          </span>

                          <span>
                            Task
                          </span>

                          <span>
                            Deadline
                          </span>

                        </div>

                        <div className="divide-y divide-gray-100">

                          {meeting.aiAnalysis.actionItems.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={index}
                                className="grid grid-cols-3 gap-4 px-4 py-4 text-sm"
                              >

                                <span className="font-medium text-gray-800">
                                  {item.person ||
                                    "Unknown"}
                                </span>

                                <span className="text-gray-600">
                                  {item.task ||
                                    "Not specified"}
                                </span>

                                <span className="text-gray-600">
                                  {item.deadline ||
                                    "Not specified"}
                                </span>

                              </div>
                            )
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                )}

                {/* DEADLINES */}

                {meeting.aiAnalysis.deadlines?.length >
                  0 && (
                  <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Deadlines
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-gray-900">
                      Important dates
                    </h3>

                    <div className="mt-5 space-y-3">

                      {meeting.aiAnalysis.deadlines.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={index}
                            className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >

                            <div>

                              <p className="text-sm font-semibold text-gray-800">
                                {item.task ||
                                  "Task not specified"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {item.person ||
                                  "Unknown person"}
                              </p>

                            </div>

                            <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm">
                              {item.deadline ||
                                "Not specified"}
                            </span>

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

              </section>
            )}

          </>
        )}

      </main>
    </div>
  );
}

export default Meeting;