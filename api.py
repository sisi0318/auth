from fastapi import FastAPI, Request, Form
from pydantic import BaseModel

import module.wopan as Wopan

app = FastAPI()

# 处理 GET 参数
@app.get("/api/wopan/sms")
async def wopan_sms(phone: str = "" , code = None):
    if code is None:
        send = Wopan.SendCode(phone, "", "")
    else:
        send = Wopan.VerifyCode(phone, code)
    return send




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)