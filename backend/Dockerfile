FROM python:3.10-slim

WORKDIR /app

# System deps for Pillow/TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY vgg16_tumor_model_95_accuracy.h5 .

# Cloud Run injects the port to listen on via the PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
