# Brain Tumor MRI Classifier API

FastAPI service wrapping a VGG16-based brain tumor MRI classifier
(95.4% test accuracy). Deployed as a Docker container on **Azure
Container Apps**, using the free Azure for Students offer:

- $100 in Azure credit plus free access to 25+ Azure services.
- No credit card required for students aged 18+.
- Fully self-serve through the `az` CLI — no manual account approval.

(Google Cloud Run was the original plan, but billing in some regions,
including Saudi Arabia, routes through a reseller with a manual,
sales-assisted onboarding process — not a fit for a quick student
deployment. Azure for Students has none of that friction.)

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

## Deploying to Azure Container Apps

1. Redeem the Azure for Students offer at
   https://education.github.com/pack (find Microsoft Azure in the
   offers list). No card required.
2. Install the Azure CLI:
   https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
3. Log in:
   ```bash
   az login
   ```
4. From the folder containing `app.py`, `requirements.txt`,
   `Dockerfile`, and your model file
   `vgg16_tumor_model_95_accuracy.h5`, create a resource group:
   ```bash
   az group create --name TumorSightRG --location eastus
   ```
5. Deploy directly from source — this builds your Dockerfile and
   deploys it in one step:
   ```bash
   az containerapp up \
     --name tumorsight-api \
     --resource-group TumorSightRG \
     --location eastus \
     --source . \
     --target-port 8080 \
     --ingress external
   ```
6. The command prints a service URL when done, e.g.
   `https://tumorsight-api.<random>.eastus.azurecontainerapps.io`.
   That's your API base — the `/predict` endpoint is at
   `<that-url>/predict`.
7. Test it:
   ```bash
   curl -X POST https://tumorsight-api.<random>.eastus.azurecontainerapps.io/predict \
     -F "file=@some_mri_scan.jpg"
   ```

## Notes

- Container Apps scales down when idle, so the first request after a
  quiet period will be slow (cold start — the container spins up and
  loads the 173MB model). Subsequent requests are fast.
- Preprocessing matches the training notebook exactly: images are
  resized to 224x224 and rescaled to [0,1] (no ImageNet mean/BGR
  subtraction).
- The model loads with `compile=False` to avoid Keras-3 compatibility
  issues when loading an older Keras-2-saved `.h5` file — fine since
  this service only runs inference, not training.