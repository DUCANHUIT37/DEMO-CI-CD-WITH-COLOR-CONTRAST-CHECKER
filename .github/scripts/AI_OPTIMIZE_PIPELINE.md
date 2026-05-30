# ⚙️ AI_OPTIMIZE_PIPELINE.md — Hướng dẫn cho Claude trong IDE

> **Cách dùng**: Khi muốn tối ưu CI/CD pipeline → đưa file này cho Claude trong IDE.  
> Claude sẽ đọc `ci-cd.yml`, phân tích, áp dụng các tối ưu, rồi commit & push (hoặc mở PR).  
> **Không cần API key. Không cần chạy script.** Claude trong IDE có tool thật.

---

## Thông tin pipeline hiện tại

**File**: `.github/workflows/ci-cd.yml`  
**Platform**: GitHub Actions → Vercel  
**Trigger**: push to `main`, pull_request to `main`

**Jobs hiện có:**
| Job | Trigger | Làm gì |
|-----|---------|--------|
| `test-backend` | push + PR | Jest tests |
| `build-frontend` | push + PR | tsc + vite build |
| `dependency-review` | PR only | kiểm tra vulnerability |
| `ai-agent-fix` | test fail | AI sửa lỗi |
| `deploy` | push + pass | deploy Vercel |
| `ai-optimize-pipeline` | sau deploy | AI tối ưu workflow |

---

## 📋 Hướng dẫn cho Claude — làm đúng thứ tự này

Khi USER đưa file này:

### Bước 1 — Đọc và phân tích workflow hiện tại
```
view_file: .github/workflows/ci-cd.yml
```
Đọc toàn bộ, ghi nhớ:
- Số lần `npm ci` chạy (hiện tại: 3 lần riêng biệt)
- Có `cache:` không và scope ra sao
- Có `timeout-minutes` không
- Có `concurrency` group không
- Có `permissions` block không
- Có path filter không

### Bước 2 — Áp dụng các tối ưu bên dưới

Kiểm tra từng mục, chỉ thêm những gì chưa có:

#### ✅ 2a. Path-based filtering
Chỉ chạy đúng job khi đúng file thay đổi. Tiết kiệm runner minutes.

```yaml
# Trong test-backend
on:
  push:
    paths:
      - 'backend/**'
      - '.github/workflows/**'

# Trong build-frontend  
on:
  push:
    paths:
      - 'frontend/**'
      - '.github/workflows/**'
```

#### ✅ 2b. Concurrency cancel
Huỷ run cũ khi có push mới trên cùng branch:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

#### ✅ 2c. Timeout per job
Tránh job bị treo vô hạn:
```yaml
timeout-minutes: 10   # test/build
timeout-minutes: 15   # deploy
```

#### ✅ 2d. Scoped permissions (principle of least privilege)
```yaml
permissions:
  contents: read         # mặc định cho test/build
  # contents: write      # chỉ khi cần push
  # pull-requests: write # chỉ khi cần tạo PR
```

#### ✅ 2e. Cache scope theo workspace
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json  # ← scope cụ thể
```

#### ✅ 2f. Dependency review trên PR
```yaml
dependency-review:
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/dependency-review-action@v4
      with:
        fail-on-severity: high
```

### Bước 3 — Viết lại ci-cd.yml
- Dùng `replace_file_content` hoặc `write_to_file`
- Giữ nguyên **tất cả jobs hiện có**, chỉ thêm/sửa phần cần tối ưu
- Không xóa job nào
- Validate YAML bằng cách đọc lại sau khi sửa

### Bước 4 — Commit & push (hoặc mở PR nếu thay đổi lớn)

**Nếu thay đổi nhỏ (thêm timeout, permissions):**
```bash
git add .github/workflows/ci-cd.yml
git commit -m "perf(ci): optimize pipeline - <tóm tắt các thay đổi>"
git push origin main
```

**Nếu thay đổi lớn (path filter, restructure jobs):**
```bash
git checkout -b ci-optimize/YYYYMMDD
git add .github/workflows/ci-cd.yml
git commit -m "perf(ci): major pipeline optimization"
git push origin ci-optimize/YYYYMMDD
# → mở PR để review trước khi merge
```

### Bước 5 — Báo kết quả
Liệt kê rõ:
- Đã thêm/sửa gì
- Tại sao (lợi ích cụ thể: tiết kiệm bao nhiêu minutes, giảm risk gì)
- Cần review gì trước khi merge

---

## ⚠️ Safety rules

| Được làm | Không được làm |
|----------|----------------|
| Thêm timeout, permissions | Xóa jobs hiện có |
| Thêm concurrency group | Thay đổi logic deploy |
| Tối ưu cache scope | Sửa secrets/token handling |
| Thêm path filters | Disable security checks |
| Thêm dependency-review | Thêm `continue-on-error: true` vào test |

---

## Ví dụ output mong muốn

Sau khi Claude chạy xong, commit message chuẩn:
```
perf(ci): optimize GitHub Actions pipeline

- add concurrency cancel-in-progress to save runner minutes
- scope npm cache to workspace package-lock.json
- add timeout-minutes: 10/15 per job to prevent hung runners  
- harden permissions to least-privilege per job
- add dependency-review job on pull requests
- no behavioral changes to test/build/deploy logic
```

---

## Tại sao dùng Claude trong IDE thay vì API script?

| | API script (cũ) | Claude trong IDE (mới) |
|---|---|---|
| Tool access | Chỉ có STDIN/STDOUT | view_file, run_command, replace_file_content |
| Đọc file | Phải hardcode danh sách file | Tự quyết định đọc file nào |
| Chạy test | Dùng `child_process.execSync` | Dùng `run_command` tool thật |
| Cần API key trong GitHub | ✅ Có (tốn tiền mỗi CI run) | ❌ Không cần |
| Kiểm soát | CI chạy ngầm, khó debug | Bạn thấy từng bước Claude làm |
| Linh hoạt | Cố định theo prompt trong script | Có thể hỏi thêm Claude |

---

*File này là hướng dẫn cho Claude trong IDE — không phải script chạy tự động.*  
*Claude dùng tool thật: view_file · run_command · replace_file_content · git*
