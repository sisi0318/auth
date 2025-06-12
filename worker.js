/**
 * Cloudflare Worker - 联通云盘(Wopan)认证服务
 * 集成前端和后端功能
 */

// AES加密功能实现
class AESCipher {
  constructor(key, iv) {
    this.key = key;
    this.iv = iv;
  }

  async encrypt(data) {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(this.key);
    const ivBuffer = encoder.encode(this.iv);
    const dataBuffer = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );

    // PKCS7 padding
    const blockSize = 16;
    const padding = blockSize - (dataBuffer.length % blockSize);
    const paddedData = new Uint8Array(dataBuffer.length + padding);
    paddedData.set(dataBuffer);
    for (let i = dataBuffer.length; i < paddedData.length; i++) {
      paddedData[i] = padding;
    }

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: ivBuffer,
      },
      cryptoKey,
      paddedData
    );

    // Convert to base64
    const base64String = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    return base64String;
  }
}

// MD5哈希函数实现
async function md5(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('MD5', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 响应工具函数
function createResponse(code, message, data = null) {
  const response = {
    code: code,
    message: message,
    data: data
  };
  const status = code === 0 ? 200 : 400;
  return new Response(JSON.stringify(response), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// 发送验证码函数
async function sendCode(phone, uuid = "", verifyCode = "") {
  const clientSecret = "XFmi9GS2hzk98jGX";
  const url = "https://panservice.mail.wo.cn/api-user/sendMessageCodeBase";
  
  const body = {
    "operateType": "1",
    "phone": phone,
    "uuid": uuid,
    "verifyCode": verifyCode
  };

  const aes = new AESCipher(clientSecret, 'wNSOYIB1k1DjY5lA');
  const encryptedParam = await aes.encrypt(JSON.stringify(body));

  const payload = {
    "func": "pc_send",
    "clientId": "1001000021",
    "param": encryptedParam,
  };

  const headers = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
    'Content-Type': "application/json",
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    const rsp = result.RSP;

    if (rsp.RSP_CODE === "0000") {
      return createResponse(0, "发送成功", rsp.RSP_DESC);
    } else {
      return createResponse(-1, "发送失败", rsp.RSP_DESC);
    }
  } catch (error) {
    return createResponse(-1, "网络错误", error.message);
  }
}

// 验证码验证函数
async function verifyCode(phone, code) {
  const clientSecret = "XFmi9GS2hzk98jGX";
  const url = "https://panservice.mail.wo.cn/api-user/dispatcher";

  const body = {
    "phone": phone,
    "smsCode": code,
    "clientSecret": clientSecret
  };

  const aes = new AESCipher(clientSecret, 'wNSOYIB1k1DjY5lA');
  const encryptedParam = await aes.encrypt(JSON.stringify(body));

  const resTime = Date.now().toString();
  const reqSeq = (Math.floor(Math.random() * 70000) + 10000).toString();
  const key = "AppLoginByMobile";
  const channel = "api-user";

  const signData = key + resTime + reqSeq + channel;
  const sign = await md5(signData);

  const payload = {
    "header": {
      "key": key,
      "resTime": resTime,
      "reqSeq": reqSeq,
      "channel": channel,
      "version": "",
      "sign": sign
    },
    "body": {
      "param": encryptedParam,
      "clientId": "1001000021",
      "secret": true
    }
  };

  const headers = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
    'Content-Type': "application/json",
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    const rsp = result.RSP;

    if (rsp.RSP_CODE === "0000") {
      return createResponse(0, "验证成功", rsp.DATA);
    } else {
      return createResponse(-1, "验证失败", rsp.RSP_DESC);
    }
  } catch (error) {
    return createResponse(-1, "网络错误", error.message);
  }
}

// HTML页面内容
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>云盘Token获取</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #ddf5ed;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: rgba(255, 255, 255, 0.95);
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            width: 100%;
            max-width: 400px;
            transition: transform 0.3s ease;
        }

        .container:hover {
            transform: translateY(-5px);
        }

        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 2rem;
            font-size: 1.8rem;
            font-weight: 600;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #555;
            font-weight: 500;
        }        input[type="tel"], input[type="text"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            outline: none;
            background-color: #f8f9fa;
        }input[type="tel"]:focus, input[type="text"]:focus {
            border-color: #36ad6b;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(54, 173, 107, 0.1);
        }

        .code-group {
            display: flex;
            gap: 10px;
        }

        .code-group input {
            flex: 1;
        }        .send-code-btn {
            background: #36ad6b;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            white-space: nowrap;
            min-width: 100px;
            width: auto;
            margin-top: 0;
        }

        .send-code-btn:hover:not(:disabled) {
            background: #2e9a5c;
            transform: translateY(-1px);
        }

        .send-code-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .verify-btn {
            width: 100%;
            background: #36ad6b;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
        }

        .verify-btn:hover:not(:disabled) {
            background: #2e9a5c;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(54, 173, 107, 0.3);
        }

        .verify-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .message {
            margin-top: 1rem;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
        }

        .success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #36ad6b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }        .result-container {
            margin-top: 2rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px solid #28a745;
            box-shadow: 0 4px 8px rgba(40, 167, 69, 0.2);
        }

        .result-title {
            font-weight: 600;
            color: #28a787;
            margin-bottom: 0.5rem;
        }

        .result-content {
            background: #fff;
            padding: 1rem;
            border-radius: 5px;
            border-left: 4px solid #28a745;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>联通云盘Token获取</h1>
        
        <div class="form-group">
            <label for="phone">手机号码:</label>
            <input type="tel" id="phone" placeholder="请输入手机号码" maxlength="11">
        </div>
        
        <div class="form-group">
            <label for="code">验证码:</label>
            <div class="code-group">
                <input type="text" id="code" placeholder="请输入验证码" maxlength="6">
                <button type="button" class="send-code-btn" onclick="sendCode()" id="sendBtn">发送验证码</button>
            </div>
        </div>
        
        <button type="button" class="verify-btn" onclick="verifyCode()" id="verifyBtn">获取Token</button>
        
        <div id="message"></div>
        <div id="result"></div>
    </div>

    <script>
        let countdown = 0;
        let countdownInterval = null;

        function showMessage(type, text) {
            const messageDiv = document.getElementById('message');
            messageDiv.className = 'message ' + type;
            messageDiv.textContent = text;
        }

        function showResult(data) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = \`
                <div class="result-container">
                    <div class="result-title">Token信息:</div>
                    <div class="result-content">\${JSON.stringify(data, null, 2)}</div>
                </div>
            \`;
        }

        function updateSendButton() {
            const sendBtn = document.getElementById('sendBtn');
            if (countdown > 0) {
                sendBtn.textContent = \`\${countdown}s后重发\`;
                sendBtn.disabled = true;
            } else {
                sendBtn.textContent = '发送验证码';
                sendBtn.disabled = false;
            }
        }

        function startCountdown() {
            countdown = 60;
            updateSendButton();
            countdownInterval = setInterval(() => {
                countdown--;
                updateSendButton();
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                }
            }, 1000);
        }

        async function sendCode() {
            const phone = document.getElementById('phone').value.trim();
            
            if (!phone) {
                showMessage('error', '请输入手机号码');
                return;
            }
            
            if (!/^1[3-9]\\d{9}$/.test(phone)) {
                showMessage('error', '请输入正确的手机号码');
                return;
            }

            const sendBtn = document.getElementById('sendBtn');
            sendBtn.innerHTML = '<span class="loading"></span>发送中...';
            sendBtn.disabled = true;

            try {
                const response = await fetch(\`/api/wopan/sms?phone=\${phone}\`, {
                    method: 'GET'
                });
                
                const result = await response.json();
                
                if (result.code === 0) {
                    showMessage('success', result.message);
                    startCountdown();
                } else {
                    showMessage('error', result.message + ': ' + result.data);
                    sendBtn.textContent = '发送验证码';
                    sendBtn.disabled = false;
                }
            } catch (error) {
                showMessage('error', '网络错误，请稍后重试');
                sendBtn.textContent = '发送验证码';
                sendBtn.disabled = false;
            }
        }

        async function verifyCode() {
            const phone = document.getElementById('phone').value.trim();
            const code = document.getElementById('code').value.trim();
            
            if (!phone) {
                showMessage('error', '请输入手机号码');
                return;
            }
            
            if (!code) {
                showMessage('error', '请输入验证码');
                return;
            }
            
            if (!/^\\d{6}$/.test(code)) {
                showMessage('error', '验证码应为6位数字');
                return;
            }

            const verifyBtn = document.getElementById('verifyBtn');
            verifyBtn.innerHTML = '<span class="loading"></span>验证中...';
            verifyBtn.disabled = true;

            try {
                const response = await fetch(\`/api/wopan/sms?phone=\${phone}&code=\${code}\`, {
                    method: 'GET'
                });
                
                const result = await response.json();
                
                if (result.code === 0) {
                    showMessage('success', result.message);
                    showResult(result.data);
                } else {
                    showMessage('error', result.message + ': ' + result.data);
                }
            } catch (error) {
                showMessage('error', '网络错误，请稍后重试');
            } finally {
                verifyBtn.textContent = '获取Token';
                verifyBtn.disabled = false;
            }
        }

        // 回车键支持
        document.getElementById('phone').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendCode();
            }
        });

        document.getElementById('code').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyCode();
            }
        });
    </script>
</body>
</html>
`;

// 主处理函数
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // 路由处理
    if (url.pathname === '/' || url.pathname === '/wopan/token') {
      // 返回HTML页面
      return new Response(HTML_PAGE, {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
        }
      });
    }
    
    if (url.pathname === '/api/wopan/sms') {
      // API路由
      const phone = url.searchParams.get('phone');
      const code = url.searchParams.get('code');
      
      if (!phone) {
        return createResponse(-1, "缺少手机号参数");
      }
      
      if (code === null) {
        // 发送验证码
        return await sendCode(phone);
      } else {
        // 验证码验证
        return await verifyCode(phone, code);
      }
    }
    
    // 404处理
    return new Response('Not Found', { 
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};
