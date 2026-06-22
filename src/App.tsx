import React, { useState, useEffect, useRef, ChangeEvent, MouseEvent, TouchEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Undo,
  Redo,
  Save,
  Upload,
  Camera,
  Sparkles,
  Trash2,
  Smile,
  Type,
  Image as ImageIcon,
  Sliders,
  Download,
  Info,
  Maximize2,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  X,
  Volume2,
  Music,
  Maximize,
  Sparkle
} from "lucide-react";

// Import generated assets safely
import cameraIllustration from "./assets/images/vintage_camera_1782114017856.jpg";
import catStickersSheet from "./assets/images/cat_stickers_1782114036240.jpg";

// Types
interface Sticker {
  id: string;
  type: "emoji" | "stamp" | "sticker-sheet" | "watercolor-cat";
  value: string;
  x: number; // percentage (0-100) on polaroid picture area
  y: number; // percentage (0-100) on polaroid picture area
  scale: number;
  rotation: number;
}

interface Adjustments {
  brightness: number; // 50 to 150 (100 default)
  contrast: number; // 50 to 150 (100 default)
  sepia: number; // 0 to 100 (0 default)
  grain: number; // 0 to 100 (15 default)
  vignette: number; // 0 to 100 (0 default)
  warmth: number; // -50 to 50 (0 default)
}

// Preset Filters
const FILTERS_DATA = [
  { id: "NONE", name: "NONE", colorClass: "bg-stone-100" },
  { id: "CLASSIC_FILM", name: "CLASSIC FILM", colorClass: "bg-[#fddab2]" },
  { id: "WARM_MEMORIES", name: "WARM MEMORIES", colorClass: "bg-[#735a3a]" },
  { id: "OLD", name: "OLD", colorClass: "bg-[#4a4238]" },
  { id: "NOIR", name: "NOIR", colorClass: "bg-neutral-800" },
  { id: "CYANOTYPE", name: "CYA", colorClass: "bg-[#1d2d44]" },
  { id: "GOLDEN_HOUR", name: "GOLDEN HOUR", colorClass: "bg-[#f39c12]" }
];

// Preloaded beautiful retro sample pictures
const SAMPLE_PHOTOS = [
  {
    id: "camera",
    name: "Classic Watercolor",
    url: cameraIllustration,
    author: "Memoir Watercolor"
  },
  {
    id: "retro-car",
    name: "Golden Hour Wheels",
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    author: "C. Campbell"
  },
  {
    id: "cassette",
    name: "1980s Soundwaves",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    author: "Retro Vibe"
  },
  {
    id: "analog-nature",
    name: "Ethereal Ferns",
    url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    author: "A. Leaf"
  },
  {
    id: "classic-neon",
    name: "Midnight Diner",
    url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
    author: "Neon Nights"
  }
];

// Aesthetic vintage stickers/stamps
const STAMP_PRESETS = [
  "MEMOIR", "APPROVED", "EST. 1984", "LUCKY CAT", "SOULFUL", "LOST TIME", "ALIVE", "SWEETS", "EXPOSURE"
];

const EMOJI_PRESETS = [
  "🐱", "😻", "😽", "🐾", "☀️", "🌈", "🌸", "🍕", "🍦", "✨", "🎈", "📷", "📼", "🍄", "🧸",
  "🌹", "🌷", "🍃", "🍋", "🍓", "🍉", "🍩", "🍿", "☕", "🍺", "🥂", "🎨", "🎭", "🎸", "🎧",
  "🔮", "💫", "⭐", "🌙", "☁️", "⚡", "🔥", "❤️", "💖", "🧸", "✉️", "🔑", "🌻", "🌿", "🌊"
];

// Default Adjustment values
const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  sepia: 0,
  grain: 20,
  vignette: 10,
  warmth: 0,
};

// Slices watercolor cat stickers sheet (4 cols by 3 rows grid)
const getRowColFromCatValue = (value: string) => {
  const match = value.match(/cat-(\d+)/);
  if (!match) return { row: 0, col: 0 };
  const num = parseInt(match[1], 10) - 1; // 0 to 11
  const row = Math.floor(num / 4);
  const col = num % 4;
  return { row, col };
};

// Config for Polaroid aspect ratios
const ASPECT_RATIO_CONFIGS = {
  "4:5": {
    frameClass: "aspect-[4/5] w-[85%] md:w-[75%]",
    imgClass: "aspect-[430/435]"
  },
  "1:1": {
    frameClass: "aspect-[1/1.18] w-[80%] md:w-[70%]",
    imgClass: "aspect-[1/1]"
  },
  "3:4": {
    frameClass: "aspect-[3/4] w-[80%] md:w-[70%]",
    imgClass: "aspect-[3/3.3]"
  },
  "9:16": {
    frameClass: "aspect-[9/16.5] w-[60%] md:w-[48%]",
    imgClass: "aspect-[9/13.5]"
  }
};

export default function App() {
  // Image states
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"FILTERS" | "ADJUST" | "STICKERS" | "FRAMES" | "TEXT">("FILTERS");
  
  // Edits states
  const [selectedFilter, setSelectedFilter] = useState<string>("NONE");
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS });
  
  // Frame customization: "CLASSIC" | "FILMSTRIP" | "CARDBOARD" | "MUSEUM"
  const [frameType, setFrameType] = useState<"CLASSIC" | "FILMSTRIP" | "CARDBOARD" | "MUSEUM">("CLASSIC");
  
  // Aspect customizer state
  const [aspectRatio, setAspectRatio] = useState<"4:5" | "1:1" | "3:4" | "9:16">("4:5");

  // Sticker placements
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  
  // Text state
  const [captionText, setCaptionText] = useState<string>("EST. 1984");
  const [captionFont, setCaptionFont] = useState<"handwritten" | "typewriter" | "technical">("handwritten");
  const [storyText, setStoryText] = useState<string>("Capture or Upload a Memory");

  // Camera capture modal / states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [isCameraMirrored, setIsCameraMirrored] = useState(true);

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [openAdjustDrawer, setOpenAdjustDrawer] = useState(false);
  const [stickerDragState, setStickerDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    startStickerX: number;
    startStickerY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // Save state helper for undo/redo
  const saveStateToUndo = () => {
    const currentState = {
      image,
      selectedFilter,
      adjustments: { ...adjustments },
      frameType,
      aspectRatio,
      stickers: JSON.parse(JSON.stringify(stickers)),
      captionText,
      captionFont,
      storyText
    };
    setUndoStack(prev => [...prev.slice(-30), currentState]); // Keep max 30
    setRedoStack([]); // Clear redo
  };

  const executeUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    
    // Save current to redo stack
    const current = {
      image,
      selectedFilter,
      adjustments: { ...adjustments },
      frameType,
      aspectRatio,
      stickers: JSON.parse(JSON.stringify(stickers)),
      captionText,
      captionFont,
      storyText
    };
    setRedoStack(prev => [...prev, current]);

    // Apply previous
    setImage(previous.image);
    setSelectedFilter(previous.selectedFilter);
    setAdjustments(previous.adjustments);
    setFrameType(previous.frameType);
    if (previous.aspectRatio) setAspectRatio(previous.aspectRatio);
    setStickers(previous.stickers);
    setCaptionText(previous.captionText);
    setCaptionFont(previous.captionFont);
    setStoryText(previous.storyText);

    // Filter out last element from undo
    setUndoStack(prev => prev.slice(0, -1));
  };

  const executeRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];

    // Save current to undo
    const current = {
      image,
      selectedFilter,
      adjustments: { ...adjustments },
      frameType,
      aspectRatio,
      stickers: JSON.parse(JSON.stringify(stickers)),
      captionText,
      captionFont,
      storyText
    };
    setUndoStack(prev => [...prev, current]);

    // Apply next
    setImage(next.image);
    setSelectedFilter(next.selectedFilter);
    setAdjustments(next.adjustments);
    setFrameType(next.frameType);
    if (next.aspectRatio) setAspectRatio(next.aspectRatio);
    setStickers(next.stickers);
    setCaptionText(next.captionText);
    setCaptionFont(next.captionFont);
    setStoryText(next.storyText);

    // Filter out last element from redo
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Drag-and-drop file processing
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      saveStateToUndo();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setOriginalImage(event.target.result as string);
          setStoryText("Imported on " + new Date().toLocaleDateString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Launch pre-stocked sample picture
  const handleSelectSample = (sampleUrl: string, sampleTitle: string) => {
    saveStateToUndo();
    setImage(sampleUrl);
    setOriginalImage(sampleUrl);
    setStoryText(`Preserved collection: ${sampleTitle}`);
  };

  // Real Camera capture engine
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacingMode } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Could not access camera in this environment. Please try uploading a file!");
      setIsCameraActive(false);
    }
  };

  const toggleCameraFacingMode = async () => {
    const newMode = cameraFacingMode === "user" ? "environment" : "user";
    setCameraFacingMode(newMode);
    
    // Auto mirror: typically, we mirror the user (selfie) but do not mirror the back camera
    setIsCameraMirrored(newMode === "user");

    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera flip lens failed", err);
      }
    }
  };

  const toggleCameraMirror = () => {
    setIsCameraMirrored(prev => !prev);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        saveStateToUndo();
        if (isCameraMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImage(dataUrl);
        setOriginalImage(dataUrl);
        setStoryText("Camera snap: " + new Date().toLocaleTimeString());
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Trigger Gemini Nostalgic AI captioning
  const triggerAICaption = async () => {
    if (!image) {
      alert("Please select or capture a photo first!");
      return;
    }
    saveStateToUndo();
    setIsAnalyzing(true);
    try {
      // Isolate Base64 payload
      const base64Index = image.indexOf("base64,");
      const base64Data = base64Index !== -1 ? image.substring(base64Index + 7) : image;
      const mimeType = image.startsWith("data:") ? image.substring(5, image.indexOf(";")) : "image/jpeg";

      const response = await fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, mimeType })
      });

      if (!response.ok) {
        throw new Error("Failed to contact server caption route");
      }

      const data = await response.json();
      if (data.caption) {
        setCaptionText(data.caption);
        setCaptionFont("handwritten");
      }
      if (data.story) {
        setStoryText(data.story);
      }
    } catch (error) {
      console.error("Nostalgic AI captioning error:", error);
      // Fallback
      setCaptionText("Chasing Golden Lights");
      setStoryText("A perfect chemical snapshot preserved forever. Grain is suspended like gold dust, weaving a quiet dialogue between memory and light.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter application styling
  const getFilterStyle = () => {
    let baseFilter = "";
    switch (selectedFilter) {
      case "CLASSIC_FILM":
        baseFilter = "sepia(0.35) saturate(1.2) contrast(0.9) brightness(1.05) hue-rotate(-8deg)";
        break;
      case "WARM_MEMORIES":
        baseFilter = "sepia(0.6) saturate(0.95) contrast(0.85) brightness(0.98) hue-rotate(12deg)";
        break;
      case "OLD":
        baseFilter = "sepia(0.75) grayscale(0.2) saturate(0.65) contrast(0.9) brightness(0.95)";
        break;
      case "NOIR":
        baseFilter = "grayscale(1) contrast(1.4) brightness(0.95)";
        break;
      case "CYANOTYPE":
        baseFilter = "sepia(0.25) saturate(0.8) hue-rotate(190deg) brightness(1.05) contrast(1.15)";
        break;
      case "GOLDEN_HOUR":
        baseFilter = "saturate(1.45) sepia(0.2) brightness(1.05) contrast(0.95) hue-rotate(-5deg)";
        break;
      default:
        baseFilter = "none";
    }

    const brightnessVal = adjustments.brightness / 100;
    const contrastVal = adjustments.contrast / 100;
    const sepiaVal = adjustments.sepia / 100;
    const warmthVal = adjustments.warmth; // Can translate to warmth filters dynamically

    let warmthFilter = "";
    if (warmthVal > 0) {
      warmthFilter = `sepia(${warmthVal / 100})`;
    } else if (warmthVal < 0) {
      warmthFilter = `hue-rotate(${warmthVal * 0.3}deg) saturate(${1 + Math.abs(warmthVal) / 100})`;
    }

    return `${baseFilter} brightness(${brightnessVal}) contrast(${contrastVal}) sepia(${sepiaVal || "0"}) ${warmthFilter}`.trim();
  };

  // Sticker dragging engine
  const handleStickerMouseDown = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setActiveStickerId(id);
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;

    setStickerDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      startStickerX: sticker.x,
      startStickerY: sticker.y
    });
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!stickerDragState || !imageContainerRef.current) return;

    const bounds = imageContainerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - stickerDragState.startX) / bounds.width * 100;
    const deltaY = (e.clientY - stickerDragState.startY) / bounds.height * 100;

    setStickers(prev =>
      prev.map(s => {
        if (s.id === stickerDragState.id) {
          // Keep within logical boundaries
          const newX = Math.min(100, Math.max(0, stickerDragState.startStickerX + deltaX));
          const newY = Math.min(100, Math.max(0, stickerDragState.startStickerY + deltaY));
          return { ...s, x: newX, y: newY };
        }
        return s;
      })
    );
  };

  const handleGlobalMouseUp = () => {
    if (stickerDragState) {
      saveStateToUndo();
      setStickerDragState(null);
    }
  };

  // Touch handlers for mobile
  const handleStickerTouchStart = (id: string, e: TouchEvent) => {
    e.stopPropagation();
    setActiveStickerId(id);
    const sticker = stickers.find(s => s.id === id);
    if (!sticker || e.touches.length === 0) return;

    setStickerDragState({
      id,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startStickerX: sticker.x,
      startStickerY: sticker.y
    });
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (!stickerDragState || !imageContainerRef.current || e.touches.length === 0) return;

    const bounds = imageContainerRef.current.getBoundingClientRect();
    const deltaX = (e.touches[0].clientX - stickerDragState.startX) / bounds.width * 100;
    const deltaY = (e.touches[0].clientY - stickerDragState.startY) / bounds.height * 100;

    setStickers(prev =>
      prev.map(s => {
        if (s.id === stickerDragState.id) {
          const newX = Math.min(100, Math.max(0, stickerDragState.startStickerX + deltaX));
          const newY = Math.min(100, Math.max(0, stickerDragState.startStickerY + deltaY));
          return { ...s, x: newX, y: newY };
        }
        return s;
      })
    );
  };

  useEffect(() => {
    if (stickerDragState) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
      window.addEventListener("touchend", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [stickerDragState]);

  // Operations for stickers
  const placeSticker = (type: "emoji" | "stamp" | "sticker-sheet" | "watercolor-cat", value: string) => {
    saveStateToUndo();
    const newSticker: Sticker = {
      id: "sticker_" + Date.now(),
      type,
      value,
      x: 40 + Math.random() * 10,
      y: 40 + Math.random() * 10,
      scale: 1,
      rotation: Math.floor(Math.random() * 20) - 10
    };
    setStickers(prev => [...prev, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  const removeSticker = (id: string) => {
    saveStateToUndo();
    setStickers(prev => prev.filter(s => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  const rotateSticker = (id: string) => {
    saveStateToUndo();
    setStickers(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, rotation: (s.rotation + 45) % 360 };
      }
      return s;
    }));
  };

  const changeScale = (id: string, multiplier: number) => {
    saveStateToUndo();
    setStickers(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, scale: Math.min(2.5, Math.max(0.4, s.scale + multiplier)) };
      }
      return s;
    }));
  };

  // HTML Canvas compositing export engine (SAVE/DOWNLOAD)
  const downloadArt = async () => {
    if (!image) {
      alert("No image to download yet. Try upload or select a snapshot!");
      return;
    }
    setIsSaving(true);
    
    try {
      // Create a canvas with high polaroid composition resolution (e.g. 1000x1250)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scaleFactor = 2; // For crystal sharp output
      
      let baseW = 500;
      let baseH = 625;
      
      let px = 35 * scaleFactor;
      let py = 35 * scaleFactor;
      let pw = 430 * scaleFactor;
      let ph = 435 * scaleFactor;

      if (aspectRatio === "1:1") {
        baseW = 500;
        baseH = 575;
        px = 35 * scaleFactor;
        py = 35 * scaleFactor;
        pw = 430 * scaleFactor;
        ph = 430 * scaleFactor;
      } else if (aspectRatio === "3:4") {
        baseW = 469;
        baseH = 625;
        px = 34.5 * scaleFactor;
        py = 35 * scaleFactor;
        pw = 400 * scaleFactor;
        ph = 440 * scaleFactor;
      } else if (aspectRatio === "9:16") {
        baseW = 351;
        baseH = 625;
        px = 30.5 * scaleFactor;
        py = 35 * scaleFactor;
        pw = 290 * scaleFactor;
        ph = 450 * scaleFactor;
      }

      canvas.width = baseW * scaleFactor;
      canvas.height = baseH * scaleFactor;

      // Draw background (frame color dependent)
      ctx.fillStyle = frameType === "CLASSIC" ? "#ffffff" : 
                      frameType === "FILMSTRIP" ? "#121212" : 
                      frameType === "CARDBOARD" ? "#d0c3ab" : "#e3d9c6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (frameType === "MUSEUM") {
        // Draw double gold museum frame border
        ctx.strokeStyle = "#8b7500";
        ctx.lineWidth = 14 * scaleFactor;
        ctx.strokeRect(7 * scaleFactor, 7 * scaleFactor, canvas.width - 14 * scaleFactor, canvas.height - 14 * scaleFactor);
        ctx.strokeStyle = "#b8860b";
        ctx.lineWidth = 4 * scaleFactor;
        ctx.strokeRect(18 * scaleFactor, 18 * scaleFactor, canvas.width - 36 * scaleFactor, canvas.height - 36 * scaleFactor);
      }

      // Load original image safely
      const imgObj = new Image();
      imgObj.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        imgObj.onload = () => resolve();
        imgObj.onerror = () => reject(new Error("Failed to load export image"));
        imgObj.src = image;
      });

      // Apply CSS-matched vintage lookup on canvas context!
      const filterStr = getFilterStyle();
      ctx.filter = filterStr;

      // Draw image centering inside clip
      ctx.drawImage(imgObj, px, py, pw, ph);

      // Reset filters so stickers, frames, text are not sepia/darkened
      ctx.filter = "none";

      // Draw grain layer
      if (adjustments.grain > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.06)";
        const grainAmt = (adjustments.grain / 100) * 15;
        for (let i = 0; i < grainAmt * 60; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
          const gx = px + Math.random() * pw;
          const gy = py + Math.random() * ph;
          const gw = (1 + Math.random() * 2) * scaleFactor;
          ctx.fillRect(gx, gy, gw, gw);
        }
      }

      // Draw vignette shading inside photo field
      if (adjustments.vignette > 0) {
        const gradient = ctx.createRadialGradient(
          px + pw / 2, py + ph / 2, ph / 3,
          px + pw / 2, py + ph / 2, ph / 1.3
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, `rgba(10,8,0,${(adjustments.vignette / 100) * 0.45})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, pw, ph);
      }

      // Draw filmstrip perforations if selected
      if (frameType === "FILMSTRIP") {
        ctx.fillStyle = "#ffffff";
        const bulletCount = 8;
        const squareSize = 8 * scaleFactor;
        const marginX = 14 * scaleFactor;
        for (let i = 0; i < bulletCount; i++) {
          const dy = py + 15 * scaleFactor + (i * ph) / bulletCount;
          ctx.fillRect(marginX, dy, squareSize, squareSize);
          ctx.fillRect(canvas.width - marginX - squareSize, dy, squareSize, squareSize);
        }
      }

      // Draw stickers
      for (const sticker of stickers) {
        const sx = px + (sticker.x / 100) * pw;
        const sy = py + (sticker.y / 100) * ph;
        const size = 38 * sticker.scale * scaleFactor;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate((sticker.rotation * Math.PI) / 180);

        if (sticker.type === "emoji") {
          ctx.font = `${size}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(sticker.value, 0, 0);
        } else if (sticker.type === "stamp") {
          ctx.font = `bold ${10 * sticker.scale * scaleFactor}px "Space Grotesk"`;
          ctx.fillStyle = "#ba1a1a"; // deep ink red
          ctx.strokeStyle = "rgba(186, 26, 26, 0.4)";
          ctx.lineWidth = 1 * scaleFactor;
          ctx.strokeRect(-size / 2, -14 * scaleFactor, size, 22 * scaleFactor);
          ctx.textAlign = "center";
          ctx.fillText(sticker.value, 0, 0);
        } else if (sticker.type === "watercolor-cat") {
          const stickerImg = new Image();
          stickerImg.crossOrigin = "anonymous";
          stickerImg.src = catStickersSheet;
          await new Promise<void>((res) => {
            if (stickerImg.complete) res();
            else {
              stickerImg.onload = () => res();
              stickerImg.onerror = () => res();
            }
          });

          const sw = stickerImg.naturalWidth || 1024;
          const sh = stickerImg.naturalHeight || 768;
          const subW = sw / 4; // 4 columns
          const subH = sh / 3; // 3 rows

          const { row, col } = getRowColFromCatValue(sticker.value);
          const sourceX = col * subW;
          const sourceY = row * subH;

          // Draw cropped section centered at (0, 0)
          ctx.drawImage(
            stickerImg,
            sourceX, sourceY, subW, subH,
            -size, -size, size * 2, size * 2
          );
        }

        ctx.restore();
      }

      // Draw primary handwritten / typewriter caption text
      ctx.textAlign = "center";
      ctx.fillStyle = frameType === "FILMSTRIP" ? "#ffffff" : "#1f1b10"; // Ink color matching frame
      
      const textY = py + ph + (canvas.height - (py + ph)) / 2 + 3 * scaleFactor;
      if (captionFont === "handwritten") {
        ctx.font = `italic ${14 * scaleFactor}px "Libre Caslon Text"`;
      } else if (captionFont === "typewriter") {
        ctx.font = `${11 * scaleFactor}px "Courier Prime"`;
      } else {
        ctx.font = `bold ${10 * scaleFactor}px "Space Grotesk"`;
      }
      ctx.fillText(captionText.toUpperCase(), canvas.width / 2, textY);

      // Create download trigger redirecting base64
      const compiledUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Memoir_${Date.now()}.png`;
      link.href = compiledUrl;
      link.click();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2600);
    } catch (err) {
      console.error("Export failure:", err);
      alert("Error building download image. Please try again or capture a new photo!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-analog-bg text-analog-on-surface min-h-screen flex flex-col font-mono relative overflow-x-hidden selection:bg-analog-primary-container selection:text-white">
      <div className="grain-overlay"></div>

      {/* Top Header */}
      <header className="bg-analog-bg border-b border-analog-outline-variant/30 sticky top-0 z-50 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={executeUndo}
            disabled={undoStack.length === 0}
            className={`p-2 rounded-full hover:bg-analog-surface-highest/50 transition-colors active:scale-90 ${undoStack.length === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100"}`}
            title="Undo"
          >
            <Undo className="w-5 h-5 text-analog-primary" />
          </button>
          <button
            onClick={executeRedo}
            disabled={redoStack.length === 0}
            className={`p-2 rounded-full hover:bg-analog-surface-highest/50 transition-colors active:scale-90 ${redoStack.length === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100"}`}
            title="Redo"
          >
            <Redo className="w-5 h-5 text-analog-primary" />
          </button>
        </div>

        {/* LOGO */}
        <div className="flex flex-col items-center select-none absolute left-1/2 -translate-x-1/2">
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-analog-primary">
            TINGMEMOIR
          </h1>
          <span className="font-technical text-[9px] tracking-widest text-analog-on-surface-variant/40 -mt-1 uppercase">
            Vintage Chemistry Editor
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Sparkles Button */}
          {image && (
            <button
              onClick={triggerAICaption}
              disabled={isAnalyzing}
              className={`flex items-center gap-1 bg-amber-100/70 border border-amber-200 text-amber-900 active:scale-95 duration-75 px-3 py-1.5 rounded-lg text-xs font-semibold ${isAnalyzing ? "animate-pulse" : ""}`}
            >
              <Sparkles className="w-4 h-4 text-amber-700 fill-amber-700 animate-spin-slow" />
              <span className="hidden sm:inline">AI CAPTION</span>
            </button>
          )}

          {/* SAVE BUTTON */}
          <button
            onClick={downloadArt}
            disabled={isSaving || !image}
            className={`bg-[#5c5b30] text-white hover:bg-[#44431b] hover:shadow-md transition-all font-technical text-xs px-5 py-2 rounded-lg tracking-widest active:scale-95 duration-100 flex items-center gap-1.5 ${!image ? "opacity-40 cursor-not-allowed" : ""}`}
            id="save-button"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col lg:flex-row items-center justify-center p-4 lg:p-6 gap-6 max-w-7xl mx-auto w-full mb-24">
        
        {/* Left Side: Polaroid Board & Sample Slides Tray */}
        <div className="flex-grow flex flex-col items-center justify-center w-full lg:w-3/5 max-w-2xl">
          
          {/* Main Photo Editor Frame Container */}
          <div className="relative w-full aspect-[4/5] flex flex-col items-center justify-center bg-analog-surface-dim/20 border border-analog-outline-variant/20 rounded-2xl overflow-hidden shadow-inner p-4 md:p-6">
            
            {/* Real Video element for active camera snapshot */}
            <AnimatePresence>
              {isCameraActive && (
                <div className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center animate-fade-in">
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-40">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleCameraFacingMode}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md font-technical text-[10px] uppercase font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        title="Flip Front/Back Lens"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Lens: {cameraFacingMode === "user" ? "Selfie" : "Main"}
                      </button>

                      <button
                        onClick={toggleCameraMirror}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md font-technical text-[10px] uppercase font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        title="Toggle Mirrored Output"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Mirror: {isCameraMirrored ? "ON" : "OFF"}
                      </button>
                    </div>

                    <button
                      onClick={stopCamera}
                      className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-md active:scale-90 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: isCameraMirrored ? "scaleX(-1)" : "none" }}
                  ></video>
                  <div className="absolute bottom-8 flex flex-col items-center gap-2 z-40">
                    <button
                      onClick={capturePhoto}
                      className="w-20 h-20 bg-amber-50 rounded-full border-8 border-analog-primary flex items-center justify-center transition-transform active:scale-90 shadow-2xl cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-[#5c5b30] rounded-full"></div>
                    </button>
                    <span className="font-technical text-white text-xs tracking-widest uppercase">Take Snapshot</span>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Polaroid Frame Wrapper */}
            <div 
              ref={containerRef}
              className={`polaroid-frame relative flex flex-col items-center justify-start transition-all duration-300 rotate-1 overflow-visible ${ASPECT_RATIO_CONFIGS[aspectRatio].frameClass} ${
                frameType === "CLASSIC" ? "bg-white text-analog-on-surface" :
                frameType === "FILMSTRIP" ? "bg-stone-900 border-zinc-950 text-white" :
                frameType === "CARDBOARD" ? "bg-[#d0c3ab] border-[#c0b39b]/70 text-[#302010]" :
                "bg-[#fdf3df] border-[#8b7500] border-4 text-[#4c3f31]"
              }`}
              style={{
                borderRadius: frameType === "MUSEUM" ? "12px" : "4px"
              }}
            >
              
              {/* Photo Area Container */}
              <div 
                ref={imageContainerRef}
                className={`bg-[#ebe1cf] w-full overflow-hidden relative border border-analog-outline-variant/10 shadow-inner group transition-all duration-300 ${ASPECT_RATIO_CONFIGS[aspectRatio].imgClass}`}
              >
                
                {image ? (
                  <>
                    {/* Live Image */}
                    <img
                      src={image}
                      alt="Nostalgic snapshot"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all"
                      style={{ filter: getFilterStyle() }}
                    />

                    {/* Film Grain Layer (Opacity matches grain values) */}
                    {adjustments.grain > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none mix-blend-overlay"
                        style={{
                          backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')",
                          opacity: (adjustments.grain / 100) * 0.35
                        }}
                      ></div>
                    )}

                    {/* Vignette Shading Layer */}
                    {adjustments.vignette > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, transparent 40%, rgba(15,12,0,${(adjustments.vignette / 100) * 0.55}) 100%)`
                        }}
                      ></div>
                    )}

                    {/* Floating stickers canvas */}
                    {stickers.map((sticker) => {
                      const isActive = activeStickerId === sticker.id;
                      return (
                        <div
                          key={sticker.id}
                          onMouseDown={(e) => handleStickerMouseDown(sticker.id, e)}
                          onTouchStart={(e) => handleStickerTouchStart(sticker.id, e)}
                          className={`absolute cursor-move select-none flex items-center justify-center ${isActive ? "ring-2 ring-red-500/60 ring-offset-1 ring-offset-white/80 p-1.5" : ""}`}
                          style={{
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                            zIndex: isActive ? 40 : 20
                          }}
                        >
                          {sticker.type === "emoji" ? (
                            <span className="text-3xl filter drop-shadow-[#1f1b10]/20 drop-shadow-md">{sticker.value}</span>
                          ) : sticker.type === "watercolor-cat" ? (
                            /* Watercolor Cat Cutout rendered on preview frame */
                            <div className="w-16 h-16 overflow-hidden rounded bg-transparent select-none pointer-events-none filter drop-shadow-md relative">
                              <img
                                src={catStickersSheet}
                                alt="Watercolor cat cutout"
                                className="absolute max-w-none"
                                style={{
                                  width: "400%",
                                  height: "300%",
                                  left: `-${getRowColFromCatValue(sticker.value).col * 100}%`,
                                  top: `-${getRowColFromCatValue(sticker.value).row * 100}%`
                                }}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="border-2 border-red-700/60 font-semibold px-2.5 py-0.5 text-[#ba1a1a] tracking-widest text-[9px] uppercase font-technical bg-white/95 rounded shadow-sm relative overflow-hidden flex items-center justify-center select-none rotate-2">
                              {/* Slit grunge overlay on vintage stamps */}
                              <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-[#fff8f0]/40 rotate-12"></div>
                              <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-[#fff8f0]/40 -rotate-12"></div>
                              {sticker.value}
                            </div>
                          )}

                          {/* Control handle popup on click */}
                          {isActive && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-stone-900 text-white rounded-lg shadow-xl px-2 py-1 text-[11px] z-50 animate-fade-in divide-x divide-stone-700">
                              <button
                                onClick={(e) => { e.stopPropagation(); changeScale(sticker.id, -0.15); }}
                                className="px-1 hover:text-amber-200"
                                title="Smaller"
                              >
                                -
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); changeScale(sticker.id, 0.15); }}
                                className="px-1.5 hover:text-amber-200"
                                title="Larger"
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); rotateSticker(sticker.id); }}
                                className="px-2 hover:text-amber-200 flex items-center"
                                title="Rotate"
                              >
                                🔄
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}
                                className="px-2 hover:text-red-400 text-red-300 flex items-center"
                                title="Discard"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  /* EMPTY STATE RETRO SELECTION PANEL */
                  <div className="w-full h-full bg-[#fdf3df] flex flex-col items-center justify-center p-6 text-center relative border-dashed border-2 border-analog-outline-variant/40">
                    <div className="w-48 h-48 opacity-85 flex items-center justify-center mb-2">
                      <img
                        src={cameraIllustration}
                        alt="Vintage Camera Drawing"
                        className="w-full h-full object-contain filter drop-shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full max-w-[200px] z-20">
                      <button
                        onClick={() => document.getElementById("polaroid-file-input")?.click()}
                        className="bg-[#5c5b30]/90 text-white hover:bg-[#5c5b30] hover:shadow-xs transition-colors duration-150 font-technical text-[10px] tracking-widest font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        UPLOAD FILE
                      </button>
                      
                      <button
                        onClick={startCamera}
                        className="bg-[#735a3a]/80 text-white hover:bg-[#735a3a] hover:shadow-xs transition-colors duration-150 font-technical text-[10px] tracking-widest font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        TAKE LIVE CAMERA
                      </button>
                    </div>
                  </div>
                )}

                {/* Left/Right Filmstrip Dots decorative */}
                {frameType === "FILMSTRIP" && (
                  <>
                    <div className="absolute left-1.5 top-0 bottom-0 flex flex-col justify-around py-4 opacity-75">
                      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-2.5 h-2.5 bg-black rounded-sm border border-stone-800"></div>)}
                    </div>
                    <div className="absolute right-1.5 top-0 bottom-0 flex flex-col justify-around py-4 opacity-75">
                      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-2.5 h-2.5 bg-black rounded-sm border border-stone-800"></div>)}
                    </div>
                  </>
                )}
              </div>

              {/* Bottom White Label Frame Caption field */}
              <div className="w-full flex-grow flex flex-col items-center justify-center px-4 pt-4 pb-2 text-center select-none">
                <span 
                  className={`tracking-widest ${
                    captionFont === "handwritten" ? "font-serif italic text-[16px]" :
                    captionFont === "typewriter" ? "font-mono text-[13px] font-semibold" :
                    "font-technical text-[10.5px] uppercase font-bold text-analog-on-surface-variant/70"
                  }`}
                >
                  {captionText || "EST. 1984"}
                </span>
              </div>
            </div>

            {/* Ad-Hoc Film strip border edges on main tray sides */}
            <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-around py-4 opacity-10">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-4 h-4 bg-[#1f1b10] rounded-sm"></div>)}
            </div>
            <div className="absolute right-3 top-0 bottom-0 flex flex-col justify-around py-4 opacity-10">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-4 h-4 bg-[#1f1b10] rounded-sm"></div>)}
            </div>

            {/* AI Generator spool loader animation overlay */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-analog-bg/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-8 text-center"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="w-24 h-24 border-8 border-dashed border-[#5c5b30] rounded-full flex items-center justify-center mb-6"
                  >
                    <div className="w-12 h-12 bg-[#735a3a] rounded-full flex items-center justify-center">
                      <Sparkle className="w-5 h-5 text-white animate-pulse" />
                    </div>
                  </motion.div>
                  <h3 className="font-serif text-xl font-bold text-[#44431b] mb-2">Developed With Gemini</h3>
                  <p className="font-mono text-xs max-w-sm text-analog-on-surface-variant/80">
                    Applying chemicals and analyzing pixel gradients. Synthesizing typewriter journal caption based on imagery...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Under-Card Note: Typewriter style journal story block */}
          {storyText && (
            <div className="w-[90%] bg-analog-surface-low border border-analog-outline-variant/30 px-6 py-4 rounded-xl mt-4 text-[#48473c] font-mono text-xs text-center border-dashed leading-relaxed max-w-lg shadow-sm">
              <span className="text-red-700/60 font-bold tracking-widest mr-1 sm:mr-2">CAPTION JOURNAL:</span>
              "{storyText}"
            </div>
          )}

          {/* Tray: Selection of sample photos Slides */}
          <div className="w-full mt-6">
            <h4 className="font-technical font-semibold text-[10.5px] uppercase tracking-widest text-[#48473c]/50 mb-3 text-center">
              Retro Slides Collection
            </h4>
            <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 px-4 scrollbar-none">
              {SAMPLE_PHOTOS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample.url, sample.name)}
                  className="w-14 h-14 rounded-lg overflow-hidden border border-analog-outline-variant/50 hover:border-[#5c5b30] transition-colors focus:outline-none flex-shrink-0 active:scale-95"
                  title={`${sample.name} - by ${sample.author}`}
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Tab Panel - Customizers Panel */}
        <div className="w-full lg:w-2/5 flex flex-col bg-analog-surface border border-analog-outline-variant/40 rounded-2xl h-[520px] overflow-hidden shadow-sm">
          
          {/* Active Tab Panel Body */}
          <div className="flex-grow p-5 overflow-y-auto bg-analog-surface-low">
            
            {activeTab === "FILTERS" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="font-serif font-bold text-lg text-analog-primary">Film Lookup Tones</h3>
                  <p className="font-mono text-xs text-analog-on-surface-variant/70 mt-1">
                    Select authentic mineral emulsion recipes for nostalgic silver grading profiles.
                  </p>
                </div>
                
                {/* Filters Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {FILTERS_DATA.map((filt) => (
                    <button
                      key={filt.id}
                      onClick={() => {
                        saveStateToUndo();
                        setSelectedFilter(filt.id);
                      }}
                      className={`relative flex flex-col items-start p-3 rounded-xl border transition-all text-left group overflow-hidden ${
                        selectedFilter === filt.id
                          ? "border-[#5c5b30] bg-[#5c5b30]/10"
                          : "border-analog-outline-variant/40 hover:border-analog-outline bg-white hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-4">
                        <span className="font-technical text-[10px] tracking-widest uppercase font-bold text-analog-on-surface-variant">
                          {filt.name}
                        </span>
                        {selectedFilter === filt.id && (
                          <div className="w-4 h-4 rounded-full bg-[#5c5b30] flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      
                      {/* Live filter tone swatch color dots */}
                      <div className="flex gap-1.5 mt-auto">
                        <div className={`w-5 h-5 rounded-full border border-stone-200 ${filt.colorClass}`}></div>
                        <div className="w-5 h-5 rounded-full border border-stone-200 bg-[#ebe1cf]"></div>
                        <div className="w-5 h-5 rounded-full border border-stone-200 bg-[#1f1b10]"></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "ADJUST" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="font-serif font-bold text-lg text-analog-primary">Mechanical Dials</h3>
                  <p className="font-mono text-xs text-analog-on-surface-variant/70 mt-1">
                    Set mechanical values to alter temperature and vignette shading.
                  </p>
                </div>

                {/* Dial Sliders Block */}
                <div className="space-y-5 pt-3">
                  {/* Brightness */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-xs tracking-wider">
                      <span>BRIGHTNESS</span>
                      <span className="font-mono">{adjustments.brightness}%</span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={adjustments.brightness}
                        onChange={(e) => {
                          setAdjustments(prev => ({ ...prev, brightness: parseInt(e.target.value) }));
                        }}
                        className="w-full accent-[#5c5b30] h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Contrast */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-xs tracking-wider">
                      <span>CONTRAST</span>
                      <span className="font-mono">{adjustments.contrast}%</span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={adjustments.contrast}
                        onChange={(e) => {
                          setAdjustments(prev => ({ ...prev, contrast: parseInt(e.target.value) }));
                        }}
                        className="w-full accent-[#5c5b30] h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Warmth */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-xs tracking-wider">
                      <span>TEMPERATURE COATING</span>
                      <span className="font-mono">{adjustments.warmth > 0 ? `+${adjustments.warmth}` : adjustments.warmth}</span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={adjustments.warmth}
                        onChange={(e) => {
                          setAdjustments(prev => ({ ...prev, warmth: parseInt(e.target.value) }));
                        }}
                        className="w-full accent-[#735a3a] h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Vignette */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-xs tracking-wider">
                      <span>VIGNETTE COATING</span>
                      <span className="font-mono">{adjustments.vignette}%</span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={adjustments.vignette}
                        onChange={(e) => {
                          setAdjustments(prev => ({ ...prev, vignette: parseInt(e.target.value) }));
                        }}
                        className="w-full accent-stone-700 h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Silver Grain */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-xs tracking-wider">
                      <span>SILVER HALIDE GRAIN</span>
                      <span className="font-mono">{adjustments.grain}%</span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={adjustments.grain}
                        onChange={(e) => {
                          setAdjustments(prev => ({ ...prev, grain: parseInt(e.target.value) }));
                        }}
                        className="w-full accent-[#4c3f31] h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => {
                      saveStateToUndo();
                      setAdjustments({ ...DEFAULT_ADJUSTMENTS });
                    }}
                    className="w-full text-center py-2.5 text-xs text-red-800 hover:bg-red-50 hover:border-red-200 border border-transparent font-technical uppercase font-bold tracking-widest rounded-lg transition-colors cursor-pointer"
                  >
                    RESET DIAL DEFAULTS
                  </button>
                </div>
              </div>
            )}

            {activeTab === "STICKERS" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="font-serif font-bold text-lg text-analog-primary">Retro Scrapbook Stamps</h3>
                  <p className="font-mono text-xs text-analog-on-surface-variant/70 mt-1">
                    Press digital adhesive stamps onto your photograph frame.
                  </p>
                </div>

                {/* Adhesive stamp list selectors */}
                <div className="space-y-4 pt-2">
                  <h4 className="font-technical text-[9.5px] uppercase tracking-widest text-[#4c3f31]/60 font-semibold mb-2">Vintage Ink Stamps</h4>
                  <div className="flex flex-wrap gap-2">
                    {STAMP_PRESETS.map((stamp) => (
                      <button
                        key={stamp}
                        onClick={() => placeSticker("stamp", stamp)}
                        className="border border-[#ba1a1a]/50 text-[#ba1a1a] hover:bg-red-50 bg-white font-technical uppercase text-[9px] tracking-widest font-bold px-3 py-1.5 rounded transition-all active:scale-95 cursor-pointer shadow-2xs rotate-1 hover:rotate-0"
                      >
                        {stamp}
                      </button>
                    ))}
                  </div>

                  <h3 className="font-technical text-[9.5px] uppercase tracking-widest text-[#4c3f31]/60 font-semibold mb-2">Cute Kitten & Emoji Icons</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => placeSticker("emoji", emoji)}
                        className="flex items-center justify-center h-11 text-2xl hover:bg-white border border-transparent hover:border-analog-outline-variant/40 bg-stone-100/40 rounded-xl transition-all active:scale-90 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "FRAMES" && (
              <div className="space-y-6 animate-fade-in">
                {/* Canvas Aspect Ratios Selection */}
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-lg text-analog-primary">Canvas Ratios</h3>
                  <p className="font-mono text-xs text-analog-on-surface-variant/70 mt-1">
                    Select the physical proportions for your Polaroid snapshot craft.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {[
                      { id: "4:5", name: "Classic 4:5" },
                      { id: "1:1", name: "Square 1:1" },
                      { id: "3:4", name: "Standard 3:4" },
                      { id: "9:16", name: "Vertical 9:16" }
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => {
                          saveStateToUndo();
                          setAspectRatio(ratio.id as any);
                        }}
                        className={`py-2 px-1 text-center rounded-xl border text-[10px] font-technical uppercase font-bold tracking-wider transition-all cursor-pointer ${
                          aspectRatio === ratio.id
                            ? "border-[#5c5b30] bg-[#5c5b30] text-amber-50 shadow-md scale-[1.02]"
                            : "border-analog-outline-variant/30 bg-white hover:border-analog-outline text-analog-on-surface hover:bg-stone-50"
                        }`}
                      >
                        {ratio.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-analog-outline-variant/20 pt-1"></div>

                <div>
                  <h3 className="font-serif font-bold text-lg text-analog-primary">Cartridge Bezels</h3>
                  <p className="font-mono text-xs text-analog-on-surface-variant/70 mt-1">
                    Select material styles of vintage cardstocks and negatives.
                  </p>
                </div>

                {/* Frames selector cards */}
                <div className="space-y-3 pt-2">
                  {[
                    { id: "CLASSIC", title: "PREMIUM CLASSIC LAB", detail: "Bright white offset heavy board stock with est. captions (est 1984)" },
                    { id: "FILMSTRIP", title: "EXPOSURE NEGATIVES STRIP", detail: "Sleek vertical perforation borders, deep acetate noir design" },
                    { id: "CARDBOARD", title: "RAW SCRAPBOOK CRAFT", detail: "Fibre textured brown natural cardboard paper, organic rustic tone" },
                    { id: "MUSEUM", title: "EXHIBITION WOOD EMBELLISHED", detail: "Lidded gold trims and wood border edges matching art museum mounts" }
                  ].map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => {
                        saveStateToUndo();
                        setFrameType(frame.id as any);
                      }}
                      className={`w-full flex items-center p-3 rounded-xl border text-left gap-3 transition-colors ${
                        frameType === frame.id
                          ? "border-[#5c5b30] bg-[#5c5b30]/5 shadow-2xs"
                          : "border-analog-outline-variant/30 bg-white hover:border-analog-outline hover:bg-stone-50"
                      }`}
                    >
                      <div className={`w-11 h-14 rounded border flex-shrink-0 flex items-center justify-center ${
                        frame.id === "CLASSIC" ? "bg-white border-stone-200" :
                        frame.id === "FILMSTRIP" ? "bg-stone-900 border-zinc-950 text-white" :
                        frame.id === "CARDBOARD" ? "bg-[#d0c3ab] border-[#c0b39b]/60" :
                        "bg-[#fdf3df] border-[#8b7500] border-2"
                      }`}>
                        <span className="font-technical text-[8px] uppercase tracking-tighter opacity-40">M</span>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <span className="font-technical text-xs tracking-wide uppercase font-bold text-analog-on-surface">
                            {frame.title}
                          </span>
                          {frameType === frame.id && (
                            <div className="w-4 h-4 rounded-full bg-[#5c5b30] flex items-center justify-center text-white flex-shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-analog-on-surface-variant/70 mt-0.5 leading-relaxed">
                          {frame.detail}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "TEXT" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="font-serif font-bold text-lg text-analog-primary">Cartridge Captions</h3>
                  <p className="font-mono text-xs text-analog-on-surface-variant/70 mt-1">
                    Label bottom of the photograph using fine typewriter letters or script.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="font-technical text-[10px] uppercase tracking-wider text-analog-on-surface-variant font-semibold">
                      Caption text (under 24 characters)
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={captionText}
                      onChange={(e) => {
                        setCaptionText(e.target.value);
                      }}
                      className="w-full bg-white border border-analog-outline-variant/50 rounded-xl px-4 py-3 text-xs font-mono tracking-wide focus:outline-none focus:border-[#5c5b30] focus:ring-1 focus:ring-[#5c5b30]"
                      placeholder="EST. 1984"
                    />
                  </div>

                  {/* Font picker */}
                  <div className="space-y-2">
                    <label className="font-technical text-[10px] uppercase tracking-wider text-analog-on-surface-variant font-semibold">
                      Typography Pen
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "handwritten", name: "SCRIBED" },
                        { id: "typewriter", name: "TYPED" },
                        { id: "technical", name: "STAMPED" }
                      ].map((font) => (
                        <button
                          key={font.id}
                          onClick={() => {
                            saveStateToUndo();
                            setCaptionFont(font.id as any);
                          }}
                          className={`py-2 rounded-lg border text-xs text-center font-technical font-semibold transition-all ${
                            captionFont === font.id
                              ? "bg-[#5c5b30] text-white border-[#5c5b30]"
                              : "bg-white text-analog-on-surface-variant border-analog-outline-variant/40 hover:border-analog-outline"
                          }`}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate AI caption shortcut inside text pane */}
                  {image && (
                    <div className="border border-amber-200/50 bg-amber-50/40 p-4 rounded-xl mt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                          <Sparkles className="w-5 h-5 fill-amber-300 text-amber-700 animate-spin-slow" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-serif font-bold text-xs text-amber-950">Intelligent Nostalgia</h4>
                          <p className="font-mono text-[10.5px] text-amber-900/80 mt-1 leading-relaxed">
                            Analyze image pixels to write a curated narrative caption with Gemini models.
                          </p>
                          <button
                            onClick={triggerAICaption}
                            disabled={isAnalyzing}
                            className="bg-amber-800 text-white hover:bg-amber-900 px-4 py-1.5 rounded-lg text-[10px] font-bold font-technical mt-3 tracking-widest uppercase transition-all"
                          >
                            AI GENERATE CAPTION
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Nav Bar Tabs for customizable features - matching the exact navigation menu look */}
          <nav className="h-20 bg-analog-surface border-t border-analog-outline-variant/30 flex items-center justify-around px-2 py-2">
            {[
              { id: "FILTERS", label: "FILTERS", icon: "filter_vintage" },
              { id: "ADJUST", label: "ADJUST", icon: "tune" },
              { id: "STICKERS", label: "STICKERS", icon: "auto_awesome_motion" },
              { id: "FRAMES", label: "FRAMES", icon: "frame_inspect" },
              { id: "TEXT", label: "TEXT", icon: "title" }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all active:translate-y-0.5 duration-75 text-center focus:outline-none cursor-pointer ${
                    isSelected
                      ? "bg-[#5c5b30]/10 text-[#5c5b30] font-bold"
                      : "text-analog-on-surface-variant opacity-60 hover:opacity-100 hover:text-analog-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                  <span className="font-technical text-[9px] tracking-widest mt-1 font-bold">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </main>

      {/* Upload Actions & Take snapshot FAB Overlay Area */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        
        {/* Real file upload trigger input */}
        <input
          type="file"
          id="polaroid-file-input"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        
        {/* Upload Trigger button */}
        <button
          onClick={() => document.getElementById("polaroid-file-input")?.click()}
          className="w-12 h-12 bg-white text-[#735a3a] flex items-center justify-center rounded-full shadow-lg border border-analog-outline-variant hover:bg-[#fffdfa] transition-all active:translate-y-0.5 duration-75 cursor-pointer hover:shadow-md"
          title="Upload Photograph"
        >
          <Upload className="w-5 h-5" />
        </button>

        {/* Real camera Snapshot trigger button */}
        <button
          onClick={startCamera}
          className="w-14 h-14 bg-[#5c5b30] text-white flex items-center justify-center rounded-full shadow-xl border border-[#44431b] hover:bg-[#44431b] transition-all hover:scale-105 active:scale-95 duration-100 cursor-pointer"
          title="Take custom Snapshot"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {/* Success notification overlay */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#5c5b30] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2.5 z-50 font-technical text-xs tracking-wider"
          >
            <Check className="w-4 h-4 border-2 border-white rounded-full p-0.5" />
            <span>TINGMEMOIR EXPORTED TO DOWNLOADS!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}