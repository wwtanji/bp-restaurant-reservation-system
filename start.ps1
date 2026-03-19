$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\.venv\Scripts\Activate.ps1; uvicorn main:API --reload --env-file .env"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm start"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "C:\Users\romaz\bin\stripe.exe listen --forward-to 'http://localhost:8000/api/payments/webhook'"
