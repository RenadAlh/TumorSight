# Brain Tumor MRI Classifier API

FastAPI service wrapping a VGG16-based brain tumor MRI classifier
(95.4% test accuracy). Deployed as a Docker container on **Google Cloud
Run**, which stays free for a low-traffic student demo:

- Cloud Run's Always Free tier includes 2 million requests/month, forever
  (not a trial) — a small demo will never come close to that.
- New Google Cloud accounts also get a $300 / 90-day trial credit as a
  safety net, though you shouldn't need to touch it for this project.
- A card is required for identity verification when you sign up, but you
  are not billed unless you exceed the free monthly quota.

## Endpoint

`POST /predict` — form-data with a single `file` field (an MRI image).

Response:
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

## Deploying to Google Cloud Run

1. Install the `gcloud` CLI if you don't have it:
   https://cloud.google.com/sdk/docs/install
2. Sign in and create/select a project:
   ```bash
   gcloud auth login
   gcloud projects create brain-tumor-demo --set-as-default
   # or: gcloud config set project <existing-project-id>
   ```
3. Enable billing on the project in the Cloud Console (required even for
   free-tier usage) and enable the Cloud Run + Cloud Build APIs:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```
4. From the folder containing `app.py`, `requirements.txt`, `Dockerfile`,
   and your model file `vgg16_tumor_model_95_accuracy.h5`, deploy directly
   from source (Cloud Build builds the Docker image for you — no local
   Docker install needed):
   ```bash
   gcloud run deploy brain-tumor-api \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --timeout 300
   ```
   (`us-central1` is one of the Always Free eligible regions — stick to
   `us-central1`, `us-east1`, or `us-west1` to stay covered by the free tier.)
5. The command prints a service URL when done, e.g.
   `https://brain-tumor-api-xxxxx-uc.a.run.app`. That's your API base —
   the `/predict` endpoint is at `<that-url>/predict`.
6. Test it:
   ```bash
   curl -X POST https://brain-tumor-api-xxxxx-uc.a.run.app/predict \
     -F "file=@some_mri_scan.jpg"
   ```

## Notes

- Cloud Run scales to zero when idle, so the first request after a quiet
  period will be slow (cold start — the container spins up and loads the
  173MB model). Subsequent requests are fast.
- `--memory 2Gi` gives TensorFlow enough headroom to load the model
  comfortably; this still falls well within the free monthly quota for
  light demo traffic.
- Preprocessing matches the training notebook exactly: images are resized
  to 224x224 and rescaled to [0,1] (no ImageNet mean/BGR subtraction).
- The model loads with `compile=False` to avoid Keras-3 compatibility
  issues when loading an older Keras-2-saved `.h5` file — fine since this
  service only runs inference, not training.
