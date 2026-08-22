# TumorSight Backend

FastAPI service that serves a VGG16-based brain tumor MRI classifier behind a single `POST /predict` endpoint. It takes an MRI slice, runs it through the model, and returns the predicted tumor class plus the full confidence breakdown. This is the backend for the [TumorSight](../README.md) frontend.

## Model Summary

| | |
|---|---|
| Model | VGG16 (ImageNet-pretrained base, fine-tuned head) |
| Test accuracy | 95.4% |
| Precision | 95.54% |
| Recall | 95.48% |
| F1-score | 95.45% |
| Input | 224x224 RGB image |
| Output classes | `glioma`, `meningioma`, `notumor`, `pituitary` |
| Rate limit | 10 requests/minute per IP |

## Tech stack

![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?logo=tensorflow&logoColor=white)
![Keras](https://img.shields.io/badge/Keras-D00000?logo=keras&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?logo=numpy&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Azure](https://img.shields.io/badge/Azure_Container_Apps-0078D4?logo=microsoftazure&logoColor=white)

FastAPI serves the API, Uvicorn runs it, and slowapi handles rate limiting. TensorFlow/Keras loads and runs the model, Pillow and NumPy handle image decoding and preprocessing. Ships as a Docker container on Azure Container Apps.

## API reference

### `POST /predict`

Multipart form upload, single `file` field, any browser-readable image format.

```bash
curl -X POST https://<api-url>/predict -F "file=@scan.jpg"
```

Success (`200`):
```json
{
  "predicted_class": "glioma",
  "confidence": 0.97,
  "probabilities": {
    "glioma": 0.97,
    "meningioma": 0.01,
    "notumor": 0.01,
    "pituitary": 0.01
  }
}
```

Rejected (`422`), image doesn't look like a brain MRI scan:
```json
{ "detail": "This doesn't look like a brain MRI scan. Please upload an actual MRI image." }
```

A `422` fires for either reason, whichever trips first:
- the image isn't grayscale-like (more than 5% of pixels have real RGB channel divergence)
- the model's top class doesn't clear 50% confidence

Other responses: `400` if the upload isn't an image or can't be decoded, `429` past the rate limit, `503` if a request lands before the model finishes loading on startup.

### `GET /`

Health check: `{ "status": "ok", "model_loaded": true }`.

## Running locally

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

The model file (`vgg16_tumor_model_95_accuracy.h5`) needs to be in this directory, it's what `MODEL_PATH` points to by default. Test it:

```bash
curl -X POST http://localhost:8000/predict -F "file=@scan.jpg"
```

## Deployment

The API runs as a Docker container on Azure Container Apps, with images built and stored in Azure Container Registry.

## Notes

- Container Apps scales to zero when idle, so the first request after a quiet period is slow (cold start, container spins up and loads the ~170MB model). Every request after that is fast.
- Preprocessing matches the training pipeline exactly: resize to 224x224, rescale to `[0,1]`. No ImageNet mean subtraction or BGR channel swap.
- The model loads with `compile=False`, it avoids a Keras-3 compatibility issue with the older Keras-2-saved `.h5` file, which is fine since this service only does inference.
- Educational project, not a diagnostic tool. Don't use this for anything clinical.

## Credits

Model architecture, training, and weights are from my earlier project, [VGG16TumorClassification](https://github.com/RenadAlh/VGG16TumorClassification). This backend wraps that trained model in an API for TumorSight.

---

<div align="center">
  <sub>
    built by <b>Renad Alharthi</b>
  </sub>
</div>
