# secretive-cobweb

### Setup and Deploy

#### 1. ติดตั้ง dependencies

```bash
npm install
```

#### 2. เพิ่มหรือแก้ไขบทความ ด้วย editor ให้เรียบร้อย

ดูตัวอย่างด้วยคำสั่งนี้
```bash
npx zenn preview
```

#### 3. build เป็น static html
```bash
npm run build
```

#### 4. push ไป deploy บน github page
```bash
git add .
git commit -m "feat: update article"
git push
```

##### 5. เรียบร้อย ไปเช็คดูผลลัพธ์ที่หน้า github page