# ORBLOX — Marketplace Roblox

> Plan & technical specification — **v1.2** (2026-05-03)
> Status: **Approved, ready for M0 implementation**
> Brand: **ORBLOX** — Project folder: `rolnuks/`

Web application production-ready untuk marketplace Roblox yang menjual **Robux
(Gamepass & Instan)** dan **Item Game**. Model hybrid: Robux dijual admin,
Item Game dijual multi-seller terverifikasi.

---

## 1. Ringkasan Arsitektur

### Tech Stack Final

| Layer                | Pilihan                                              |
| -------------------- | ---------------------------------------------------- |
| Frontend + Backend   | Next.js 14+ (App Router) + TypeScript                |
| UI                   | Tailwind CSS + shadcn/ui                             |
| Database             | PostgreSQL + Prisma ORM                              |
| Auth                 | NextAuth v5 (Auth.js) — Credentials (email/password) |
| Payment              | Midtrans (Snap + Webhook)                            |
| File Storage         | MinIO (self-hosted) atau Cloudflare R2               |
| Queue / Worker       | BullMQ + Redis                                       |
| Hosting              | VPS (Singapore/Jakarta) — Docker Compose + Nginx     |
| Monitoring           | Sentry (error), Uptime Kuma, pgBackRest              |
| Notifikasi           | In-app only (MVP). Email & push di phase 2           |
| Notif internal admin | Telegram Bot (opsional)                              |

### Prinsip Desain

- **Type-safe end-to-end** — Zod + Prisma + TS
- **Server-first** — Server Actions & Server Components by default
- **Idempotent payment handler** — aman terhadap retry webhook
- **Audit-first** — semua aksi admin tercatat di `AuditLog`
- **Security by default** — RBAC middleware, rate limiting, input validation

---

## 2. Marketplace Model (Hybrid)

| Kategori       | Seller                             | Fulfillment                                          |
| -------------- | ---------------------------------- | ---------------------------------------------------- |
| Robux Gamepass | Admin only                         | Manual — admin login Roblox, beli gamepass buyer     |
| Robux Instan   | Admin only                         | Manual — admin transfer via group payout / trade     |
| Item Game      | Admin + Multi-seller terverifikasi | Manual — seller kirim trade Roblox, buyer konfirmasi |

---

## 3. User Roles

1. **Guest** — browse katalog, lihat harga, belum bisa checkout
2. **Buyer** — akun terdaftar, checkout, lihat riwayat order, chat admin (tiket)
3. **Seller** (apply & verified) — list item game, kelola stock, earning, request payout
4. **Admin** — kelola produk Robux, verifikasi seller, proses order Robux, dispute,
   payout, dashboard analytics
5. **Staff** (opsional) — admin terbatas khusus fulfillment order Robux

---

## 4. Database Schema (Prisma — Core Entities)

```text
User            id, email, password, role, roblox_username, phone, balance, created_at
SellerProfile   user_id, store_name, verified, kyc_data, payout_bank, commission_rate
Category        id, name, slug, type (robux_gamepass | robux_instant | item_game)
Product         id, seller_id (nullable=admin), category_id, title, description,
                images[], base_price, stock, sku,
                robux_amount (nullable), includes_premium (bool),
                gamepass_required_amount (computed),
                delivery_method (GAMEPASS | GROUP_PAYOUT | TRADE | MANUAL_ITEM),
                game_id (nullable), status (draft|active|paused|rejected)
Order           id, buyer_id, status, total, payment_method,
                midtrans_order_id, notes, created_at
OrderItem       order_id, product_id, seller_id, qty, unit_price, subtotal,
                fulfillment_status, roblox_username_target, gamepass_link,
                proof_screenshot
Payment         order_id, provider, transaction_id, amount, status, raw_webhook_json
Payout          seller_id, amount, status, bank_info, processed_by, processed_at
Dispute         order_id, opened_by, reason, status, resolution
Review          order_id, rating, comment               # phase 2
Notification    user_id, type, payload, read_at
AuditLog        actor_id, action, target, diff, created_at
```

---

## 5. Katalog Produk — Harga Final

### 5.1 Robux Gamepass (konsisten Rp 120 / Robux)

| Nominal (Robux diterima) | Harga Buyer  | Gamepass Required (tax 30%) |
| ------------------------ | ------------ | --------------------------- |
| 100                      | Rp 12.000    | 143 R$                      |
| 500                      | Rp 60.000    | 715 R$                      |
| 1.000                    | Rp 120.000   | 1.429 R$                    |
| 5.000                    | Rp 600.000   | 7.143 R$                    |
| 10.000                   | Rp 1.200.000 | 14.286 R$                   |

Formula: `gamepass_required = ceil(robux_amount / 0.7)`
Ditampilkan otomatis di halaman instruksi checkout.

### 5.2 Robux Instan

| Paket                 | Harga        | Catatan                         |
| --------------------- | ------------ | ------------------------------- |
| 450 Robux + Premium   | Rp 75.000    | Bundle dengan Roblox Premium    |
| 1.000 Robux + Premium | Rp 145.000   | Bundle dengan Roblox Premium    |
| 2.200 Robux + Premium | Rp 290.000   | Bundle dengan Roblox Premium    |
| 500 Robux             | Rp 71.000    | Instan via group payout / trade |
| 820 Robux             | Rp 130.000   | Instan via group payout / trade |
| 1.000 Robux           | Rp 142.000   | Instan via group payout / trade |
| 2.000 Robux           | Rp 285.000   | Instan via group payout / trade |
| 4.400 Robux           | Rp 570.000   | Instan via group payout / trade |
| 5.500 Robux           | Rp 710.000   | Instan via group payout / trade |
| 11.000 Robux          | Rp 1.420.000 | Instan via group payout / trade |

Seed script akan insert produk-produk ini ke database saat setup awal.

### 5.3 Item Game

Kategori per game (Adopt Me, Blox Fruits, Grow a Garden, dll).
Multi-seller — listing oleh seller terverifikasi. Admin juga bisa listing.

---

## 6. Konfigurasi Bisnis

| Item                | Nilai                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| Platform fee seller | **3%** dari harga jual item game (dipotong saat release escrow)                     |
| Payout schedule     | **Manual** — seller request kapan saja, admin approve & transfer                    |
| Escrow auto-release | 48 jam setelah status `delivered` (jika buyer tidak konfirmasi & tidak ada dispute) |
| Payment gateway     | Midtrans Snap                                                                       |
| Email notifikasi    | ❌ Disabled di MVP (phase 2)                                                        |
| Currency            | IDR                                                                                 |
| Timezone            | Asia/Jakarta (WIB)                                                                  |

---

## 7. User Flow Utama

### 7.1 Flow Beli Robux Gamepass

1. Buyer pilih paket (mis. 100 Robux = Rp 12.000)
2. Input di form: `roblox_username` + `gamepass_link` (buyer bikin gamepass sendiri
   dengan nominal yang diinstruksikan, mis. 143 R$)
3. Checkout → Midtrans Snap → bayar
4. Webhook Midtrans → order `paid` → notif admin (dashboard + Telegram)
5. Admin proses: login Roblox store account → beli gamepass via link →
   update order ke `delivered`
6. Sistem auto-notif buyer + invoice (in-app download)

### 7.2 Flow Beli Robux Instan

1. Buyer pilih nominal
2. Input: `roblox_username` (+ instruksi join group toko untuk metode group payout)
3. Checkout → bayar
4. Admin proses via group payout / trade → `delivered`

### 7.3 Flow Beli Item Game (Multi-seller)

1. Buyer browse item → add to cart → checkout
2. Midtrans → `paid`
3. Order → `processing`, seller dinotifikasi
4. Seller kirim item via trade Roblox + upload bukti screenshot
5. Buyer klik "item diterima" → escrow release ke seller balance
   (fee 3% dipotong)
6. Jika buyer tidak konfirmasi 48 jam → auto-release (window dispute terbuka dulu)
7. Seller request payout → admin approve → transfer ke bank seller

### 7.4 Flow Jadi Seller

1. User daftar akun → lengkapi profile → apply jadi seller
2. Submit KYC (KTP, no HP, rekening bank) → admin review
3. Approved → bisa list produk item game

---

## 8. Feature List per Halaman

### Public

- Landing page (hero, featured produk, testimoni, FAQ)
- Katalog Robux (tab: Gamepass / Instan) + kalkulator nominal
- Katalog Item Game (filter: game, seller, harga, rarity)
- Product detail page
- Search global + filter

### Buyer Dashboard

- Profile & security (ubah password, 2FA di phase 2)
- Riwayat order + status tracking
- Invoice download (PDF generated)
- Tiket support ke admin
- Saldo (phase 2)

### Seller Dashboard

- Manajemen produk (CRUD, stock, harga)
- Order masuk + fulfillment workflow
- Earning + payout request
- Analytics basic (omset, order count, conversion)

### Admin Dashboard

- Kelola produk Robux (gamepass tier & instant tier)
- Verifikasi seller (KYC review)
- Proses order Robux (queue fulfillment) — tombol "Mark as Delivered" + notes
- Kelola dispute
- Payout approval
- User management (ban, role assign)
- Settings (harga Robux, fee, banner, FAQ, payment channel toggle)
- Reports (daily revenue, top products, pending orders)
- Audit log viewer

---

## 9. Security & Compliance

- **Payment integrity** — verifikasi signature Midtrans webhook, idempotency
- **Rate limiting** — Upstash/Redis untuk login, checkout, API publik
- **Input validation** — Zod di semua server action & API route
- **SQL injection** — Prisma (aman by default)
- **XSS** — sanitasi rich text (DOMPurify) untuk deskripsi produk
- **CSRF** — NextAuth built-in + same-site cookies
- **Password** — argon2id hashing
- **Upload** — mime check, size limit, virus scan (clamav opsional), signed URL
- **RBAC** — middleware per route grup (`/admin/**`, `/seller/**`)
- **Audit log** — semua aksi admin tercatat
- **Secrets** — `.env` tidak di-commit; production pakai sops / dotenv-vault
- **Backup** — daily PostgreSQL dump ke object storage, retention 30 hari
- **Legal pages** — ToS, Privacy Policy, Disclaimer Roblox (tidak berafiliasi
  dengan Roblox Corp)

---

## 10. Struktur Folder (Next.js App Router)

```text
rolnuks/                         # workspace folder (brand: ORBLOX)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (public)/          # landing, katalog, product detail
│   │   ├── (auth)/            # login, register, forgot password
│   │   ├── (buyer)/           # dashboard buyer
│   │   ├── (seller)/          # dashboard seller
│   │   ├── admin/             # dashboard admin
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── webhooks/midtrans/
│   │   │   └── upload/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui
│   │   ├── forms/
│   │   └── layout/
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── midtrans.ts
│   │   ├── redis.ts
│   │   └── validators/        # Zod schemas
│   ├── server/
│   │   ├── actions/           # Server Actions
│   │   ├── services/          # business logic (order, payment, fulfillment)
│   │   └── queue/             # BullMQ workers
│   ├── hooks/
│   └── types/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
├── scripts/
│   └── backup.sh
├── public/
│   └── logo.svg               # user akan provide
├── .env.example
├── AGENTS.md                  # project info & commands
├── PLAN.md                    # file ini
└── README.md
```

---

## 11. Roadmap / Milestones

| Phase                       | Scope                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| **M0 — Foundation**         | Scaffold Next.js, Prisma, NextAuth, Docker, CI/CD, design system, seed script produk Robux |
| **M1 — Katalog & Auth**     | Landing page, katalog produk publik, admin CRUD produk, register/login, user profile       |
| **M2 — Checkout Robux**     | Cart, checkout flow, Midtrans integration, webhook handler, order tracking buyer           |
| **M3 — Admin Fulfillment**  | Admin dashboard, queue proses order Robux, invoice PDF, notif in-app                       |
| **M4 — Item Game & Seller** | Seller registration + KYC, seller dashboard, escrow flow, dispute handling                 |
| **M5 — Payout & Polish**    | Payout seller, analytics, SEO optimization, rate limiting, error monitoring                |
| **M6 — Hardening & Launch** | Security audit, load test, backup/restore drill, deploy VPS production                     |
| **Phase 2** (post-launch)   | Email notif, chat realtime, review, voucher, referral, mobile app                          |

---

## 12. DevOps & Deployment

- **Dev**: Docker Compose (app + postgres + redis + minio)
- **Staging**: subdomain `staging.orblox.id` / `staging.orblox.com` (nanti saat domain siap)
- **Production**: VPS (2 vCPU / 4 GB awal) + Nginx reverse proxy + SSL
  (Let's Encrypt) + systemd service
- **CI/CD**: GitHub Actions → build Docker image → push registry → SSH deploy
- **Observability**: Sentry (error), Axiom / Grafana Loki (log), Uptime Kuma
- **Backup**: `pg_dump` harian → S3-compatible storage

---

## 13. Environment Variables (kunci utama)

```env
# App
NODE_ENV=development
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/orblox

# Redis / Queue
REDIS_URL=redis://localhost:6379

# Midtrans
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

# Storage (MinIO / R2)
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=orblox

# Telegram notif admin (opsional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
```

---

## 14. Keputusan yang Sudah Difinalkan

| #   | Keputusan            | Nilai                                          |
| --- | -------------------- | ---------------------------------------------- |
| 1   | Tech stack           | Next.js full-stack + TypeScript                |
| 2   | Marketplace model    | Hybrid (admin: Robux, multi-seller: item game) |
| 3   | Payment gateway      | Midtrans                                       |
| 4   | Robux fulfillment    | Manual (admin proses)                          |
| 5   | Database             | PostgreSQL + Prisma                            |
| 6   | Auth                 | NextAuth v5 (Credentials)                      |
| 7   | Hosting              | VPS (Singapore / Jakarta)                      |
| 8   | Harga Robux Gamepass | Rp 120 / Robux (5 tier)                        |
| 9   | Harga Robux Instan   | 10 paket (termasuk bundle + Premium)           |
| 10  | Fee seller           | 3% per transaksi item game                     |
| 11  | Payout               | Manual — request kapan saja                    |
| 12  | Logo                 | Disediakan user                                |
| 13  | Domain               | Setup saat launch                              |
| 14  | Email notif          | Disabled di MVP (in-app only)                  |

---

## 15. Open Questions (untuk diputuskan saat milestone relevan)

- Invoice PDF: pakai template HTML → Puppeteer, atau react-pdf?
- Rate limit key strategy: IP + user ID atau hanya user ID?
- Multi-currency: perlu support USD ke depan atau IDR only?
- KYC provider: manual review atau integrasi service (Privy, VIDA)?
- Mobile app: PWA saja atau native (React Native) di phase 2?

Keputusan ditunda sampai fase terkait agar fokus pada MVP.
