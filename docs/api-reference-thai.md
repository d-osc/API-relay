# เอกสารอ้างอิง API (API Reference)

## บทนำ

เอกสารนี้อธิบาย API ทั้งหมดที่ให้บริการโดย API Relay ซึ่งช่วยให้คุณสามารถเชื่อมต่อกับผู้ให้บริการ AI ต่างๆ เช่น ChatGPT และ Perplexity ผ่านอินเทอร์เฟซเดียวกัน

## การตั้งค่าพื้นฐาน

### พื้นฐาน URL

```
http://localhost:8637
```

### ส่วนหัวที่จำเป็น (Required Headers)

```
Content-Type: application/json
```

### การตรวจสอบสถานะเซิร์ฟเวอร์

```http
GET /
```

**ตัวอย่างการตอบสนอง:**

```json
{
  "status": "ok",
  "message": "API Relay Server is running"
}
```

## Endpoints หลัก

### 1. Chat Completions

ใช้สำหรับสร้างข้อความตอบกลับจาก AI รองรับทั้งแบบข้อมูลเต็ม (completion) และแบบสตรีม (streaming)

#### 1.1 การสร้างข้อความตอบกลับ (Chat Completions)

```http
POST /v1/chat/completions
```

**พารามิเตอร์ในคำขอ:**

| ชื่อ | ประเภท | จำเป็น | คำอธิบาย |
|------|--------|--------|-----------|
| model | string | ใช่ | โมเดลที่ต้องการใช้ (เช่น "gpt-3.5-turbo", "gpt-4") |
| messages | array | ใช่ | รายการข้อความในการสนทนา |
| stream | boolean | ไม่ | ส่งข้อมูลแบบสตรีม (ค่าเริ่มต้น: false) |
| temperature | number | ไม่ | ค่าความสุ่ม (0-2, ค่าเริ่มต้น: 1) |
| max_tokens | integer | ไม่ | จำนวนโทเคนสูงสุด |
| provider | string | ไม่ | ผู้ให้บริการ (เช่น "chatgpt", "perplexity") |

**โครงสร้าง messages:**

```json
{
  "role": "user|assistant|system",
  "content": "ข้อความ"
}
```

**ตัวอย่างคำขอ:**

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "คุณเป็นผู้ช่วยที่เป็นประโยชน์"
    },
    {
      "role": "user",
      "content": "อธิบายเกี่ยวกับปัญญาประดิษฐ์"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

**ตัวอย่างการตอบสนอง (stream: false):**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "ปัญญาประดิษฐ์ (AI) คือ..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 56,
    "completion_tokens": 31,
    "total_tokens": 87
  }
}
```

**ตัวอย่างการตอบสนอง (stream: true):**

```
data: {"id": "chatcmpl-abc123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-3.5-turbo", "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": null}]}
data: {"id": "chatcmpl-abc123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-3.5-turbo", "choices": [{"index": 0, "delta": {"content": "ปัญญา"}, "finish_reason": null}]}
data: {"id": "chatcmpl-abc123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-3.5-turbo", "choices": [{"index": 0, "delta": {"content": "ประดิษฐ์"}, "finish_reason": null}]}
data: {"id": "chatcmpl-abc123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-3.5-turbo", "choices": [{"index": 0, "delta": {"content": " (AI) คือ..."}, "finish_reason": null}]}
data: [DONE]
```

### 2. Models

ใช้สำหรับดึงรายการโมเดลที่รองรับทั้งหมด

#### 2.1 ดึงรายการโมเดล

```http
GET /v1/models
```

**ตัวอย่างการตอบสนอง:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-3.5-turbo",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai"
    },
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1687882410,
      "owned_by": "openai"
    },
    {
      "id": "turbo",
      "object": "model",
      "created": 1677610602,
      "owned_by": "perplexity"
    }
  ]
}
```

#### 2.2 ดึงข้อมูลโมเดลเฉพาะ

```http
GET /v1/models/{model}
```

**พารามิเตอร์:**

| ชื่อ | ประเภท | จำเป็น | คำอธิบาย |
|------|--------|--------|-----------|
| model | string | ใช่ | ID ของโมเดลที่ต้องการดูข้อมูล |

**ตัวอย่างการตอบสนอง:**

```json
{
  "id": "gpt-3.5-turbo",
  "object": "model",
  "created": 1677610602,
  "owned_by": "openai"
}
```

### 3. Messages (Anthropic compatible)

API ที่เข้ากันได้กับรูปแบบ Anthropic Claude API

#### 3.1 สร้างข้อความตอบกลับ

```http
POST /v1/messages
```

**พารามิเตอร์ในคำขอ:**

| ชื่อ | ประเภท | จำเป็น | คำอธิบาย |
|------|--------|--------|-----------|
| model | string | ใช่ | โมเดลที่ต้องการใช้ |
| messages | array | ใช่ | รายการข้อความในการสนทนา |
| max_tokens | integer | ใช่ | จำนวนโทเคนสูงสุด |
| stream | boolean | ไม่ | ส่งข้อมูลแบบสตรีม (ค่าเริ่มต้น: false) |
| temperature | number | ไม่ | ค่าความสุ่ม (0-1, ค่าเริ่มต้น: 1) |

**โครงสร้าง messages:**

```json
{
  "role": "user|assistant",
  "content": "ข้อความ"
}
```

**ตัวอย่างคำขอ:**

```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "สวัสดี ช่วยเขียนโค้ด Python สำหรับคำนวณ Fibonacci"
    }
  ]
}
```

**ตัวอย่างการตอบสนอง:**

```json
{
  "id": "msg_abc123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "แน่นอนครับ นี่คือโค้ด Python สำหรับคำนวณลำดับ Fibonacci:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n```"
    }
  ],
  "model": "claude-3-sonnet-20240229",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 25,
    "output_tokens": 68
  }
}
```

## Endpoints สำหรับจัดการผู้ให้บริการ

### 1. ดึงรายการผู้ให้บริการ

```http
GET /v1/providers
```

**ตัวอย่างการตอบสนอง:**

```json
{
  "providers": [
    {
      "id": "chatgpt",
      "name": "ChatGPT",
      "description": "OpenAI's GPT models",
      "status": "active",
      "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]
    },
    {
      "id": "perplexity",
      "name": "Perplexity",
      "description": "Perplexity AI search and chat",
      "status": "active",
      "models": ["turbo", "experimental", "claude2"]
    }
  ]
}
```

### 2. สลับผู้ให้บริการ

```http
POST /v1/providers/switch
```

**พารามิเตอร์ในคำขอ:**

```json
{
  "provider": "perplexity",
  "model": "turbo"
}
```

**ตัวอย่างการตอบสนอง:**

```json
{
  "status": "success",
  "message": "Switched to provider: perplexity",
  "current_provider": {
    "id": "perplexity",
    "model": "turbo"
  }
}
```

## Endpoints สำหรับการจัดการคิว

### 1. ตรวจสอบสถานะคิว

```http
GET /v1/queue/status
```

**ตัวอย่างการตอบสนอง:**

```json
{
  "queue_size": 3,
  "processing": 1,
  "completed": 10,
  "failed": 0,
  "max_queue_size": 10,
  "concurrent_limit": 2
}
```

### 2. ล้างคิว

```http
POST /v1/queue/clear
```

**ตัวอย่างการตอบสนอง:**

```json
{
  "status": "success",
  "message": "Queue cleared",
  "cleared_items": 5
}
```

## การจัดการข้อผิดพลาด

### รูปแบบข้อผิดพลาดทั่วไป

เมื่อเกิดข้อผิดพลาด เซิร์ฟเวอร์จะส่งกลับรหัสสถานะ HTTP ที่เหมาะสมพร้อมกับข้อมูลแสดงข้อผิดพลาด:

```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "ข้อความอธิบายข้อผิดพลาด",
    "code": "error_code"
  }
}
```

### รหัสข้อผิดพลาดที่พบบ่อย

| รหัสสถานะ | ประเภทข้อผิดพลาด | คำอธิบาย |
|------------|-----------------|-----------|
| 400 | invalid_request_error | คำขอไม่ถูกต้อง (parameter ไม่ถูกต้อง) |
| 401 | authentication_error | การยืนยันตัวตนล้มเหลว |
| 403 | permission_denied_error | ไม่มีสิทธิ์เข้าถึง |
| 404 | not_found_error | ไม่พบทรัพยากรที่ร้องขอ |
| 429 | rate_limit_error | เกินขีดจำกัดการร้องขอ |
| 500 | api_error | ข้อผิดพลาดภายในเซิร์ฟเวอร์ |
| 503 | service_unavailable | บริการไม่พร้อมใช้งาน |

### ตัวอย่างการจัดการข้อผิดพลาด

**คำขอที่ไม่ถูกต้อง:**

```json
{
  "model": "gpt-3.5-turbo",
  "messages": []
}
```

**การตอบสนองของข้อผิดพลาด:**

```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "messages array cannot be empty",
    "code": "empty_messages"
  }
}
```

## การจำกัดอัตรา (Rate Limiting)

- จำนวนคำขอสูงสุดต่อนาที: 60 คำขอ
- จำนวนคำขอสูงสุดต่อชั่วโมง: 1,000 คำขอ
- จำนวนโทเคนสูงสุดต่อนาที: 40,000 โทเคน

เมื่อเกินขีดจำกัด เซิร์ฟเวอร์จะส่งกลับรหัสสถานะ 429 พร้อมกับข้อมูลเกี่ยวกับเวลาที่ต้องรอ:

```json
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded",
    "retry_after": 30
  }
}
```

## ตัวอย่างโค้ด

### JavaScript/Node.js

```javascript
const fetch = require('node-fetch');

// สร้างการสนทนาใหม่
async function createChatCompletion(messages) {
  try {
    const response = await fetch('http://localhost:8637/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// การใช้งาน
createChatCompletion([
  { role: 'system', content: 'คุณเป็นผู้ช่วยที่เป็นประโยชน์' },
  { role: 'user', content: 'อธิบายเกี่ยวกับ API Relay' }
])
.then(response => {
  console.log(response.choices[0].message.content);
})
.catch(error => {
  console.error('เกิดข้อผิดพลาด:', error.message);
});
```

### Python

```python
import requests
import json

# สร้างการสนทนาใหม่
def create_chat_completion(messages):
    url = "http://localhost:8637/v1/chat/completions"
    
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 500
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            error = response.json()
            raise Exception(error["error"]["message"])
            
        return response.json()
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

# การใช้งาน
try:
    messages = [
        {"role": "system", "content": "คุณเป็นผู้ช่วยที่เป็นประโยชน์"},
        {"role": "user", "content": "อธิบายเกี่ยวกับ API Relay"}
    ]
    
    response = create_chat_completion(messages)
    print(response["choices"][0]["message"]["content"])
    
except Exception as e:
    print(f"เกิดข้อผิดพลาด: {str(e)}")
```

### cURL

```bash
# สร้างการสนทนาใหม่
curl -X POST http://localhost:8637/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "system",
        "content": "คุณเป็นผู้ช่วยที่เป็นประโยชน์"
      },
      {
        "role": "user",
        "content": "อธิบายเกี่ยวกับ API Relay"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

## การใช้งานแบบสตรีม (Streaming)

### JavaScript

```javascript
const fetch = require('node-fetch');

async function createStreamingChatCompletion(messages) {
  try {
    const response = await fetch('http://localhost:8637/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        stream: true
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line === 'data: [DONE]') {
          console.log('Streaming completed');
          console.log('Full response:', fullResponse);
          return;
        }
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const json = JSON.parse(data);
            const content = json.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              process.stdout.write(content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// การใช้งาน
createStreamingChatCompletion([
  { role: 'system', content: 'คุณเป็นผู้ช่วยที่เป็นประโยชน์' },
  { role: 'user', content: 'เขียนเรื่องราวสั้นเกี่ยวกับ AI' }
])
.catch(error => {
  console.error('เกิดข้อผิดพลาด:', error.message);
});
```

## แผนงานการพัฒนา API

- **เวอร์ชัน 1.1**: เพิ่มการสนับสนุนสำหรับการอัปโหลดไฟล์
- **เวอร์ชัน 1.2**: เพิ่มการสนับสนุนสำหรับฟังก์ชัน (Function Calling)
- **เวอร์ชัน 2.0**: เพิ่มการสนับสนุนสำหรับภาพและสื่อผสม

## การอัปเดต API

การเปลี่ยนแปลงที่ไม่เข้ากันได้ (breaking changes) จะมีการประกาศล่วงหน้าและจะมีเวอร์ชันเก่าให้บริการได้อย่างน้อย 6 เดือน

## การติดต่อและรายงานปัญหา

หากพบปัญหาหรือมีคำถามเกี่ยวกับ API กรุณาติดต่อ:
- รายงานปัญหา: [GitHub Issues](https://github.com/your-username/API-relay/issues)
- คำถาม: [GitHub Discussions](https://github.com/your-username/API-relay/discussions)
- อีเมล: support@apirelay.example.com