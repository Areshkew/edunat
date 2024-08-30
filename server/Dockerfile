FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt
RUN pip install -r requirements.txt

# Copy app to working directory
COPY . .
EXPOSE 8080
CMD ["python", "main.py"]
