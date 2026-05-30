# 🤖 AI_AGENT_FIX.md — Hướng dẫn cho Claude trong IDE

> **Cách dùng**: Khi `test-backend` CI fail → lấy log lỗi → đưa file này + log cho Claude trong IDE.  
> Claude sẽ tự đọc code, chẩn đoán, sửa, chạy test để tự kiểm tra, rồi commit & push.  
> **Không cần API key. Không cần chạy script.** Claude trong IDE có tool thật.

---

## Thông tin project

```
textcolor-contrast-checker/
├── backend/
│   ├── src/utils/contrastCalculator.ts   ← core WCAG logic (thường là nơi có bug)
│   ├── src/controllers/contrastController.ts
│   └── tests/contrast.test.ts             ← KHÔNG được sửa test file này
├── frontend/src/...
└── .github/workflows/ci-cd.yml
```

**Backend stack**: Node.js · TypeScript · Express · Jest  
**Test command**: `cd backend && npm test`  
**Readonly files** (Claude không được sửa):
- `backend/tests/contrast.test.ts`
- `.github/workflows/ci-cd.yml`

---

## 📋 Hướng dẫn cho Claude — làm đúng thứ tự này

Khi USER đưa file này kèm log lỗi Jest:

### Bước 1 — Đọc và chẩn đoán
- Đọc toàn bộ log lỗi (USER sẽ paste hoặc attach)
- Dùng `view_file` đọc các file source liên quan
- Xác định **root cause** — không đoán mò, phải có lý do cụ thể

```
Ví dụ log:
● getRelativeLuminance › white → luminance exactly 1
  Expected: 1   Received: 1.0004
→ Root cause: Math.pow((1.0 + 0.055) / 1.055, 2.4) bị IEEE 754 floating-point error
→ Fix: clamp output về [0, 1]
```

### Bước 2 — Viết fix
- Sửa **chỉ implementation files**, không bao giờ sửa test
- Giữ nguyên toàn bộ file — chỉ thay đổi phần cần sửa
- Không thêm dependency mới

### Bước 3 — Tự chạy test để kiểm tra (BẮT BUỘC)
```bash
# Claude dùng run_command để chạy:
cd backend && npm test
```
- Nếu test vẫn fail → đọc lại → sửa tiếp → chạy lại (tối đa 5 lần)
- Chỉ tiến sang bước 4 khi **tất cả test đều xanh**

### Bước 4 — Commit & push
```bash
git add <file đã sửa>
git commit -m "fix(<tên-module>): <mô tả ngắn gọn root cause>

- <điểm thay đổi 1>
- <điểm thay đổi 2>
- verified: npm test passes locally before commit"

git push origin main
```

### Bước 5 — Báo kết quả
- Tóm tắt: đã sửa gì, tại sao, test pass chưa
- Nếu không thể fix an toàn → nói rõ lý do, đừng đoán

---

## ⚠️ Safety rules

| Được làm | Không được làm |
|----------|----------------|
| Sửa implementation files | Sửa test files |
| Thêm clamp/guard cho giá trị | Xoá test cases |
| Fix logic bug | Hạ threshold để test pass |
| Thêm null check | Thêm `// @ts-ignore` |

---

## Ví dụ thực tế — lần fail trước

**Log nhận được:**
```
● white (255,255,255) → luminance exactly 1
  Expected: 1   Received: 1.0004
```

**Claude đã làm:**
1. `view_file` → đọc `contrastCalculator.ts`
2. Nhận ra: `Math.pow((1.0 + 0.055) / 1.055, 2.4)` trả về 1.0004 vì IEEE 754
3. Sửa `linearize()`: thêm `Math.min(1, Math.max(0, linear))`
4. `run_command: cd backend && npm test` → **41/41 passed** ✅
5. Commit + push → CI xanh hết

**Commit message chuẩn:**
```
fix(backend): clamp linearize() output to [0,1] to fix IEEE 754 precision bug

linearize(255) was returning ~1.0004 instead of 1.0 because
(1.0 + 0.055) and the literal 1.055 have different IEEE 754 double
bit patterns. Clamping to [0,1] is mathematically correct.

verified: npm test passes locally before commit
```

---

*File này là hướng dẫn cho Claude trong IDE — không phải script chạy tự động.*  
*Claude dùng tool thật: view_file · run_command · replace_file_content · git*
