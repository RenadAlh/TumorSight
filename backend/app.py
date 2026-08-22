"""
Brain Tumor MRI Classifier API
-------------------------------
Serves the VGG16-based classifier (vgg16_tumor_model_95_accuracy.h5) behind
a single POST /predict endpoint. Built to match the exact architecture and
preprocessing used in BrainTumorClassification_VGG16_.ipynb:

  - Input: 224x224 RGB
  - Preprocessing: rescale 1./255 (NOT keras.applications.vgg16.preprocess_input)
  - Classes (fixed order): ['glioma', 'meningioma', 'notumor', 'pituitary']
"""

import io
import os

import numpy as np
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from tensorflow.keras.models import load_model

# --- Config -----------------------------------------------------------
MODEL_PATH = os.environ.get("MODEL_PATH", "vgg16_tumor_model_95_accuracy.h5")
IMG_SIZE = (224, 224)
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]

# Heuristic thresholds for rejecting non-MRI images. Neither check needs an
# extra model: MRI scans are effectively grayscale, and the classifier's
# own confidence tends to collapse on genuinely out-of-distribution inputs.
COLOR_PIXEL_FRACTION_THRESHOLD = 0.05  # reject if >5% of pixels have real color
MIN_CONFIDENCE = 0.5                   # reject if the top class isn't even the majority vote

# Only these origins may call this API from a browser. Add any preview/staging
# Vercel URLs here too if you test against them.
ALLOWED_ORIGINS = [
    "https://tumorsight.vercel.app",
    "http://localhost:5173",  # local Vite dev server
]

# --- Rate limiting --------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)

# --- App setup ----------------------------------------------------------
app = FastAPI(title="Brain Tumor MRI Classifier")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Only your actual frontend domain(s) can call this from a browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

model = None


def is_colorful(image: Image.Image, channel_diff_threshold: int = 12, pixel_fraction_threshold: float = 0.05) -> bool:
    """
    True if a meaningful fraction of pixels have real color (R, G, B genuinely
    differ), rather than being grayscale. More robust than average saturation,
    which can stay low even for real photos if much of the frame is neutral
    (backgrounds, skin tones, etc.). Grayscale MRIs have R~=G~=B everywhere
    (allowing a small threshold for JPEG compression noise).
    """
    arr = np.array(image, dtype=np.int16)  # RGB, shape (H, W, 3)
    channel_diff = arr.max(axis=2) - arr.min(axis=2)
    colorful_fraction = float((channel_diff > channel_diff_threshold).mean())
    return colorful_fraction > pixel_fraction_threshold


@app.on_event("startup")
def load_the_model():
    global model
    # compile=False avoids Keras-3/optimizer-state issues loading an older
    # Keras-2-saved .h5 file, which is fine since we only need inference, not training.
    model = load_model(MODEL_PATH, compile=False)
    # Warm up so the first real request isn't slow
    dummy = np.zeros((1, *IMG_SIZE, 3), dtype=np.float32)
    model.predict(dummy, verbose=0)
    print("Model loaded and warmed up.")


@app.get("/")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
@limiter.limit("10/minute")
async def predict(request: Request, file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        raw = await file.read()
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image file")

    image = image.resize(IMG_SIZE)

    saturation = is_colorful(image, pixel_fraction_threshold=COLOR_PIXEL_FRACTION_THRESHOLD)
    if saturation:
        raise HTTPException(
            status_code=422,
            detail=(
                "This doesn't look like a brain MRI scan. Please upload an "
                "actual MRI image."
            ),
        )

    arr = np.array(image, dtype=np.float32) / 255.0  # matches notebook's rescale=1./255
    arr = np.expand_dims(arr, axis=0)  # (1, 224, 224, 3)

    probs = model.predict(arr, verbose=0)[0]  # shape (4,)
    predicted_idx = int(np.argmax(probs))
    confidence = float(probs[predicted_idx])

    if confidence < MIN_CONFIDENCE:
        raise HTTPException(
            status_code=422,
            detail=(
                "This doesn't look like a brain MRI scan. Please upload an "
                "actual MRI image."
            ),
        )

    return {
        "predicted_class": CLASS_NAMES[predicted_idx],
        "confidence": confidence,
        "probabilities": {
            CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
        },
    }