# ผังการทำงานของ API Relay

## ภาพรวมการทำงานของระบบ

```mermaid
graph TB
    subgraph "Client-side"
        A[ผู้ใช้งาน] --> B[ส่วนขยายเบราว์เซอร์]
        B --> C[Content Script]
        B --> D[Background Script]
    end
    
    subgraph "Server-side"
        E[WebSocket Server]
        F[Queue Manager]
        G[API Relay]
    end
    
    subgraph "External APIs"
        H[ChatGPT]
        I[Perplexity]
        J[อื่นๆ]
    end
    
    C --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    
    H --> G
    I --> G
    J --> G
    
    G --> E
    E --> C
    C --> D
    D --> A
```

## 1. การติดตั้งและเริ่มต้นระบบ

```mermaid
sequenceDiagram
    participant U as ผู้ใช้งาน
    participant B as เบราว์เซอร์
    participant E as ส่วนขยาย
    participant S as เซิร์ฟเวอร์ API Relay
    
    U->>B: 1. ติดตั้งส่วนขยาย
    U->>B: 2. โหลดส่วนขยายจากโฟลเดอร์
    U->>S: 3. เริ่มต้นเซิร์ฟเวอร์ (npm run dev)
    B->>E: 4. โหลดส่วนขยาย
    E->>S: 5. เชื่อมต่อ WebSocket
    S->>E: 6. ยืนยันการเชื่อมต่อ
    E->>B: 7. แสดงสถานะพร้อมใช้งาน
    B->>U: 8. แสดงไอคอนส่วนขยายพร้อมใช้งาน
```

## 2. การส่งข้อความและรับคำตอบจาก AI

```mermaid
sequenceDiagram
    participant U as ผู้ใช้งาน
    participant A as แอปพลิเคชัน
    participant E as ส่วนขยาย
    participant S as เซิร์ฟเวอร์
    participant P as ผู้ให้บริการ AI
    
    U->>A: 1. ป้อนข้อความ
    A->>E: 2. ส่งข้อความ (RELAY_INSERT_TEXT)
    E->>E: 3. ฉีดข้อความในหน้าเว็บ
    A->>E: 4. สั่งส่งข้อความ (RELAY_CLICK_SEND)
    E->>E: 5. คลิกปุ่มส่งในหน้าเว็บ
    
    Note over E,P: การจับข้อมูลสตรีม
    E->>E: 6. เริ่มจับข้อมูลตอบกลับ
    P->>E: 7. ส่งข้อมูลสตรีม
    E->>S: 8. ส่งข้อมูลตอบกลับ
    S->>A: 9. ส่งข้อมูลให้แอปพลิเคชัน
    A->>U: 10. แสดงผลลัพธ์
```

## 3. การจัดการคิวของคำขอ

```mermaid
flowchart TD
    A[รับคำขอใหม่] --> B{ตรวจสอบคิว}
    B -->|ว่าง| C[ประมวลผลทันที]
    B -->|ไม่ว่าง| D[เพิ่มในคิว]
    
    C --> E[ส่งไปยังผู้ให้บริการ AI]
    D --> F[รอคิวหน้า]
    F --> G{ตรวจสอบคิว}
    G -->|ถึงคิว| E
    
    E --> H[รับข้อมูลตอบกลับ]
    H --> I[ส่งกลับไปยังผู้ใช้]
    I --> J[ลบคำขอออกจากคิว]
    J --> G
    
    G -->|ยังมีคิว| F
    G -->|ไม่มีคิว| K[หมดคิว]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
    style I fill:#c8e6c9
    style K fill:#fff3e0
```

## 4. การจัดการข้อผิดพลาด

```mermaid
stateDiagram-v2
    [*] --> เชื่อมต่อ
    เชื่อมต่อ --> พร้อมใช้งาน: สำเร็จ
    เชื่อมต่อ --> ข้อผิดพลาด: ล้มเหลว
    พร้อมใช้งาน --> ประมวลผล: รับคำขอ
    ประมวลผล --> เชื่อมต่อ: ตัดการเชื่อมต่อ
    
    ประมวลผล --> รอคำตอบ: ส่งคำขอ
    รอคำตอบ --> สำเร็จ: ได้รับคำตอบ
    รอคำตอบ --> หมดเวลา: ไม่ได้รับคำตอบ
    
    สำเร็จ --> ส่งคำตอบ: แปลงข้อมูล
    ส่งคำตอบ --> พร้อมใช้งาน: เสร็จสิ้น
    
    หมดเวลา --> ส่งข้อผิดพลาด
    ข้อผิดพลาด --> เชื่อมต่อ: ลองใหม่
    
    note right of หมดเวลา: รอคำตอบนานเกินไป
    note right of ข้อผิดพลาด: แจ้งเตือนผู้ใช้
```

## 5. การสนทนาหลายคำถาม

```mermaid
sequenceDiagram
    participant U as ผู้ใช้งาน
    participant A as แอปพลิเคชัน
    participant E as ส่วนขยาย
    participant S as เซิร์ฟเวอร์
    participant Q as คิว
    
    loop สนทนาต่อเนื่อง
        U->>A: 1. ป้อนคำถามใหม่
        A->>S: 2. ส่งคำขอ
        S->>Q: 3. เพิ่มในคิว
        
        alt คิวว่าง
            Q->>S: 4a. ดำเนินการทันที
        else คิวไม่ว่าง
            Q->>S: 4b. รอคิวหน้า
        end
        
        S->>E: 5. ส่งไปยังผู้ให้บริการ AI
        E->>S: 6. ส่งข้อมูลตอบกลับ
        S->>A: 7. ส่งผลลัพธ์
        A->>U: 8. แสดงคำตอบ
        
        S->>Q: 9. ลบคำขอออกจากคิว
    end
```

## 6. การสนับสนุนผู้ให้บริการหลายราย

```mermaid
graph LR
    subgraph "แอปพลิเคชันของคุณ"
        A[UI หลัก]
    end
    
    subgraph "API Relay"
        B[WebSocket Server]
        C[Provider Manager]
    end
    
    subgraph "Providers"
        D[ChatGPT Provider]
        E[Perplexity Provider]
        F[Other Providers]
    end
    
    subgraph "External Services"
        G[ChatGPT API]
        H[Perplexity Web]
        I[Other AI Services]
    end
    
    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    
    D --> G
    E --> H
    F --> I
    
    G --> D
    H --> E
    I --> F
    
    D --> C
    E --> C
    F --> C
    
    C --> B
    B --> A
    
    style A fill:#e1f5fe
    style B fill:#c8e6c9
    style C fill:#c8e6c9
    style G fill:#fff3e0
    style H fill:#fff3e0
    style I fill:#fff3e0
```

## 7. การจัดการโมเดล AI ต่างๆ

```mermaid
flowchart TD
    A[ผู้ใช้เลือกโมเดล] --> B{ตรวจสอบประเภทผู้ให้บริการ}
    
    B -->|ChatGPT| C[ส่งไปยัง ChatGPT Provider]
    B -->|Perplexity| D[ส่งไปยัง Perplexity Provider]
    B -->|อื่นๆ| E[ส่งไปยัง Provider ที่เกี่ยวข้อง]
    
    C --> F[แปลงรูปแบบคำขอ]
    D --> G[แปลงรูปแบบคำขอ]
    E --> H[แปลงรูปแบบคำขอ]
    
    F --> I[ส่งคำขอ]
    G --> J[ส่งคำขอ]
    H --> K[ส่งคำขอ]
    
    I --> L[รับข้อมูลตอบกลับ]
    J --> M[รับข้อมูลตอบกลับ]
    K --> N[รับข้อมูลตอบกลับ]
    
    L --> O[แปลงรูปแบบตอบกลับ]
    M --> P[แปลงรูปแบบตอบกลับ]
    N --> Q[แปลงรูปแบบตอบกลับ]
    
    O --> R[ส่งกลับให้ผู้ใช้]
    P --> R
    Q --> R
    
    style A fill:#e1f5fe
    style I fill:#c8e6c9
    style J fill:#c8e6c9
    style K fill:#c8e6c9
    style R fill:#fff3e0
```

## อธิบายภาพรวมการทำงาน

API Relay ทำงานในลักษณะของสะพานเชื่อม (bridge) ที่ช่วยให้คุณสามารถใช้งาน AI หลายๆ ตัวผ่านอินเทอร์เฟซเดียวกัน:

1. **การเริ่มต้น**: เมื่อเปิดใช้งาน ส่วนขยายจะเชื่อมต่อกับเซิร์ฟเวอร์ผ่าน WebSocket เพื่อสร้างช่องทางการสื่อสารแบบเรียลไทม์

2. **การส่งคำขอ**: เมื่อผู้ใช้ส่งข้อความ ส่วนขยายจะฉีดข้อความนั้นในหน้าเว็บของผู้ให้บริการ AI แล้วจำลองการคลิกปุ่มส่ง

3. **การจับข้อมูล**: ส่วนขยายจะจับการตอบสนองจากผู้ให้บริการ AI ทั้งแบบสตรีมและแบบข้อมูลเต็ม

4. **การส่งกลับ**: ข้อมูลจะถูกแปลงรูปแบบให้เข้ากันได้กับ API มาตรฐาน เช่น OpenAI หรือ Anthropic ก่อนส่งกลับให้แอปพลิเคชันของผู้ใช้

5. **การจัดการคิว**: คำขอจะถูกจัดเก็บในคิวเพื่อประมวลผลตามลำดับ ทำให้สามารถจัดการคำขอหลายรายการได้อย่างเป็นระบบ