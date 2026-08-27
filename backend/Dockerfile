FROM python:3.11-slim

WORKDIR /app

# System deps for Pillow/TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY vgg16_tumor_model_97_recall.h5 .

# Default port for local runs; Azure Container Apps is told to target 8080 explicitly at deploy time
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
