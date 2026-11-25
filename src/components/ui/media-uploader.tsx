"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  Film,
  Plus,
  Play,
  Trash2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface MediaUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  videoUrl: string;
  onVideoChange: (videoUrl: string) => void;
  maxImages?: number;
}

export function MediaUploader({
  images,
  onImagesChange,
  videoUrl,
  onVideoChange,
  maxImages = 10,
}: MediaUploaderProps) {
  const [urlInput, setUrlInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [activeTab, setActiveTab] = useState<"images" | "video">("images");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Handle image file selection
  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      setErrorMsg(`Maximum ${maxImages} images reached.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      setErrorMsg(`Only ${availableSlots} more image(s) could be added (limit: ${maxImages}).`);
    }

    const newImages: string[] = [];
    let processed = 0;

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        processed++;
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg("One or more images exceeded 10MB limit.");
        processed++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
        }
        processed++;
        if (processed === filesToProcess.length) {
          onImagesChange([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle URL addition
  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) {
      setErrorMsg(`Maximum ${maxImages} images reached.`);
      return;
    }
    onImagesChange([...images, urlInput.trim()]);
    setUrlInput("");
    setErrorMsg(null);
  };

  // Remove single image
  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  // Handle Video file selection
  const handleVideoFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const file = files[0];
    if (!file.type.startsWith("video/")) {
      setErrorMsg("Please upload a valid video file (MP4, WebM, MOV).");
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      setErrorMsg("Video file is too large (max 40MB). For larger videos, please paste a YouTube or Vimeo link.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onVideoChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSetVideoUrl = () => {
    if (!videoInput.trim()) return;
    onVideoChange(videoInput.trim());
    setVideoInput("");
    setErrorMsg(null);
  };

  const isEmbedVideo = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com");
  };

  return (
    <div className="space-y-3 p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "images"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            Photos & Gallery
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "images" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {images.length}/{maxImages}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "video"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Walkthrough Video
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "video" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {videoUrl ? "1/1" : "0/1"}
            </span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          {activeTab === "images" ? `Max ${maxImages} images` : "1 video walkthrough"}
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: IMAGES */}
      {activeTab === "images" && (
        <div className="space-y-3">
          {/* Upload Drop Zone & URL Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 bg-white ${
                images.length >= maxImages
                  ? "border-slate-200 opacity-60 pointer-events-none"
                  : "border-blue-300 hover:border-blue-500 hover:bg-blue-50/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageFiles(e.target.files)}
              />
              <Upload className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700">
                {images.length >= maxImages ? "Image limit reached" : "Upload Photos from Device"}
              </span>
              <span className="text-[10px] text-slate-400">PNG, JPG, WebP up to 10MB</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">Add Image from Web URL</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/property.jpg"
                  disabled={images.length >= maxImages}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={images.length >= maxImages || !urlInput.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                {maxImages - images.length} slots remaining
              </span>
            </div>
          </div>

          {/* Thumbnail Gallery Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-4/3 bg-slate-100 shadow-2xs"
                >
                  <Image
                    src={img}
                    alt={`Photo ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover"
                  />

                  {/* Cover Badge on first image */}
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-600 text-white shadow-2xs">
                      Cover
                    </span>
                  )}

                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/60 text-white">
                    #{idx + 1}
                  </span>

                  {/* Remove Overlay Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VIDEO */}
      {activeTab === "video" && (
        <div className="space-y-3">
          {!videoUrl ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                onClick={() => videoFileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/40 rounded-xl p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 bg-white"
              >
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleVideoFile(e.target.files)}
                />
                <Film className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-semibold text-slate-700">Upload Walkthrough Video</span>
                <span className="text-[10px] text-slate-400">MP4, WebM up to 40MB (Limit: 1)</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">Link YouTube / Vimeo Video</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleSetVideoUrl}
                    disabled={!videoInput.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Set
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">Supports YouTube, Vimeo, Matterport, or MP4 URL</span>
              </div>
            </div>
          ) : (
            /* Video Attached / Preview */
            <div className="p-3 bg-white border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">Walkthrough Video Attached (1/1)</span>
                </div>
                <button
                  type="button"
                  onClick={() => onVideoChange("")}
                  className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Video
                </button>
              </div>

              {videoUrl.startsWith("data:video") || videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") ? (
                <div className="rounded-lg overflow-hidden bg-black max-h-56 flex items-center justify-center">
                  <video src={videoUrl} controls className="w-full max-h-56 rounded-lg" />
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-sm">{videoUrl}</span>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-purple-600 hover:underline font-semibold shrink-0"
                  >
                    Open Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

