FROM python:3.12-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

EXPOSE 8000

# Entrypoint: migrate → seed (if empty) → start dev server
CMD ["sh", "-c", \
    "python manage.py migrate --noinput && \
     python manage.py seed --if-empty && \
     python manage.py runserver 0.0.0.0:8000"]
