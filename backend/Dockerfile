FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  libpq-dev \
  libjpeg62-turbo-dev \
  zlib1g-dev \
  && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend/ /app/

EXPOSE 8000

CMD sh -c "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn server.wsgi:application --workers 2 --bind 0.0.0.0:8000 --keep-alive 5"


