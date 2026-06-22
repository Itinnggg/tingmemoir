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
/**
 * Applies CSS-equivalent retro filters and custom adjustments directly to canvas pixel buffer.
 * This runs as a 100% reliable cross-device fallback (safeguards WebKit/iOS constraints on canvas.filter).
 */
function applyManualFilters(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  selectedFilter: string,
  adjustments: Adjustments
) {
  try {
    const imgData = ctx.getImageData(x, y, w, h);
    const data = imgData.data;

    let fSepia = 0;
    let fSaturate = 1;
    let fContrast = 1;
    let fBrightness = 1;
    let fGrayscale = 0;
    let fHueRotate = 0;

    switch (selectedFilter) {
      case "CLASSIC_FILM":
        fSepia = 0.35;
        fSaturate = 1.2;
        fContrast = 0.9;
        fBrightness = 1.05;
        fHueRotate = -8;
        break;
      case "WARM_MEMORIES":
        fSepia = 0.6;
        fSaturate = 0.95;
        fContrast = 0.85;
        fBrightness = 0.98;
        fHueRotate = 12;
        break;
      case "OLD":
        fSepia = 0.75;
        fGrayscale = 0.2;
        fSaturate = 0.65;
        fContrast = 0.9;
        fBrightness = 0.95;
        break;
      case "NOIR":
        fGrayscale = 1.0;
        fContrast = 1.4;
        fBrightness = 0.95;
        break;
      case "CYANOTYPE":
        fSepia = 0.25;
        fSaturate = 0.8;
        fHueRotate = 190;
        fBrightness = 1.05;
        fContrast = 1.15;
        break;
      case "GOLDEN_HOUR":
        fSaturate = 1.45;
        fSepia = 0.2;
        fBrightness = 1.05;
        fContrast = 0.95;
        fHueRotate = -5;
        break;
    }

    const manualBright = adjustments.brightness / 100;
    const manualContrast = adjustments.contrast / 100;
    const manualSepia = adjustments.sepia / 100;
    const warmthVal = adjustments.warmth || 0;

    const totalBrightness = fBrightness * manualBright;
    const totalContrast = fContrast * manualContrast;
    const totalSepia = Math.min(1.0, fSepia + manualSepia);

    const warmthR = warmthVal > 0 ? (warmthVal / 100) * 15 : 0;
    const warmthG = warmthVal > 0 ? (warmthVal / 100) * 8 : (warmthVal / 100) * 5;
    const warmthB = warmthVal < 0 ? (Math.abs(warmthVal) / 100) * 15 : 0;

    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Grayscale
      if (fGrayscale > 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray * fGrayscale + r * (1 - fGrayscale);
        g = gray * fGrayscale + g * (1 - fGrayscale);
        b = gray * fGrayscale + b * (1 - fGrayscale);
      }

      // Saturation
      if (fSaturate !== 1) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * fSaturate;
        g = gray + (g - gray) * fSaturate;
        b = gray + (b - gray) * fSaturate;
      }

      // Simple Hue Rotate
      if (fHueRotate !== 0) {
        if (fHueRotate > 150 && fHueRotate < 210) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray * 0.3;
          g = gray * 0.7;
          b = gray * 1.3;
        } else {
          const shift = fHueRotate / 100;
          if (shift > 0) {
            r = r * (1 - shift) + g * shift;
            g = g * (1 - shift) + b * shift;
          } else {
            const absShift = Math.abs(shift);
            b = b * (1 - absShift) + r * absShift;
            r = r * (1 - absShift) + g * absShift;
          }
        }
      }

      // Sepia
      if (totalSepia > 0) {
        const sr = r * 0.393 + g * 0.769 + b * 0.189;
        const sg = r * 0.349 + g * 0.686 + b * 0.168;
        const sb = r * 0.272 + g * 0.534 + b * 0.131;
        r = sr * totalSepia + r * (1 - totalSepia);
        g = sg * totalSepia + g * (1 - totalSepia);
        b = sb * totalSepia + b * (1 - totalSepia);
      }

      // Brightness
      if (totalBrightness !== 1) {
        r *= totalBrightness;
        g *= totalBrightness;
        b *= totalBrightness;
      }

      // Contrast
      if (totalContrast !== 1) {
        r = (r - 128) * totalContrast + 128;
        g = (g - 128) * totalContrast + 128;
        b = (b - 128) * totalContrast + 128;
      }

      // Warmth
      r += warmthR;
      g += warmthG;
      b += warmthB;

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imgData, x, y);
  } catch (err) {
    console.warn("Pixel matrix filter conversion skipped (most likely CORS on high-res URL):", err);
  }
}

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
  
  // Crop & position states
  const [imageScale, setImageScale] = useState<number>(1);
  const [imageOffsetX, setImageOffsetX] = useState<number>(0);
  const [imageOffsetY, setImageOffsetY] = useState<number>(0);
  const [imageRotation, setImageRotation] = useState<number>(0);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"FILTERS" | "ADJUST" | "STICKERS" | "FRAMES" | "TEXT">("FILTERS");
  
  // Edits states
  const [selectedFilter, setSelectedFilter] = useState<string>("NONE");
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS });
  
  // Frame customization: "CLASSIC" | "FILMSTRIP" | "CARDBOARD" | "MUSEUM"
  const [frameType, setFrameType] = useState<"CLASSIC" | "FILMSTRIP" | "CARDBOARD" | "MUSEUM">("CLASSIC");
  
  // Aspect customizer state
  const [aspectRatio, setAspectRatio] = useState<"4:5" | "1:1" | "3:4" | "9:16">("4:5");

  // Decorative border overlay
const [decorBorder, setDecorBorder] = useState<
  "NONE" | "FLORAL" | "FILM_EDGE" | "BOTANICAL" | "CUTE_DOODLE" | "WASHI"
>("NONE");

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

  const setVideoRef = React.useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }, []);

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
      storyText,
      imageScale,
      imageOffsetX,
      imageOffsetY,
      imageRotation
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
      storyText,
      imageScale,
      imageOffsetX,
      imageOffsetY,
      imageRotation
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
    if (previous.imageScale !== undefined) setImageScale(previous.imageScale);
    if (previous.imageOffsetX !== undefined) setImageOffsetX(previous.imageOffsetX);
    if (previous.imageOffsetY !== undefined) setImageOffsetY(previous.imageOffsetY);
    if (previous.imageRotation !== undefined) setImageRotation(previous.imageRotation);

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
      storyText,
      imageScale,
      imageOffsetX,
      imageOffsetY,
      imageRotation
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
    if (next.imageScale !== undefined) setImageScale(next.imageScale);
    if (next.imageOffsetX !== undefined) setImageOffsetX(next.imageOffsetX);
    if (next.imageOffsetY !== undefined) setImageOffsetY(next.imageOffsetY);
    if (next.imageRotation !== undefined) setImageRotation(next.imageRotation);

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
        baseFilter = "";
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

  // Sticker dragging engine (Unified Pointer Events with setPointerCapture)
  const handleStickerPointerDown = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setActiveStickerId(id);
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;

    // Capture pointers (mouse/touch) natively to prevent gesture conflicts and handle drift smoothly
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("setPointerCapture failed:", err);
    }

    setStickerDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      startStickerX: sticker.x,
      startStickerY: sticker.y
    });
  };

  const handleStickerPointerMove = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (!stickerDragState || stickerDragState.id !== id || !imageContainerRef.current) return;

    const bounds = imageContainerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - stickerDragState.startX) / bounds.width * 100;
    const deltaY = (e.clientY - stickerDragState.startY) / bounds.height * 100;

    setStickers(prev =>
      prev.map(s => {
        if (s.id === id) {
          // Keep within logical boundaries [0, 100]
          const newX = Math.min(100, Math.max(0, stickerDragState.startStickerX + deltaX));
          const newY = Math.min(100, Math.max(0, stickerDragState.startStickerY + deltaY));
          return { ...s, x: newX, y: newY };
        }
        return s;
      })
    );
  };

  const handleStickerPointerUp = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // safe fallback
    }
    if (stickerDragState && stickerDragState.id === id) {
      saveStateToUndo();
      setStickerDragState(null);
    }
  };

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

      // Draw decorative border overlay (on top of everything)
      drawDecorBorder(ctx, canvas.width, canvas.height, scaleFactor);

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

      // Draw image centering inside clip with translations/scaling/rotation
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
      
      ctx.filter = filterStr;

      const cx = px + pw / 2;
      const cy = py + ph / 2;
      ctx.translate(cx, cy);
      ctx.translate((imageOffsetX / 100) * pw, (imageOffsetY / 100) * ph);
      ctx.scale(imageScale, imageScale);
      ctx.rotate((imageRotation * Math.PI) / 180);

      // Math for 'object-fit: cover' behavior on canvas
      const imgW = imgObj.naturalWidth || imgObj.width;
      const imgH = imgObj.naturalHeight || imgObj.height;
      const targetRatio = pw / ph;
      const imgRatio = imgW / imgH;

      let sx = 0;
      let sy = 0;
      let sWidth = imgW;
      let sHeight = imgH;

      if (imgRatio > targetRatio) {
        // Image is wider than target. Fit height, crop width sides.
        sWidth = imgH * targetRatio;
        sx = (imgW - sWidth) / 2;
      } else {
        // Image is taller than target. Fit width, crop height sides.
        sHeight = imgW / targetRatio;
        sy = (imgH - sHeight) / 2;
      }

      ctx.drawImage(imgObj, sx, sy, sWidth, sHeight, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();

      // Reset filters so stickers, frames, text are not sepia/darkened
      ctx.filter = "none";

      // Apply the manual pixel-level filter fallback as a browser-independent backup
      // This ensures 100% accurate results on all platforms (especially older browsers or iOS Safari)
      applyManualFilters(ctx, px, py, pw, ph, selectedFilter, adjustments);

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

      // Draw filmstrip perforations if selected (draw inside the photo area, matching the preview UI)
      if (frameType === "FILMSTRIP") {
        ctx.fillStyle = "#0c0a08"; // Black/dark gray rounded-sm dots
        const bulletCount = 6;     // Match the 6 dots in the UI
        const squareSize = 6 * scaleFactor;
        
        const leftX = px + 6 * scaleFactor; 
        const rightX = px + pw - 6 * scaleFactor - squareSize;

        for (let i = 0; i < bulletCount; i++) {
          const dy = py + 12 * scaleFactor + i * (ph - 24 * scaleFactor) / (bulletCount - 1);
          ctx.fillRect(leftX, dy, squareSize, squareSize);
          ctx.fillRect(rightX, dy, squareSize, squareSize);
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
  

      // ─── Decorative Border Painter ───────────────────────────────────────────────
const drawDecorBorder = (
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  scaleFactor: number
) => {
  if (decorBorder === "NONE") return;

  const S = scaleFactor;
  ctx.save();

  if (decorBorder === "FLORAL") {
    // Corner roses — 4 corners
    const petalColors = ["#e8a0a0", "#f4c6c6", "#d4608a", "#f9dde0"];
    const corners = [
      { cx: 36 * S, cy: 36 * S },
      { cx: canvasW - 36 * S, cy: 36 * S },
      { cx: 36 * S, cy: canvasH - 36 * S },
      { cx: canvasW - 36 * S, cy: canvasH - 36 * S },
    ];
    corners.forEach(({ cx, cy }) => {
      // Leaves
      [0, 90, 180, 270].forEach((angle) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.fillStyle = "#7ab648";
        ctx.beginPath();
        ctx.ellipse(0, -22 * S, 5 * S, 13 * S, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // Petals
      for (let p = 0; p < 5; p++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((p * 72 * Math.PI) / 180);
        ctx.fillStyle = petalColors[p % petalColors.length];
        ctx.beginPath();
        ctx.ellipse(0, -10 * S, 5 * S, 10 * S, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // Center
      ctx.beginPath();
      ctx.arc(cx, cy, 6 * S, 0, Math.PI * 2);
      ctx.fillStyle = "#f9d56e";
      ctx.fill();
    });

    // Thin elegant border line
    ctx.strokeStyle = "#d4608a";
    ctx.lineWidth = 2 * S;
    ctx.setLineDash([6 * S, 4 * S]);
    ctx.strokeRect(20 * S, 20 * S, canvasW - 40 * S, canvasH - 40 * S);
    ctx.setLineDash([]);
  }

  else if (decorBorder === "FILM_EDGE") {
    // Outer thick black film strip border
    ctx.fillStyle = "#0a0a0a";
    // Top strip
    ctx.fillRect(0, 0, canvasW, 28 * S);
    // Bottom strip
    ctx.fillRect(0, canvasH - 28 * S, canvasW, 28 * S);
    // Left strip
    ctx.fillRect(0, 0, 22 * S, canvasH);
    // Right strip
    ctx.fillRect(canvasW - 22 * S, 0, 22 * S, canvasH);

    // Sprocket holes — top & bottom
    ctx.fillStyle = "#f5f0e8";
    const holeW = 14 * S;
    const holeH = 10 * S;
    const holeCount = Math.floor(canvasW / (holeW * 2.5));
    for (let i = 0; i < holeCount; i++) {
      const hx = 18 * S + i * (canvasW - 36 * S) / (holeCount - 1) - holeW / 2;
      // top holes
      ctx.beginPath();
      ctx.roundRect(hx, 9 * S, holeW, holeH, 2 * S);
      ctx.fill();
      // bottom holes
      ctx.beginPath();
      ctx.roundRect(hx, canvasH - 9 * S - holeH, holeW, holeH, 2 * S);
      ctx.fill();
    }

    // Sprocket holes — left & right sides
    const vHoleCount = Math.floor(canvasH / (holeH * 2.5));
    for (let i = 0; i < vHoleCount; i++) {
      const hy = 18 * S + i * (canvasH - 36 * S) / (vHoleCount - 1) - holeH / 2;
      ctx.beginPath();
      ctx.roundRect(6 * S, hy, holeH, holeW, 2 * S);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(canvasW - 6 * S - holeH, hy, holeH, holeW, 2 * S);
      ctx.fill();
    }

    // Frame number text
    ctx.fillStyle = "#f5f0e8";
    ctx.font = `bold ${8 * S}px monospace`;
    ctx.textAlign = "left";
    ctx.fillText("TINGMEMOIR  ▸  35mm  ▸  ISO 400", 30 * S, 20 * S);
    ctx.textAlign = "right";
    ctx.fillText(`© ${new Date().getFullYear()}`, canvasW - 30 * S, 20 * S);
  }

  else if (decorBorder === "BOTANICAL") {
    // Soft green branch border around all 4 corners
    const drawLeaf = (x: number, y: number, angle: number, size: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `hsl(${100 + Math.random() * 30}, 50%, ${38 + Math.random() * 15}%)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.4, size, 0, 0, Math.PI * 2);
      ctx.fill();
      // Midrib
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1 * S;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.stroke();
      ctx.restore();
    };

    // Top-left cluster
    for (let i = 0; i < 7; i++) {
      drawLeaf(
        20 * S + i * 9 * S,
        14 * S + Math.sin(i) * 6 * S,
        -0.6 + i * 0.15,
        10 * S
      );
    }
    for (let i = 0; i < 5; i++) {
      drawLeaf(
        14 * S + Math.sin(i) * 6 * S,
        20 * S + i * 9 * S,
        -1.2 + i * 0.15,
        10 * S
      );
    }

    // Bottom-right cluster (mirrored)
    for (let i = 0; i < 7; i++) {
      drawLeaf(
        canvasW - 20 * S - i * 9 * S,
        canvasH - 14 * S - Math.sin(i) * 6 * S,
        Math.PI + 0.6 - i * 0.15,
        10 * S
      );
    }
    for (let i = 0; i < 5; i++) {
      drawLeaf(
        canvasW - 14 * S - Math.sin(i) * 6 * S,
        canvasH - 20 * S - i * 9 * S,
        Math.PI + 1.2 - i * 0.15,
        10 * S
      );
    }

    // Thin border
    ctx.strokeStyle = "#5a7a3a";
    ctx.lineWidth = 1.5 * S;
    ctx.setLineDash([4 * S, 3 * S]);
    ctx.strokeRect(18 * S, 18 * S, canvasW - 36 * S, canvasH - 36 * S);
    ctx.setLineDash([]);
  }

  else if (decorBorder === "CUTE_DOODLE") {
    // Stars, hearts, sparkles scattered along border
    const items = [
      { x: 0.05, y: 0.05, icon: "⭐", size: 16 },
      { x: 0.5,  y: 0.02, icon: "💖", size: 14 },
      { x: 0.95, y: 0.05, icon: "✨", size: 16 },
      { x: 0.02, y: 0.5,  icon: "🌸", size: 14 },
      { x: 0.98, y: 0.5,  icon: "🌙", size: 14 },
      { x: 0.05, y: 0.95, icon: "🍭", size: 16 },
      { x: 0.5,  y: 0.98, icon: "🎀", size: 14 },
      { x: 0.95, y: 0.95, icon: "⭐", size: 16 },
      { x: 0.25, y: 0.01, icon: "💫", size: 12 },
      { x: 0.75, y: 0.01, icon: "🌟", size: 12 },
      { x: 0.25, y: 0.99, icon: "🍬", size: 12 },
      { x: 0.75, y: 0.99, icon: "💝", size: 12 },
      { x: 0.01, y: 0.25, icon: "🌷", size: 12 },
      { x: 0.01, y: 0.75, icon: "🦋", size: 12 },
      { x: 0.99, y: 0.25, icon: "🍀", size: 12 },
      { x: 0.99, y: 0.75, icon: "🌺", size: 12 },
    ];
    items.forEach(({ x, y, icon, size }) => {
      ctx.font = `${size * S}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, x * canvasW, y * canvasH);
    });

    // Dotted playful border
    ctx.strokeStyle = "#ff85a1";
    ctx.lineWidth = 2.5 * S;
    ctx.setLineDash([5 * S, 5 * S]);
    ctx.strokeRect(22 * S, 22 * S, canvasW - 44 * S, canvasH - 44 * S);
    ctx.setLineDash([]);
  }

  else if (decorBorder === "WASHI") {
    // Washi tape strips at 4 corners — diagonal colorful tape
    const tapes = [
      { x: 0, y: 0, angle: 45, color: "#f9d56e", pattern: "#f5c842" },
      { x: canvasW, y: 0, angle: -45, color: "#a8d8ea", pattern: "#89c4d9" },
      { x: 0, y: canvasH, angle: -45, color: "#f7a8c4", pattern: "#f490b0" },
      { x: canvasW, y: canvasH, angle: 45, color: "#b8e0b0", pattern: "#9dd494" },
    ];

    tapes.forEach(({ x, y, angle, color, pattern }) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angle * Math.PI) / 180);

      const tapeW = 55 * S;
      const tapeH = 20 * S;

      // Base tape color
      ctx.fillStyle = color + "cc"; // semi-transparent
      ctx.fillRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH);

      // Stripe pattern
      ctx.strokeStyle = pattern + "88";
      ctx.lineWidth = 3 * S;
      for (let i = -tapeW / 2; i < tapeW / 2; i += 8 * S) {
        ctx.beginPath();
        ctx.moveTo(i, -tapeH / 2);
        ctx.lineTo(i, tapeH / 2);
        ctx.stroke();
      }

      // Torn edge effect (top & bottom jagged)
      ctx.fillStyle = color + "55";
      ctx.beginPath();
      for (let tx = -tapeW / 2; tx <= tapeW / 2; tx += 4 * S) {
        ctx.lineTo(tx, -tapeH / 2 + (Math.sin(tx * 0.5) * 2 * S));
      }
      ctx.lineTo(tapeW / 2, tapeH / 2);
      ctx.lineTo(-tapeW / 2, tapeH / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // Light inner border
    ctx.strokeStyle = "rgba(180,140,80,0.4)";
    ctx.lineWidth = 1.5 * S;
    ctx.strokeRect(24 * S, 24 * S, canvasW - 48 * S, canvasH - 48 * S);
  }

  ctx.restore();
};

  return (
    <div className="bg-analog-bg text-analog-on-surface min-h-screen flex flex-col font-mono relative overflow-x-hidden selection:bg-analog-primary-container selection:text-white">
      <div className="grain-overlay"></div>

      {/* Top Header */}
      <header className="bg-analog-bg border-b border-analog-outline-variant/30 sticky top-0 z-50 h-16 flex items-center justify-between px-3 md:px-6 gap-2">
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            onClick={executeUndo}
            disabled={undoStack.length === 0}
            className={`p-1.5 sm:p-2 rounded-full hover:bg-analog-surface-highest/50 transition-colors active:scale-90 ${undoStack.length === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100"}`}
            title="Undo"
          >
            <Undo className="w-4 h-4 sm:w-5 sm:h-5 text-analog-primary" />
          </button>
          <button
            onClick={executeRedo}
            disabled={redoStack.length === 0}
            className={`p-1.5 sm:p-2 rounded-full hover:bg-analog-surface-highest/50 transition-colors active:scale-90 ${redoStack.length === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100"}`}
            title="Redo"
          >
            <Redo className="w-4 h-4 sm:w-5 sm:h-5 text-analog-primary" />
          </button>
        </div>

        {/* LOGO - Responsive static content-driven layout on mobile, absolute centering on desktop */}
        <div className="flex flex-col items-center select-none text-center px-1 md:absolute md:left-1/2 md:-translate-x-1/2 md:transform min-w-0 shrink z-10">
          <h1 className="font-serif text-lg min-[380px]:text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-analog-primary leading-none">
            TINGMEMOIR
          </h1>
          <span className="font-technical text-[7px] min-[380px]:text-[8px] md:text-[9px] tracking-widest text-analog-on-surface-variant/40 -mt-0.5 md:-mt-1 uppercase truncate max-w-[125px] min-[380px]:max-w-none">
            Vintage Chemistry Editor
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* AI Sparkles Button */}
          {image && (
            <button
              onClick={triggerAICaption}
              disabled={isAnalyzing}
              className={`flex items-center gap-1 bg-amber-100/70 border border-amber-200 text-amber-900 active:scale-95 duration-75 px-2 py-1.5 sm:px-3 rounded-lg text-[10px] sm:text-xs font-semibold ${isAnalyzing ? "animate-pulse" : ""}`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 fill-amber-700 animate-spin-slow" />
              <span className="hidden sm:inline">AI CAPTION</span>
            </button>
          )}

          {/* SAVE BUTTON */}
          <button
            onClick={downloadArt}
            disabled={isSaving || !image}
            className={`bg-[#5c5b30] text-white hover:bg-[#44431b] hover:shadow-md transition-all font-technical text-[10px] sm:text-xs px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg tracking-wider sm:tracking-widest active:scale-95 duration-100 flex items-center gap-1 sm:gap-1.5 ${!image ? "opacity-40 cursor-not-allowed" : ""}`}
            id="save-button"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {isSaving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col lg:flex-row items-center justify-center p-4 lg:p-6 gap-6 max-w-7xl mx-auto w-full mb-24">
        
        {/* Left Side: Polaroid Board & Sample Slides Tray */}
        <div className="flex-grow flex flex-col items-center justify-center w-full lg:w-3/5 max-w-2xl">
          
          {/* Main Photo Editor Frame Container */}
          <div 
            onPointerDown={() => setActiveStickerId(null)}
            className="relative w-full aspect-[4/5] flex flex-col items-center justify-center bg-analog-surface-dim/20 border border-analog-outline-variant/20 rounded-2xl overflow-hidden shadow-inner p-4 md:p-6"
          >
            


            {/* Polaroid Frame Wrapper */}
            <div 
              ref={containerRef}
              onPointerDown={(e) => {
                // Tapping outside stickers clears selection
                setActiveStickerId(null);
              }}
              className={`polaroid-frame relative flex flex-col items-center justify-start transition-all duration-300 rotate-1 overflow-visible ${ASPECT_RATIO_CONFIGS[aspectRatio].frameClass} ${
                frameType === "CLASSIC" ? "bg-white text-analog-on-surface" :
                frameType === "FILMSTRIP" ? "bg-stone-900 border-zinc-950 text-white" :
                frameType === "CARDBOARD" ? "bg-[#d0c3ab] border-[#c0b39b]/70 text-[#302010]" :
                "bg-[#fdf3df] border-[#8b7500] border-4 text-[#4c3f31]"
              }`}
              style={{
                borderRadius: frameType === "MUSEUM" ? "12px" : "4px",
                borderColor: frameType === "CLASSIC" ? "#ffffff" : 
                             frameType === "FILMSTRIP" ? "#121212" : 
                             frameType === "CARDBOARD" ? "#d0c3ab" : "#e3d9c6",
                borderBottomColor: frameType === "CLASSIC" ? "#ffffff" : 
                                   frameType === "FILMSTRIP" ? "#121212" : 
                                   frameType === "CARDBOARD" ? "#d0c3ab" : "#e3d9c6"
              }}
            >
              
              {/* Photo Area Container */}
              <div 
                ref={imageContainerRef}
                className={`bg-[#ebe1cf] w-full overflow-hidden relative border border-[#1f1b10]/10 shadow-inner group transition-all duration-300 ${ASPECT_RATIO_CONFIGS[aspectRatio].imgClass}`}
              >
                {isCameraActive ? (
                  <>
                    {/* Live Camera Stream */}
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ 
                        filter: getFilterStyle(),
                        transform: `${isCameraMirrored ? "scaleX(-1)" : "scaleX(1)"} translate(${imageOffsetX}%, ${imageOffsetY}%) scale(${imageScale}) rotate(${imageRotation}deg)`,
                        transformOrigin: "center center"
                      }}
                    />

                    {/* Camera Control HUD Floating Overlay (Compact & High Contrast) */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-40 bg-stone-900/90 border border-white/20 backdrop-blur-sm p-1.5 rounded-lg select-none">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleCameraFacingMode(); }}
                          className="bg-white/10 hover:bg-white/25 text-white font-technical text-[9px] uppercase font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="Ganti Lensa Depan/Belakang"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          Lens
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleCameraMirror(); }}
                          className="bg-white/10 hover:bg-white/25 text-white font-technical text-[9px] uppercase font-bold px-2 py-1 rounded-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="Mirroring Lensa"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          Mirror
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); stopCamera(); }}
                        className="bg-red-500/80 hover:bg-red-500 text-white font-technical text-[9px] uppercase font-bold px-2 py-1 rounded-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Tutup Kamera"
                      >
                        <X className="w-2.5 h-2.5" />
                        Tutup
                      </button>
                    </div>

                    {/* Capture Snapshot Action floating overlay */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); capturePhoto(); }}
                        className="w-11 h-11 bg-white hover:bg-amber-50 active:scale-90 hover:scale-105 border-4 border-[#5c5b30] rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all"
                        title="Capture live portrait"
                      >
                        <div className="w-5 h-5 bg-[#5c5b30] rounded-full"></div>
                      </button>
                    </div>

                    {/* Film Grain Layer (Opacity matches grain values) */}
                    {adjustments.grain > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none mix-blend-overlay z-20"
                        style={{
                          backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')",
                          opacity: (adjustments.grain / 100) * 0.35
                        }}
                      ></div>
                    )}

                    {/* Vignette Shading Layer */}
                    {adjustments.vignette > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none z-20"
                        style={{
                          background: `radial-gradient(circle, transparent 40%, rgba(15,12,0,${(adjustments.vignette / 100) * 0.55}) 100%)`
                        }}
                      ></div>
                    )}

                    {/* Floating stickers canvas: Live rendering supports full interactivity during capture */}
                    {stickers.map((sticker) => {
                      const isActive = activeStickerId === sticker.id;
                      const isDraggingThis = stickerDragState && stickerDragState.id === sticker.id;
                      return (
                        <div
                          key={sticker.id}
                          onPointerDown={(e) => handleStickerPointerDown(sticker.id, e)}
                          onPointerMove={(e) => handleStickerPointerMove(sticker.id, e)}
                          onPointerUp={(e) => handleStickerPointerUp(sticker.id, e)}
                          onPointerCancel={(e) => handleStickerPointerUp(sticker.id, e)}
                          className={`absolute cursor-move select-none flex items-center justify-center touch-none transition-shadow ${isActive ? "ring-2 ring-red-500/60 ring-offset-1 ring-offset-white/80 p-3 sm:p-1.5" : "p-2 hover:bg-white/10 rounded"}`}
                          style={{
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                            zIndex: isActive ? 40 : 30
                          }}
                        >
                          {sticker.type === "emoji" ? (
                            <span className="text-3xl filter drop-shadow-[#1f1b10]/20 drop-shadow-md select-none pointer-events-none">{sticker.value}</span>
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
                            <div className="border-2 border-red-700/60 font-semibold px-2.5 py-0.5 text-[#ba1a1a] tracking-widest text-[9px] uppercase font-technical bg-white/95 rounded shadow-sm relative overflow-hidden flex items-center justify-center select-none rotate-2 pointer-events-none">
                              {/* Slit grunge overlay on vintage stamps */}
                              <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-[#fff8f0]/40 rotate-12"></div>
                              <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-[#fff8f0]/40 -rotate-12"></div>
                              {sticker.value}
                            </div>
                          )}

                          {/* Control handle popup on click (hidden while dragging so user sees final position perfectly) */}
                          {isActive && !isDraggingThis && (
                            <div 
                              onPointerDown={(e) => e.stopPropagation()}
                              className="absolute -top-12 sm:-top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-stone-950 text-white rounded-lg shadow-2xl px-2.5 py-1.5 sm:px-2 sm:py-1 text-sm sm:text-[11px] z-50 animate-fade-in divide-x divide-stone-800 border border-white/10 whitespace-nowrap touch-none select-none"
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); changeScale(sticker.id, -0.15); }}
                                className="px-2 py-0.5 sm:px-1 hover:text-amber-200 active:scale-125 touch-manipulation font-bold text-lg sm:text-xs"
                                title="Smaller"
                              >
                                -
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); changeScale(sticker.id, 0.15); }}
                                className="px-2 py-0.5 sm:px-1.5 hover:text-amber-200 active:scale-125 touch-manipulation font-bold text-lg sm:text-xs"
                                title="Larger"
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); rotateSticker(sticker.id); }}
                                className="px-2.5 py-0.5 sm:px-2 hover:text-amber-200 active:scale-125 touch-manipulation flex items-center text-sm sm:text-[11px]"
                                title="Rotate"
                              >
                                🔄
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}
                                className="px-2.5 py-0.5 sm:px-2 hover:text-red-400 text-red-300 active:scale-125 touch-manipulation flex items-center text-sm sm:text-[11px]"
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
                ) : image ? (
                  <>
                    {/* Live Image */}
                    <img
                      src={image}
                      alt="Nostalgic snapshot"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      style={{ 
                        filter: getFilterStyle(),
                        transform: `translate(${imageOffsetX}%, ${imageOffsetY}%) scale(${imageScale}) rotate(${imageRotation}deg)`,
                        transformOrigin: "center center"
                      }}
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
                      const isDraggingThis = stickerDragState && stickerDragState.id === sticker.id;
                      return (
                        <div
                          key={sticker.id}
                          onPointerDown={(e) => handleStickerPointerDown(sticker.id, e)}
                          onPointerMove={(e) => handleStickerPointerMove(sticker.id, e)}
                          onPointerUp={(e) => handleStickerPointerUp(sticker.id, e)}
                          onPointerCancel={(e) => handleStickerPointerUp(sticker.id, e)}
                          className={`absolute cursor-move select-none flex items-center justify-center touch-none transition-shadow ${isActive ? "ring-2 ring-red-500/60 ring-offset-1 ring-offset-white/80 p-3 sm:p-1.5" : "p-2 hover:bg-white/10 rounded"}`}
                          style={{
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                            zIndex: isActive ? 40 : 20
                          }}
                        >
                          {sticker.type === "emoji" ? (
                            <span className="text-3xl filter drop-shadow-[#1f1b10]/20 drop-shadow-md select-none pointer-events-none">{sticker.value}</span>
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
                            <div className="border-2 border-red-700/60 font-semibold px-2.5 py-0.5 text-[#ba1a1a] tracking-widest text-[9px] uppercase font-technical bg-white/95 rounded shadow-sm relative overflow-hidden flex items-center justify-center select-none rotate-2 pointer-events-none">
                              {/* Slit grunge overlay on vintage stamps */}
                              <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-[#fff8f0]/40 rotate-12"></div>
                              <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-[#fff8f0]/40 -rotate-12"></div>
                              {sticker.value}
                            </div>
                          )}

                          {/* Control handle popup on click (hidden while dragging so user sees final position perfectly) */}
                          {isActive && !isDraggingThis && (
                            <div 
                              onPointerDown={(e) => e.stopPropagation()}
                              className="absolute -top-12 sm:-top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-stone-950 text-white rounded-lg shadow-2xl px-2.5 py-1.5 sm:px-2 sm:py-1 text-sm sm:text-[11px] z-50 animate-fade-in divide-x divide-stone-800 border border-white/10 whitespace-nowrap touch-none select-none"
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); changeScale(sticker.id, -0.15); }}
                                className="px-2 py-0.5 sm:px-1 hover:text-amber-200 active:scale-125 touch-manipulation font-bold text-lg sm:text-xs"
                                title="Smaller"
                              >
                                -
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); changeScale(sticker.id, 0.15); }}
                                className="px-2 py-0.5 sm:px-1.5 hover:text-amber-200 active:scale-125 touch-manipulation font-bold text-lg sm:text-xs"
                                title="Larger"
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); rotateSticker(sticker.id); }}
                                className="px-2.5 py-0.5 sm:px-2 hover:text-amber-200 active:scale-125 touch-manipulation flex items-center text-sm sm:text-[11px]"
                                title="Rotate"
                              >
                                🔄
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}
                                className="px-2.5 py-0.5 sm:px-2 hover:text-red-400 text-red-300 active:scale-125 touch-manipulation flex items-center text-sm sm:text-[11px]"
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

          {/* Quick Action: Take Another Photo or Upload */}
          {image && !isCameraActive && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => document.getElementById("polaroid-file-input")?.click()}
                className="px-3.5 py-2 border border-analog-outline-variant/50 text-stone-700 hover:bg-[#5c5b30]/10 hover:text-[#5c5b30] hover:border-[#5c5b30]/40 rounded-xl text-[10px] sm:text-xs font-bold font-technical tracking-widest uppercase transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 bg-white shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Ganti/Upload
              </button>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-[#5c5b30] text-white hover:bg-[#44431b] rounded-xl text-[10px] sm:text-xs font-bold font-technical tracking-widest uppercase transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 hover:shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                Ambil Foto Ulang
              </button>
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

                {/* ── Decorative Border Picker ── */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-analog-primary">Decorative Borders</h3>
                    <p className="font-mono text-xs text-analog-on-surface-variant/70 mt-1">
                      Hiasan border lucu & vintage untuk hasil foto kamu.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[
                      { id: "NONE",        label: "✕ None",         desc: "Tanpa border" },
                      { id: "FLORAL",      label: "🌸 Floral",       desc: "Bunga sudut vintage" },
                      { id: "FILM_EDGE",   label: "🎞️ Film Edge",    desc: "Strip film 35mm" },
                      { id: "BOTANICAL",   label: "🍃 Botanical",    desc: "Daun & ranting" },
                      { id: "CUTE_DOODLE", label: "⭐ Cute Doodle",  desc: "Bintang & hati lucu" },
                      { id: "WASHI",       label: "🎨 Washi Tape",   desc: "Tape sudut warna-warni" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setDecorBorder(b.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          decorBorder === b.id
                            ? "border-[#5c5b30] bg-[#5c5b30]/10 shadow-sm"
                            : "border-analog-outline-variant/30 bg-white hover:border-analog-outline hover:bg-stone-50"
                        }`}
                      >
                        <div className="font-technical text-[10px] font-bold tracking-wide text-analog-on-surface">{b.label}</div>
                        <div className="font-mono text-[9px] text-analog-on-surface-variant/60 mt-0.5">{b.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

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

                <div className="border-t border-analog-outline-variant/20 pt-4"></div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-md text-analog-primary">Pemangkasan & Posisi Foto</h3>
                    <p className="font-mono text-[11px] text-analog-on-surface-variant/70 mt-1">
                      Perbesar (Zoom) atau geser posisi foto Anda di dalam bingkai polaroid agar terlihat sempurna.
                    </p>
                  </div>

                  <div className="space-y-4 bg-stone-50/50 border border-analog-outline-variant/15 p-4 rounded-xl">
                    {/* Zoom / Scale Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-[11px] tracking-wider">
                        <span>PERBESAR FOTO (ZOOM)</span>
                        <span className="font-mono font-bold">{imageScale.toFixed(2)}x</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min="0.5"
                          max="4"
                          step="0.05"
                          value={imageScale}
                          onChange={(e) => {
                            setImageScale(parseFloat(e.target.value));
                          }}
                          className="w-full accent-[#5c5b30] h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer animate-none"
                        />
                      </div>
                    </div>

                    {/* Geser Horizontal Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-[11px] tracking-wider">
                        <span>GESER HORIZONTAL (X)</span>
                        <span className="font-mono font-bold">{imageOffsetX > 0 ? `+${imageOffsetX}` : imageOffsetX}%</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          step="1"
                          value={imageOffsetX}
                          onChange={(e) => {
                            setImageOffsetX(parseInt(e.target.value));
                          }}
                          className="w-full accent-[#735a3a] h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Geser Vertikal Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-[11px] tracking-wider">
                        <span>GESER VERTIKAL (Y)</span>
                        <span className="font-mono font-bold">{imageOffsetY > 0 ? `+${imageOffsetY}` : imageOffsetY}%</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          step="1"
                          value={imageOffsetY}
                          onChange={(e) => {
                            setImageOffsetY(parseInt(e.target.value));
                          }}
                          className="w-full accent-[#735a3a] h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Rotasi Foto Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-analog-on-surface-variant font-technical text-[11px] tracking-wider">
                        <span>ROTASI FOTO (DERAJAT)</span>
                        <span className="font-mono font-bold">{imageRotation}°</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="1"
                          value={imageRotation}
                          onChange={(e) => {
                            setImageRotation(parseInt(e.target.value));
                          }}
                          className="w-full accent-stone-700 h-1.5 bg-analog-surface-highest rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          saveStateToUndo();
                          setImageScale(1);
                          setImageOffsetX(0);
                          setImageOffsetY(0);
                          setImageRotation(0);
                        }}
                        className="w-full text-center py-2 text-[10px] text-stone-700 hover:bg-[#5c5b30]/10 hover:text-[#5c5b30] border border-stone-200 font-technical uppercase font-bold tracking-widest rounded-lg transition-colors cursor-pointer"
                      >
                        RESET POSISI & POTONG
                      </button>
                    </div>
                  </div>
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

      {/* Footer Area with developer credits and Discord URL */}
      <footer className="w-full text-center py-6 border-t border-analog-outline-variant/15 mt-auto bg-stone-50/20 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-analog-on-surface-variant/70 font-mono text-xs mb-2">
        <div className="flex items-center gap-1.5 font-technical text-stone-500 uppercase tracking-widest text-[9px]">
          <span>© {new Date().getFullYear()} TINGMEMOIR. ALL RIGHTS RESERVED.</span>
        </div>
        <div className="hidden sm:inline-block w-1 h-1 rounded-full bg-stone-300"></div>
        <div className="flex items-center gap-2">
          <span className="font-technical uppercase text-[9px] text-stone-500 tracking-wider">Discord:</span>
          <a
            href="https://discord.com/users/iggirafi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 hover:bg-[#5865F2] hover:text-white hover:shadow-2xs transition-all font-mono font-bold text-xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
              <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.569-.406.818a12.217 12.217 0 0 0-3.66 0 8.27 8.27 0 0 0-.412-.818.054.054 0 0 0-.052-.025 13.166 13.166 0 0 0-3.259 1.011.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.026.021.033a13.119 13.119 0 0 0 3.975 2.01.053.053 0 0 0 .059-.019c.307-.42.576-.87.802-1.34a.05.05 0 0 0-.028-.069 8.22 8.22 0 0 1-1.848-.88.05.05 0 0 1-.005-.083c.125-.094.25-.192.368-.292a.051.051 0 0 1 .053-.007c2.614 1.196 5.432 1.196 8.01 0a.051.051 0 0 1 .054.006c.12.1.243.198.369.293a.05.05 0 0 1-.006.083 8.35 8.35 0 0 1-1.847.88.05.05 0 0 0-.027.07c.23.47.5.92.802 1.34a.053.053 0 0 0 .06.02 13.067 13.067 0 0 0 3.975-2.012.05.05 0 0 0 .02-.032c.35-3.415-.558-6.417-2.61-9.115a.037.037 0 0 0-.02-.018zM5.14 9.018c-.766 0-1.397-.704-1.397-1.571s.614-1.571 1.397-1.571c.783 0 1.405.707 1.397 1.57 0 .868-.614 1.572-1.397 1.572zm5.72 0c-.766 0-1.397-.704-1.397-1.571s.614-1.571 1.397-1.571c.783 0 1.405.707 1.397 1.57 0 .868-.614 1.572-1.397 1.572z"/>
            </svg>
            <span>iggirafi</span>
          </a>
        </div>
      </footer>

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
