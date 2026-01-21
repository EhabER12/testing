"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileVideo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axiosInstance from "@/lib/axios";

interface VideoUploaderProps {
    lessonId: string;
    currentVideoUrl?: string;
    onUploadSuccess: (videoUrl: string) => void;
    onDeleteSuccess: () => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
    lessonId,
    currentVideoUrl,
    onUploadSuccess,
    onDeleteSuccess,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Invalid file type. Please upload MP4, WebM, MOV, or AVI files.";
        }
        if (file.size > MAX_FILE_SIZE) {
            return "File size exceeds 500MB limit.";
        }
        return null;
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = async (file: File) => {
        setError(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        await uploadVideo(file);
    };

    const uploadVideo = async (file: File) => {
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("video", file);

        try {
            const response = await axiosInstance.post(
                `/lms/lessons/${lessonId}/upload-video`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    onUploadProgress: (progressEvent) => {
                        const percent = progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 0;
                        setUploadProgress(percent);
                    },
                }
            );

            if (response.data.success) {
                onUploadSuccess(response.data.data.lesson.videoUrl);
                setError(null);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to upload video";
            setError(errorMessage);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteVideo = async () => {
        if (!confirm("Are you sure you want to delete this video?")) {
            return;
        }

        try {
            const response = await axiosInstance.delete(`/lms/lessons/${lessonId}/video`);
            if (response.data.success) {
                onDeleteSuccess();
                setError(null);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to delete video";
            setError(errorMessage);
        }
    };

    return (
        <div className="space-y-4">
            {!currentVideoUrl && !uploading && (
                <div
                    className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary hover:bg-gray-50"
                        }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="rounded-full bg-primary/10 p-4">
                            <Upload className="h-8 w-8 text-primary" />
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                                Drag and drop your video here, or{" "}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-primary hover:underline"
                                >
                                    browse
                                </button>
                            </p>
                            <p className="text-xs text-gray-500">
                                MP4, WebM, MOV, or AVI (max 500MB)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-medium">Uploading video...</span>
                        <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                </div>
            )}

            {currentVideoUrl && !uploading && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center space-x-3">
                        <div className="rounded-full bg-green-100 p-2">
                            <FileVideo className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Video uploaded successfully</p>
                            <p className="text-xs text-gray-500">{currentVideoUrl}</p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteVideo}
                    >
                        <X className="mr-1 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
};
