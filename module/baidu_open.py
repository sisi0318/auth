import httpx

from utils.send import Response
from utils.config import Config

config = Config().get("baidu_open")
client_id = config.get("client_id")
client_secret = config.get("client_secret")

def GetOauthUrl(redirect_uri= "oob") -> str:
    url = "https://openapi.baidu.com/oauth/2.0/authorize"
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": "basic,netdisk"
    }
    return Response(0, "获取成功", f"{url}?{httpx.QueryParams(params)}")


def GetAccessToken(code: str,redirect_uri= "oob"):
    url = "https://openapi.baidu.com/oauth/2.0/token"
    params = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri
    }
    
    response = httpx.post(url, params=params)
    
    data = response.json()
    if "access_token" in data:
        return Response(0, "获取成功", data)
    else:
        return Response(-1, "获取失败", data.get("error_description", "未知错误"))
    

def GetOauthQrcode():
    url = "https://openapi.baidu.com/oauth/2.0/device/code"
    params = {
        "client_id": client_id,
        "response_type": "device_code",
        "scope": "basic,netdisk"
    }
    
    response = httpx.get(url, params=params)
    
    if response.status_code == 200:
        return Response(0, "获取二维码成功", response.json())
    else:
        return Response(-1, "获取二维码失败", response.text)
    

def GetAccessTokenByDeviceCode(device_code: str):
    url = "https://openapi.baidu.com/oauth/2.0/token"
    params = {
        "grant_type": "device_token",
        "code": device_code,
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    response = httpx.post(url, params=params)
    
    data = response.json()
    if "access_token" in data:
        return Response(0, "获取成功", data)
    else:
        return Response(-1, "获取失败", data.get("error_description", "未知错误"))