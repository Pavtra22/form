import { useState, useEffect, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { Video, Square, RefreshCw, Clock } from "lucide-react";

const MAX_RECORDING_TIME = 60;

const LivePreview = ({ stream }: { stream: MediaStream | null }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return <div className="flex items-center justify-center h-full text-white">Loading Camera...</div>;
  }

  return <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />; 
};

export function VideoRecorder({ onSave }: { onSave?: (blob: Blob) => void }) {
  const [timeLeft, setTimeLeft] = useState(MAX_RECORDING_TIME);

  // Destructure 'previewStream' here
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl, previewStream } =
    useReactMediaRecorder({ 
      video: true, 
      audio: true,
      onStop: (_blobUrl, blob) => {
        if (onSave && blob) {
          onSave(blob);
        }
      }
    });

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === "recording") {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } 
    return () => clearInterval(interval);
  }, [status, stopRecording]);

  const handleStartRecording = () => {
    setTimeLeft(MAX_RECORDING_TIME);
    startRecording();
  };

  const handleRetake = () => {
    clearBlobUrl();
    setTimeLeft(MAX_RECORDING_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-800">
        
        {/* === VIEW LAYER LOGIC === */}

        {/* 1. If Recording: Show Live Camera */}
        {status === "recording" && (
          <>
             <LivePreview stream={previewStream} />
             
             {/* Overlay: Timer & Badge */}
             <div className="absolute top-4 right-4 flex items-center gap-3 z-10 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-xs font-bold tracking-wider">REC</span>
                </div>
                <div className="w-px h-3 bg-white/20" />
                <span className={`text-xs font-mono font-medium ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </span>
             </div>
          </>
        )}

        {/* 2. If Stopped (and we have video): Show Playback */}
        {status === "stopped" && mediaBlobUrl && (
          <video src={mediaBlobUrl} controls className="w-full h-full object-cover" />
        )}

        {/* 3. If Idle (Not started yet): Show Placeholder or Instructions */}
        {status === "idle" && (
          <div className="text-gray-500 flex flex-col items-center">
             <Video size={48} className="mb-2 opacity-50" />
             <p className="text-sm font-medium">Ready to Record</p>
             <p className="text-xs text-gray-400 mt-1">Camera will open when you click Start</p>
          </div>
        )}
      </div>

      {/* === CONTROLS LAYER === */}
      <div className="flex gap-4">
        {status === "idle" || status === "stopped" ? (
           <button
             type="button"
             onClick={handleStartRecording}
             className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm font-medium"
           >
             <div className="w-3 h-3 bg-white rounded-full" />
             {status === "stopped" ? "Record New" : "Start Recording"}
           </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors shadow-sm font-medium"
          >
            <Square size={16} fill="currentColor" />
            Stop Recording
          </button>
        )}

        {status === "stopped" && (
            <button 
                type="button" 
                onClick={handleRetake}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                title="Clear Video"
            >
                <RefreshCw size={20} />
            </button>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
        <span>Status: <span className="uppercase">{status}</span></span>
        {status !== 'recording' && (
           <>
            <span>|</span>
            <span className="flex items-center gap-1"><Clock size={12}/> 60s Limit</span>
           </>
        )}
      </div>
    </div>
  );
}