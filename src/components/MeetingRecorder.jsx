import { useRef, useState } from "react";

function MeetingRecorder({ meetingId, onTranscriptUpdate }) {
  const [isRecording, setIsRecording] = useState(false);

  const [status, setStatus] = useState(
    "Ready to capture meeting audio."
  );

  const mediaRecorderRef = useRef(null);
  const displayStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  // =====================================================
  // CLEANUP DISPLAY STREAM
  // =====================================================

  const cleanupDisplayStream = () => {
    if (displayStreamRef.current) {
      displayStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      displayStreamRef.current = null;
    }
  };

  // =====================================================
  // START RECORDING
  // =====================================================

  const startRecording = async () => {
    try {
      if (isRecording) {
        return;
      }

      setStatus("Opening screen sharing...");

      const displayStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

      console.log("Display stream:", displayStream);

      const audioTracks = displayStream.getAudioTracks();

      console.log("Audio tracks:", audioTracks);

      if (audioTracks.length === 0) {
        displayStream
          .getTracks()
          .forEach((track) => track.stop());

        setStatus(
          "No audio found. Select the Google Meet tab and enable Share audio."
        );

        return;
      }

      displayStreamRef.current = displayStream;

      const audioStream = new MediaStream(audioTracks);

      chunksRef.current = [];

      let recorder;

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        recorder = new MediaRecorder(audioStream, {
          mimeType: "audio/webm;codecs=opus",
        });
      } else if (
        MediaRecorder.isTypeSupported("audio/webm")
      ) {
        recorder = new MediaRecorder(audioStream, {
          mimeType: "audio/webm",
        });
      } else {
        recorder = new MediaRecorder(audioStream);
      }

      console.log(
        "Recorder MIME type:",
        recorder.mimeType
      );

      mediaRecorderRef.current = recorder;

      // =====================================================
      // AUDIO DATA
      // =====================================================

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // =====================================================
      // RECORDING ERROR
      // =====================================================

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event.error
        );

        setIsRecording(false);

        cleanupDisplayStream();

        setStatus(
          "Recording error occurred. Please try again."
        );
      };

      // =====================================================
      // RECORDING STARTED
      // =====================================================

      recorder.onstart = () => {
        console.log("Recording started");

        setIsRecording(true);

        setStatus(
          "Recording meeting audio... Click Stop Meeting Capture when finished."
        );
      };

      // =====================================================
      // RECORDING STOPPED
      // =====================================================

      recorder.onstop = async () => {
        console.log("Recording stopped");

        setIsRecording(false);

        setStatus(
          "Preparing recorded audio..."
        );

        const audioBlob = new Blob(
          chunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        console.log(
          "Final audio size:",
          audioBlob.size
        );

        cleanupDisplayStream();

        if (audioBlob.size === 0) {
          setStatus("No audio was recorded.");
          return;
        }

        await uploadAudio(audioBlob);
      };

      // =====================================================
      // SCREEN SHARING ENDED
      // =====================================================

      const videoTrack =
        displayStream.getVideoTracks()[0];

      if (videoTrack) {
        videoTrack.addEventListener(
          "ended",
          () => {
            console.log(
              "Screen sharing ended"
            );

            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !==
                "inactive"
            ) {
              mediaRecorderRef.current.stop();
            }
          },
          { once: true }
        );
      }

      // Start recording
      recorder.start(1000);

    } catch (error) {
      console.error(
        "Screen/audio capture error:",
        error
      );

      setIsRecording(false);

      cleanupDisplayStream();

      if (error.name === "NotAllowedError") {
        setStatus(
          "Screen/audio capture permission was cancelled."
        );
      } else if (
        error.name === "AbortError"
      ) {
        setStatus(
          "Screen sharing was cancelled."
        );
      } else {
        setStatus(
          `Unable to start recording: ${
            error.message || "Unknown error"
          }`
        );
      }
    }
  };

  // =====================================================
  // STOP RECORDING
  // =====================================================

  const stopRecording = () => {
    console.log("Stop button clicked");

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // =====================================================
  // UPLOAD AUDIO
  // =====================================================

  const uploadAudio = async (audioBlob) => {
    try {
      setStatus(
        "Uploading meeting audio and generating transcript..."
      );

      const token =
        localStorage.getItem("token");

      if (!token) {
        setStatus(
          "Your session has expired. Please login again."
        );

        return;
      }

      if (!meetingId) {
        setStatus("Meeting ID is missing.");
        return;
      }

      const formData = new FormData();

      formData.append(
        "audio",
        audioBlob,
        "meeting-audio.webm"
      );

      const response = await fetch(
        `${API_URL}/api/meetings/${meetingId}/audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log(
        "Audio/transcription response:",
        data
      );

      // =====================================================
      // SESSION EXPIRED
      // =====================================================

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setStatus(
          "Your session has expired. Please login again."
        );

        return;
      }

      // =====================================================
      // API ERROR
      // =====================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Audio upload failed."
        );
      }

      // =====================================================
      // UPDATE FRONTEND TRANSCRIPT
      // =====================================================

      console.log(
        "Audio transcription completed.",
        data.transcript || []
      );

      if (
        onTranscriptUpdate &&
        Array.isArray(data.transcript)
      ) {
        onTranscriptUpdate(data.transcript);
      }

      // =====================================================
      // TRANSCRIPT RESULT
      // =====================================================

      if (
        Array.isArray(data.transcript) &&
        data.transcript.length > 0
      ) {
        setStatus(
          "Meeting audio transcribed successfully."
        );
      } else {
        setStatus(
          "Audio uploaded, but no transcript entries were generated."
        );
      }

    } catch (error) {
      console.error(
        "Audio/transcription error:",
        error
      );

      setStatus(
        `Transcription failed: ${
          error.message || "Please try again."
        }`
      );
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-2 text-xl font-bold">
        Meeting Audio Capture
      </h2>

      <p className="mb-4 text-sm text-gray-600">
        Capture the actual audio from your
        Google Meet session.
      </p>

      <div className="mb-4 rounded-lg bg-gray-50 p-4">
        <p className="text-sm">
          <strong>Status:</strong>{" "}
          {status}
        </p>
      </div>

      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Start Meeting Capture
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
        >
          Stop Meeting Capture
        </button>
      )}
    </div>
  );
}

export default MeetingRecorder;