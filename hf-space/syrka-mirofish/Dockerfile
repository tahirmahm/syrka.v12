FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    git curl build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"
WORKDIR /app

RUN git clone https://github.com/666ghj/MiroFish.git /app/mirofish

WORKDIR /app/mirofish
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir chromadb fastapi uvicorn

COPY --chown=user start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 7860

CMD ["/app/start.sh"]
