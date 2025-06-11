from hashlib import md5
import json
import random
import httpx
import time

from utils.aes import AESCipher
from utils.send import Response


def SendCode(phone: str, uuid = "", verifyCode = "" ):
    url = "https://panservice.mail.wo.cn/api-user/sendMessageCodeBase"

    body = {"operateType":"1","phone":phone,"uuid":uuid,"verifyCode":verifyCode}

    key = b'XFmi9GS2hzk98jGX'
    iv = b'wNSOYIB1k1DjY5lA'
    aes = AESCipher(key, iv)

    payload = {
    "func": "pc_send",
    "clientId": "1001000021",
    "param": aes.encrypt(json.dumps(body)),
    }

    headers = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
    'Content-Type': "application/json",
    }

    response = httpx.post(url, data=json.dumps(payload), headers=headers)

    rsp = response.json().get("RSP")

    if rsp.get("RSP_CODE") == "0000":
        return Response(0, "发送成功", rsp.get("RSP_DESC"))
    else:
        return Response(-1, "发送失败", rsp.get("RSP_DESC"))
    


def VerifyCode(phone: str, code: str):
    url = "https://panservice.mail.wo.cn/api-user/dispatcher"

    body = {"phone": phone ,"smsCode": code ,"clientSecret":"XFmi9GS2hzk98jGX"}

    key = b'XFmi9GS2hzk98jGX'
    iv = b'wNSOYIB1k1DjY5lA'
    aes = AESCipher(key, iv)

    payload = {
        "header": {
            "key": "AppLoginByMobile",
            "resTime": str(int(time.time() * 1000)),
            "reqSeq": str(random.randint(10000, 80000)),
            "channel": "api-user",
            "version": ""
        },
        "body": {
            "param": aes.encrypt(json.dumps(body)),
            "clientId": "1001000021",
            "secret": True
        }
    }
    payload['header']['sign'] = md5(payload['header']['key'].encode('utf-8') + payload['header']['resTime'].encode('utf-8') + payload['header']['reqSeq'].encode('utf-8') + payload['header']['channel'].encode('utf-8')).hexdigest()
    headers = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
    'Content-Type': "application/json",
    }

    response = httpx.post(url, data=json.dumps(payload), headers=headers)

    rsp = response.json().get("RSP")

    if rsp.get("RSP_CODE") == "0000":
        return Response(0, "验证成功", rsp.get("DATA"))
    else:
        return Response(-1, "验证失败", rsp.get("RSP_DESC"))