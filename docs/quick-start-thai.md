# คู่มือเริ่มต้นใช้งาน API Relay

## บทนำ

API Relay เป็นเครื่องมือที่ช่วยให้คุณสามารถเชื่อมต่อกับผู้ให้บริการ AI หลายราย เช่น ChatGPT และ Perplexity ผ่านส่วนขยายเบราว์เซอร์ คู่มือนี้จะแนะนำขั้นตอนการติดตั้งและเริ่มใช้งาน API Relay

## ข้อกำหนดเบื้องต้น

- Node.js (รุ่น 16 ขึ้นไป)
- เบราว์เซอร์ที่รองรับส่วนขยาย (Chrome, Firefox, Edge)
- บัญชีผู้ใช้กับผู้ให้บริการ AI (เช่น ChatGPT, Perplexity)

## ขั้นตอนที่ 1: การติดตั้งและตั้งค่า

### 1.1 ดาวน์โหลดและติดตั้งโปรเจกต์

```bash
# โคลนโปรเจกต์จาก GitHub
git clone https://github.com/your-username/API-relay.git

# เข้าสู่โฟลเดอร์โปรเจกต์
cd API-relay

# ติดตั้ง dependencies
npm install
```

### 1.2 การติดตั้งส่วนขยายเบราว์เซอร์

สำหรับ **Chrome** หรือ **Edge**:

1. เปิดเบราว์เซอร์
2. ไปที่ `chrome://extensions/` (หรือ `edge://extensions/` สำหรับ Edge)
3. เปิดโหมด "นักพัฒนาซอฟต์แวร์" (Developer mode) โดยคลิกที่ปุ่มในมุมขวาบน
4. คลิกปุ่ม "โหลดส่วนขยายที่ไม่ได้บรรจุ" (Load unpacked)
5. เลือกโฟลเดอร์ `extension` ในโปรเจกต์ของคุณ
6. ส่วนขยายจะปรากฏในรายการส่วนขยาย

สำหรับ **Firefox**:

1. เปิดเบราว์เซอร์ Firefox
2. ไปที่ `about:debugging`
3. คลิก "This Firefox"
4. คลิกปุ่ม "Load Temporary Add-on"
5. เลือกไฟล์ `manifest.json` ในโฟลเดอร์ `extension`

## ขั้นตอนที่ 2: การเริ่มต้นเซิร์ฟเวอร์

### 2.1 การเริ่มต้นเซิร์ฟเวอร์ในโหมดพัฒนา

```bash
# เริ่มต้นเซิร์ฟเวอร์ในโหมดพัฒนา
npm run dev
```

เซิร์ฟเวอร์จะเริ่มทำงานบนพอร์ต 3000 (หรือตามที่ระบุในไฟล์ตั้งค่า)

### 2.2 การตรวจสอบการทำงานของเซิร์ฟเวอร์

เปิดเบราว์เซอร์และไปที่ `http://localhost:3000` เพื่อตรวจสอบว่าเซิร์ฟเวอร์ทำงานอย่างถูกต้อง

## ขั้นตอนที่ 3: การเชื่อมต่อกับผู้ให้บริการ AI

### 3.1 การเชื่อมต่อกับ ChatGPT

1. เปิดเบราว์เซอร์และไปที่ https://chat.openai.com
2. ล็อกอินเข้าสู่บัญชีของคุณ
3. ส่วนขยายจะทำงานอัตโนมัติเมื่อตรวจพบหน้าเว็บของ ChatGPT
4. ตรวจสอบในคอนโซลของเบราว์เซอร์ (F12) ควรจะปรากฏข้อความ `[ChatGPT Intercept] Provider initialized`

### 3.2 การเชื่อมต่อกับ Perplexity

1. เปิดเบราว์เซอร์และไปที่ https://www.perplexity.ai
2. ล็อกอินเข้าสู่บัญชีของคุณ
3. ส่วนขยายจะทำงานอัตโนมัติเมื่อตรวจพบหน้าเว็บของ Perplexity
4. ตรวจสอบในคอนโซลของเบราว์เซอร์ (F12) ควรจะปรากฏข้อความ `[Perplexity Intercept] Provider initialized`

## ขั้นตอนที่ 4: การใช้งาน API Relay

### 4.1 การทดสอบด้วย API Client

คุณสามารถทดสอบการทำงานของ API Relay โดยใช้ API Client เช่น Postman หรือ cURL:

```bash
# ทดสอบส่งข้อความไปยัง ChatGPT
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "สวัสดี ช่วยแนะนำตัวหน่อย"}
    ]
  }'
```

### 4.2 การใช้งานกับแอปพลิเคชัน

สำหรับการใช้งานจริง คุณสามารถใช้ API Relay กับแอปพลิเคชันของคุณโดยเชื่อมต่อกับ HTTP API:

```javascript
// ตัวอย่างการใช้งานกับ JavaScript
fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'อธิบายเกี่ยวกับปัญญาประดิษฐ์' }
    ]
  })
})
.then(response => response.json())
.then(data => {
  console.log(data.choices[0].message.content);
});
```

### 4.3 การใช้งานแบบสตรีม (Streaming)

สำหรับการรับข้อมูลแบบสตรีม:

```javascript
// ตัวอย่างการใช้งานแบบสตรีม
fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'เขียนโค้ด Python สำหรับคำนวณ Fibonacci' }
    ],
    stream: true
  })
})
.then(response => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  function readStream() {
    reader.read().then(({ done, value }) => {
      if (done) return;
      
      const chunk = decoder.decode(value);
      console.log(chunk);
      
      readStream();
    });
  }
  
  readStream();
});
```

## ขั้นตอนที่ 5: การปรับแต่งการตั้งค่า

### 5.1 การเปลี่ยนพอร์ตเซิร์ฟเวอร์

คุณสามารถเปลี่ยนพอร์ตเซิร์ฟเวอร์โดยแก้ไขไฟล์ `src/settings.ts`:

```typescript
export const settings = {
  // เปลี่ยนพอร์ตเซิร์ฟเวอร์
  port: process.env.PORT || 8080,
  
  // การตั้งค่าอื่นๆ
  timeout: 180000, // 3 นาที
  maxQueueSize: 10
};
```

### 5.2 การเพิ่มผู้ให้บริการใหม่

1. สร้างไฟล์ใหม่ในโฟลเดอร์ `extension/providers/` เช่น `newprovider.js`
2. เพิ่มโค้ดสำหรับจัดการผู้ให้บริการใหม่
3. แก้ไขไฟล์ `extension/manifest.json` เพื่อเพิ่ม URL ของผู้ให้บริการใหม่
4. รีโหลดส่วนขยายในเบราว์เซอร์

### 5.3 การปรับแต่งความเร็วและประสิทธิภาพ

คุณสามารถปรับแต่งพารามิเตอร์ต่างๆ ในไฟล์ `src/settings.ts`:

- `timeout`: ระยะเวลารอคำตอบสูงสุด (มิลลิวินาที)
- `maxQueueSize`: ขนาดคิวสูงสุด
- `concurrentLimit`: จำนวนคำขอที่ประมวลผลพร้อมกัน

## ปัญหาที่พบบ่อยและวิธีแก้ไข

### 1. ส่วนขยายไม่ทำงาน

**ปัญหา**: ส่วนขยายไม่ปรากฏในรายการหรือไม่ทำงาน

**วิธีแก้ไข**:
- ตรวจสอบว่าได้เปิดโหมดนักพัฒนาซอฟต์แวร์ในเบราว์เซอร์แล้ว
- รีโหลดส่วนขยายในหน้าจัดการส่วนขยาย
- ตรวจสอบในคอนโซลของเบราว์เซอร์ว่ามีข้อผิดพลาดหรือไม่

### 2. เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้

**ปัญหา**: ส่วนขยายไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้

**วิธีแก้ไข**:
- ตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่
- ยืนยันว่าใช้พอร์ตที่ถูกต้อง
- ตรวจสอบไฟร์วอลล์และการตั้งค่าความปลอดภัย

### 3. ไม่สามารถจับข้อมูลจากหน้าเว็บได้

**ปัญหา**: ส่วนขยายไม่สามารถจับข้อมูลจากหน้าเว็บของผู้ให้บริการ AI ได้

**วิธีแก้ไข**:
- รีเฟรชหน้าเว็บที่ต้องการใช้งาน
- ตรวจสอบว่า URL ของหน้าเว็บตรงกับที่ระบุใน `manifest.json`
- ตรวจสอบว่าได้ล็อกอินเข้าสู่บัญชีผู้ให้บริการ AI แล้ว

### 4. ข้อมูลตอบกลับไม่ครบถ้วน

**ปัญหา**: ได้รับข้อมูลตอบกลับแต่ไม่ครบถ้วน

**วิธีแก้ไข**:
- เพิ่มค่า timeout ในการตั้งค่า
- ตรวจสอบความเร็วในการเชื่อมต่ออินเทอร์เน็ต
- ยืนยันว่าใช้โมเดลที่รองรับฟังก์ชันที่ต้องการ

## แหล่งข้อมูลเพิ่มเติม

- [คู่มือการใช้งานแบบละเอียด](./user-manual-thai.md) - ศึกษาฟังก์ชันทั้งหมดของโปรแกรม
- [คำอธิบายสถาปัตยกรรมของระบบ](./architecture-explanation-thai.md) - ทำความเข้าใจโครงสร้างของระบบ
- [ผังการทำงานของระบบ](./flow-diagrams.md) - ดูภาพการทำงานของระบบแบบละเอียด
- [เอกสารอ้างอิง API](./api-reference-thai.md) - คู่มือการใช้งาน API ครบถ้วน

## การสนับสนุน

หากพบปัญหาในการใช้งาน คุณสามารถ:
- ตรวจสอบคำถามที่พบบ่อยใน [Wiki](https://github.com/your-username/API-relay/wiki)
- รายงานปัญหาใน [Issues](https://github.com/your-username/API-relay/issues)
- ติดต่อผ่าน [Discussions](https://github.com/your-username/API-relay/discussions)