from fastapi.responses import JSONResponse

def Response(code, message, data=None):
    response = {
        "code": code,
        "message": message,
        "data": data
    }
    status = 200 if code == 0 else 400
    return JSONResponse(content=response, status_code=status)