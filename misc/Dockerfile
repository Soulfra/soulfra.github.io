FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/chatlog_workspace /app/idea_empire_workspace

# Copy all Python files
COPY *.py ./

# Create a simple requirements file
RUN echo "aiohttp==3.9.0" > requirements.txt && \
    echo "numpy==1.24.0" >> requirements.txt && \
    echo "scikit-learn==1.3.0" >> requirements.txt

# Install Python dependencies (ignore errors for now)
RUN pip install --no-cache-dir -r requirements.txt || true

# Expose all ports
EXPOSE 7777 8000 8001 8888 9999 8181 6969 5555

# Default command
CMD ["python3", "-u", "WORKING_LAUNCHER.py"]
