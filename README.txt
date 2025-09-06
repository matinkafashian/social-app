Run backend:
  cd backend
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  python -m pip install --upgrade pip
  python -m pip install -r requirements.txt
  python manage.py makemigrations accounts
  python manage.py migrate
  python manage.py runserver 127.0.0.1:8000

Run frontend:
  cd frontend
  npm i
  echo NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000 > .env.local
  npm run dev
