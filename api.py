from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

import module.wopan as Wopan
import module.baidu_open as BaiduOpen

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加静态文件服务
import os
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")
# Wopan Token获取页面
@app.get("/wopan/token")
async def wopan_token_page():
    index_path = os.path.join(static_dir, "index.html")
    return FileResponse(index_path)


# wopan
@app.get("/api/wopan/sms")
async def wopan_sms(phone: str = "" , code = None):
    if code is None:
        send = Wopan.SendCode(phone, "", "")
    else:
        send = Wopan.VerifyCode(phone, code)
    return send

# baidu_open
@app.get("/api/baidu_open/oauth")
async def baidu_open_oauth(code = None):
    if code is None:
        send = BaiduOpen.GetOauthUrl()
    else:
        send = BaiduOpen.GetAccessToken(code)
    return send

# badu_open_qrcode
@app.get("/api/baidu_open/qrcode")
async def baidu_open_oauth(code = None):
    if code is None:
        send = BaiduOpen.GetOauthQrcode()
    else:
        send = BaiduOpen.GetAccessTokenByDeviceCode(code)
    return send


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)