# 📋 CHANGES.md — MHHCHECKER Feature Request File

> **Cách dùng**: Viết tính năng bạn muốn vào mục **"Requested Changes"** bên dưới rồi đưa file này cho AI.  
> AI sẽ tự động: viết code → viết test → push GitHub → CI/CD chạy test BE + FE + security → deploy lên Vercel.  
> **Việc của bạn: chỉ điền vào đây rồi ngồi nhìn.**

---

## 🗺️ Project Map (Không cần sửa — dùng để AI hiểu ngữ cảnh)

```
textcolor-contrast-checker/
├── backend/
│   ├── src/
│   │   ├── controllers/contrastController.ts   ← API handlers (POST /api/contrast, GET /api/contrast)
│   │   ├── routes/                             ← Express router
│   │   ├── utils/contrastCalculator.ts         ← Core WCAG logic (hexToRgb, luminance, ratio)
│   │   └── server.ts / index.ts
│   └── tests/contrast.test.ts                  ← Jest unit tests (232 lines, 32 tests)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ContrastChecker.tsx             ← Main page component
│   │   │   ├── ColorPicker.tsx                 ← Color input widget
│   │   │   ├── LivePreview.tsx                 ← Text preview box
│   │   │   └── WCAGResults.tsx                 ← Pass/fail badge grid
│   │   └── utils/contrastCalculator.ts         ← Client-side mirror of BE logic
│   └── index.html
├── .github/workflows/ci-cd.yml                 ← GitHub Actions: test-backend → build-frontend → deploy
└── vercel.json                                 ← Deploy target: Vercel (framework: vite)
```

**Stack**: React 18 + TypeScript + Tailwind CSS (FE) | Express + TypeScript + Jest (BE) | Vercel (hosting) | GitHub Actions (CI/CD)

**API hiện có**:
- `POST /api/contrast` body `{ foreground: "#hex", background: "#hex" }` → `{ ratio, ratioFormatted, passesAA, passesAAA, passesAALarge, passesAAALarge, level }`
- `GET  /api/contrast?fg=#hex&bg=#hex` → same response

**CI/CD pipeline hiện tại**:
1. `test-backend` → chạy Jest (npm test trong /backend)
2. `build-frontend` → TypeScript check + Vite build (npm run build trong /frontend)
3. `deploy` → Vercel production (chỉ khi push vào `main`)

---

## ✅ Completed Changes (Lịch sử — AI tự điền sau khi implement)

| # | Tính năng | File(s) thay đổi | Test | Deploy | Ngày |
|---|-----------|-----------------|------|--------|------|
| — | *(chưa có)* | — | — | — | — |

---

## 🆕 Requested Changes (← **VIẾT VÀO ĐÂY**)

> Xóa các mục mẫu bên dưới và thay bằng tính năng bạn muốn.  
> Dùng cú pháp như ví dụ — càng rõ càng tốt, không cần biết code.

---

### CHANGE-001 · [Tên tính năng ngắn gọn]

**Mô tả**: [Mô tả bạn muốn thêm/sửa gì trên web]

**Ví dụ hành vi mong muốn**:
- Người dùng làm X → web hiển thị Y
- Khi Z thì phải có W

**Vị trí trên web**: [Header / Phần nhập màu / Phần kết quả / Footer / Trang mới / ...]

**Loại thay đổi**:
- [ ] Chỉ frontend (giao diện, UX)
- [ ] Chỉ backend (API mới, logic mới)
- [ ] Cả hai

**Mức ưu tiên**: [Cao / Trung bình / Thấp]

**Ghi chú thêm**: [Màu sắc, font, icon, layout cụ thể — nếu có]

---

### CHANGE-002 · [Tên tính năng tiếp theo]

*(copy block CHANGE-001 ở trên và điền vào)*

---

## 🤖 Hướng dẫn cho AI khi nhận file này

Khi USER đưa file này cho AI (bạn hoặc AI khác trong IDE), AI phải làm **đúng thứ tự** sau:

### Bước 1 — Đọc & phân tích
- Đọc toàn bộ "Project Map" để hiểu cấu trúc
- Đọc tất cả mục trong "Requested Changes" chưa được tick ✅
- Nếu mô tả mơ hồ → hỏi USER trước, không tự đoán

### Bước 2 — Implement code
Với **mỗi CHANGE**:

#### 2a. Backend (nếu cần)
- Thêm logic vào `backend/src/utils/contrastCalculator.ts` hoặc tạo file utils mới
- Thêm endpoint mới vào `backend/src/controllers/` và `backend/src/routes/`
- **BẮT BUỘC**: Viết Jest test trong `backend/tests/` — tối thiểu:
  - Happy path (input hợp lệ → output đúng)
  - Edge cases (input rỗng, sai format, giá trị biên)
  - Error cases (input null/undefined → trả về đúng error)
  - Input validation (tham số thiếu → 400 status)

#### 2b. Frontend (nếu cần)
- Tạo component mới trong `frontend/src/components/` nếu logic phức tạp
- Chỉnh sửa `ContrastChecker.tsx` nếu thêm vào main layout
- Dùng Tailwind CSS — giữ nguyên design system hiện tại (màu xanh blue, rounded-2xl, shadow-sm)
- Đảm bảo responsive (mobile + desktop)

#### 2c. TypeScript
- Cập nhật types/interfaces nếu cần
- Không dùng `any` — strict types

### Bước 3 — Cập nhật CI/CD nếu cần
Chỉ sửa `.github/workflows/ci-cd.yml` khi:
- Thêm bước security scan mới
- Thêm FE test framework (ví dụ: Playwright, Vitest)
- Thêm lint/format step mới

**CI/CD pipeline hiện tại đã có** (không cần tạo lại):
```
push to main → test-backend (Jest) → build-frontend (tsc + vite build) → deploy Vercel
```

**Mở rộng pipeline theo yêu cầu**:
- FE testing: thêm job `test-frontend` với Vitest hoặc Playwright — chạy trước `build-frontend`
- Security: thêm job `security-scan` với `npm audit --audit-level=high` — chạy song song với test-backend
- Lint: thêm step `npx eslint` vào job `build-frontend` trước TypeScript check

### Bước 4 — Git commit & push
```bash
# Commit message format chuẩn:
git add .
git commit -m "feat(CHANGE-00X): <tên tính năng ngắn gọn>

- <điểm thay đổi 1>
- <điểm thay đổi 2>
- tests: <số lượng test cases thêm>"

git push origin main
```

> Push lên `main` → GitHub Actions tự chạy → Vercel tự deploy.  
> Không cần làm gì thêm.

### Bước 5 — Cập nhật file CHANGES.md này
Sau khi push thành công, AI phải:
1. Di chuyển CHANGE-00X từ "Requested Changes" vào bảng "Completed Changes"
2. Điền đầy đủ: File(s) thay đổi, số test thêm, status deploy, ngày

---

## 📐 Coding Standards (AI phải tuân theo)

### Backend
```typescript
// ✅ Function export đơn lẻ, pure function, có return type
export function myNewUtil(input: string): ResultType | null { ... }

// ✅ Error handling rõ ràng
if (!input) return null;
if (!/^#[0-9A-Fa-f]{3,6}$/.test(input)) return null;

// ✅ Test structure
describe('myNewUtil', () => {
  test('valid input returns correct result', () => { ... });
  test('returns null for empty string', () => { ... });
  test('returns null for invalid format', () => { ... });
});
```

### Frontend
```tsx
// ✅ Props interface
interface MyComponentProps {
  value: string;
  onChange: (v: string) => void;
}

// ✅ Component
export default function MyComponent({ value, onChange }: MyComponentProps) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">...</div>
}
```

### Vercel API Routes (nếu cần thêm serverless function)
```typescript
// File: api/myEndpoint.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) { ... }
```

---

## 🔐 Security Checklist (AI tự kiểm tra trước khi push)

- [ ] Không hardcode secret/token trong code
- [ ] Tất cả input từ user phải được validate và sanitize
- [ ] API endpoint mới phải có rate limiting hoặc input size limit
- [ ] `npm audit` không có vulnerability mức high/critical
- [ ] Không expose stack trace trong production response

---

## 🚀 Deploy Info

| Item | Value |
|------|-------|
| Platform | Vercel |
| Trigger | Push to `main` branch |
| Build command | `npm run build --workspace=frontend` |
| Output dir | `frontend/dist` |
| API serverless | `api/` folder (Vercel Functions) |
| Secrets cần có | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |

**Sau khi push**: Vào tab **Actions** trên GitHub để xem pipeline chạy.  
**Sau khi deploy**: Vercel gửi URL production tự động.

---

*File này được generate tự động bởi Antigravity AI — MHHCHECKER Project — 2026*
