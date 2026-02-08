"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";

interface SecureVideoPlayerProps {
    videoUrl: string;
    lessonId: string;
    userEmail?: string;
    className?: string;
}

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
    videoUrl,
    lessonId,
    userEmail,
    className = "",
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);

    // Simple approach: use video URL - only prepend base URL if it's a relative path
    const videoSrc = videoUrl
        ? (videoUrl.startsWith('http') ? videoUrl : `http://localhost:5000${videoUrl}`)
        : "";

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleDurationChange = () => {
            setDuration(video.duration);
            setLoading(false);
        };
        const handleWaiting = () => setLoading(true);
        const handleCanPlay = () => setLoading(false);

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("durationchange", handleDurationChange);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("canplay", handleCanPlay);

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("durationchange", handleDurationChange);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("canplay", handleCanPlay);
        };
    }, []);

    // Prevent right-click on video
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("contextmenu", handleContextMenu);
            return () => container.removeEventListener("contextmenu", handleContextMenu);
        }
    }, []);

    // Disable keyboard shortcuts that could be used to download
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable Ctrl+S, Ctrl+Shift+I, F12, etc.
            if (
                (e.ctrlKey && e.key === "s") ||
                (e.ctrlKey && e.shiftKey && e.key === "I") ||
                e.key === "F12"
            ) {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-lg bg-black ${className}`}
            style={{ userSelect: "none" }}
        >
            {/* Watermark */}
            {userEmail && (
                <div className="pointer-events-none absolute right-4 top-4 z-20 rounded bg-black/50 px-3 py-1 text-xs text-white/70">
                    {userEmail}
                </div>
            )}

            {/* Video Element */}
            {videoSrc && (
                <video
                    ref={videoRef}
                    src={videoSrc}
                    className="w-full"
                    controlsList="nodownload"
                    disablePictureInPicture
                    autoPlay
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            )}

            {/* Loading Spinner */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
            )}

            {/* Custom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="mb-2 w-full cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100
                            }%, #ffffff33 ${(currentTime / duration) * 100}%, #ffffff33 100%)`,
                    }}
                />

                {/* Control Buttons */}
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={togglePlay}
                            className="rounded p-2 hover:bg-white/20"
                            type="button"
                        >
                            {isPlaying ? (
                                <Pause className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5" />
                            )}
                        </button>

                        <button
                            onClick={toggleMute}
                            className="rounded p-2 hover:bg-white/20"
                            type="button"
                        >
                            {isMuted ? (
                                <VolumeX className="h-5 w-5" />
                            ) : (
                                <Volume2 className="h-5 w-5" />
                            )}
                        </button>

                        <span className="text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <button
                        onClick={toggleFullscreen}
                        className="rounded p-2 hover:bg-white/20"
                        type="button"
                    >
                        <Maximize className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Overlay to prevent inspect element */}
            <div className="pointer-events-none absolute inset-0" />
        </div>
    );
};
