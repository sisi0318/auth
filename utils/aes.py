from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64

class AESCipher:
    def __init__(self, key: bytes, iv: bytes):
        self.key = key
        self.iv = iv

    def encrypt(self, data: str) -> str:
        cipher = AES.new(self.key, AES.MODE_CBC, self.iv)
        ct_bytes = cipher.encrypt(pad(data.encode('utf-8'), AES.block_size))
        return base64.b64encode(ct_bytes).decode('utf-8')

    def decrypt(self, enc: str) -> str:
        cipher = AES.new(self.key, AES.MODE_CBC, self.iv)
        ct = base64.b64decode(enc)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        return pt.decode('utf-8')

# 示例用法
if __name__ == "__main__":
    key = b'XFmi9GS2hzk98jGX'  # 16字节key
    iv = b'wNSOYIB1k1DjY5lA'   # 16字节iv
    aes = AESCipher(key, iv)
    decode = "JFR6uGUe6G+SRt1Bn8zTLOKPvrBZBG8UGz6FXfySzob8QDSRYJxeaxSxn3OKZOAelbrGZKYBarncIdqyIgWjIgUSsr79B6jWCn5Yh5Ygl6w="
    decrypted = aes.decrypt(decode)
    print("解密后：", decrypted)