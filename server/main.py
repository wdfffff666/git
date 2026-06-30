"""
家庭 AI 服务器 - FastAPI 后端
连接 Ollama 本地模型，提供 Chat / Vision / Code API
"""

import base64
import time
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import json

app = FastAPI(title="家庭 AI 服务器", version="1.0.0")

# 允许家里任何设备访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434"

# ── 数据模型 ──────────────────────────────

class ChatRequest(BaseModel):
    message: str
    model: str = "qwen2.5-coder:3b"  # 默认对话模型（3B 对话模型下载后改为 qwen2.5:3b）
    temperature: float = 0.7

class CodeRequest(BaseModel):
    prompt: str
    language: str = "python"
    model: str = "qwen2.5-coder:3b"

class ModelInfo(BaseModel):
    name: str
    size: str
    type: str  # chat / vision / code

# ── 模型列表 ──────────────────────────────

MODEL_MAP = {
    "qwen2-vl:2b":    {"type": "vision", "desc": "图像识别"},
    "qwen2.5:7b":     {"type": "chat",   "desc": "通用对话"},
    "qwen2.5-coder:3b": {"type": "code", "desc": "代码生成"},
}

# ── API 路由 ──────────────────────────────

@app.get("/")
def root():
    return {
        "service": "家庭 AI 服务器",
        "status": "running",
        "endpoints": ["/chat", "/vision", "/code", "/models", "/health"]
    }

@app.get("/health")
async def health():
    """健康检查"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            models = resp.json().get("models", [])
        return {
            "status": "ok",
            "ollama": "connected",
            "models_count": len(models),
            "models": [m["name"] for m in models]
        }
    except Exception:
        return {"status": "degraded", "ollama": "disconnected"}

@app.get("/models")
async def list_models():
    """列出可用模型"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            ollama_models = resp.json().get("models", [])
    except Exception:
        ollama_models = []

    result = []
    for m in ollama_models:
        name = m["name"]
        info = MODEL_MAP.get(name, {"type": "unknown", "desc": "未知"})
        result.append({
            "name": name,
            "size": m.get("size", 0),
            "size_mb": round(m.get("size", 0) / (1024*1024*1024), 1),
            "type": info["type"],
            "desc": info["desc"]
        })
    return {"models": result}

@app.post("/chat")
async def chat(req: ChatRequest):
    """文本对话"""
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": req.model,
                    "prompt": req.message,
                    "stream": False,
                    "options": {"temperature": req.temperature}
                }
            )
            data = resp.json()
            return {
                "model": req.model,
                "response": data.get("response", ""),
                "eval_duration": data.get("eval_duration", 0) / 1e9
            }
    except httpx.ConnectError:
        raise HTTPException(503, "Ollama 服务未启动，请检查任务栏羊驼图标")
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/vision")
async def vision(file: UploadFile = File(...), prompt: str = "请用中文描述这张图片"):
    """图像识别"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "请上传图片文件")

    try:
        # 读取图片并转 base64
        image_bytes = await file.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        t0 = time.time()
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": "qwen2-vl:2b",
                    "prompt": prompt,
                    "images": [image_b64],
                    "stream": False
                }
            )
        elapsed = round(time.time() - t0, 1)
        data = resp.json()

        return {
            "model": "qwen2-vl:2b",
            "response": data.get("response", ""),
            "elapsed": elapsed,
            "file_name": file.filename
        }
    except httpx.ConnectError:
        raise HTTPException(503, "Ollama 服务未启动")
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/code")
async def generate_code(req: CodeRequest):
    """代码生成"""
    full_prompt = f"请用 {req.language} 写一段代码：{req.prompt}\n\n只输出代码和必要注释，不要废话。"

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": req.model,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {"temperature": 0.3}
                }
            )
            data = resp.json()
            return {
                "model": req.model,
                "language": req.language,
                "code": data.get("response", ""),
                "eval_duration": data.get("eval_duration", 0) / 1e9
            }
    except httpx.ConnectError:
        raise HTTPException(503, "Ollama 服务未启动")
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """流式对话（打字效果）"""
    async def generate():
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": req.model,
                        "prompt": req.message,
                        "stream": True,
                        "options": {"temperature": req.temperature}
                    }
                ) as resp:
                    async for chunk in resp.aiter_lines():
                        if chunk:
                            data = json.loads(chunk)
                            yield f"data: {json.dumps({'token': data.get('response', ''), 'done': data.get('done', False)})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── 启动入口 ──────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print("""
    ╔══════════════════════════════════════╗
    ║       🏠 家庭 AI 服务器启动中...      ║
    ║                                    ║
    ║  API 文档: http://localhost:8000/docs ║
    ║  健康检查: http://localhost:8000/health║
    ║  前端页面: http://localhost:5173       ║
    ╚══════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000)
