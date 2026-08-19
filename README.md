# TumorSight

An interactive 3D demo for classifying brain tumor MRI scans — built on
top of the VGG16 classifier from
[VGG16TumorClassification](https://github.com/RenadAlh/VGG16TumorClassification).

Upload an MRI slice, and a rotatable 3D brain reacts to the prediction —
a particle pulse animates at a stylized marker for the predicted tumor
type (glioma, meningioma, pituitary, or no tumor), alongside a
confidence breakdown.

## How it works

1. **Backend** (`backend/`) — a FastAPI service wrapping the trained
   VGG16 model (95.4% test accuracy). Exposes a single `POST /predict`
   endpoint: image in, `{predicted_class, confidence, probabilities}`
   JSON out. See `backend/README.md` for deployment instructions
   (Google Cloud Run, free tier).
2. **Frontend** (`frontend/TumorSight.jsx`) — a React + Three.js demo:
   drag to rotate a stylized, noise-displaced 3D brain mesh, upload an
   MRI scan, and watch it react to the classifier's prediction.

## Relationship to VGG16TumorClassification

This repo is the applied/demo layer on top of the model developed in
[VGG16TumorClassification](https://github.com/RenadAlh/VGG16TumorClassification)
— that repo holds the training notebook, architecture experiments, and
model weights; this one turns the trained model into something you can
click through and watch respond live.

## Honesty note

The model classifies tumor **type** from the scan — it does not localize
the tumor's position. The 3D demo's highlighted marker is a stylized,
illustrative indicator of the predicted class, not a detected location.
Educational/portfolio demo only, not a diagnostic tool.

## Setup

See `backend/README.md` to deploy the API, then open the frontend and
paste your deployed API URL into the "API endpoint" field — it works in
mocked/demo mode with no backend connected too.
