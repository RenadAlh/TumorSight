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
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from tensorflow.keras.models import load_model

# --- Config -----------------------------------------------------------
MODEL_PATH = os.environ.get("MODEL_PATH", "vgg16_tumor_model_95_accuracy.h5")
IMG_SIZE = (224, 224)
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]

# --- App setup ----------------------------------------------------------
app = FastAPI(title="Brain Tumor MRI Classifier")

# Allow calls from any origin (browser-based 3D demo, Claude artifacts, etc.)
# Tighten allow_origins to your actual frontend domain once deployed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None


@app.on_event("startup")
def load_the_model():
    global model
    # compile=False avoids Keras-3/optimizer-state issues loading an older
    # Keras-2-saved .h5 file — fine since we only need inference, not training.
    model = load_model(MODEL_PATH, compile=False)
    # Warm up so the first real request isn't slow
    dummy = np.zeros((1, *IMG_SIZE, 3), dtype=np.float32)
    model.predict(dummy, verbose=0)
    print("Model loaded and warmed up.")


@app.get("/")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
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
    arr = np.array(image, dtype=np.float32) / 255.0  # matches notebook's rescale=1./255
    arr = np.expand_dims(arr, axis=0)  # (1, 224, 224, 3)

    probs = model.predict(arr, verbose=0)[0]  # shape (4,)
    predicted_idx = int(np.argmax(probs))

    return {
        "predicted_class": CLASS_NAMES[predicted_idx],
        "confidence": float(probs[predicted_idx]),
        "probabilities": {
            CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
        },
    }
