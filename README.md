# PRSDN Dashboard - Vue 3 + Vite

Sistem manajemen anggota, kehadiran, keuangan, dan kas online untuk organisasi RT/RW.

## 🚀 Features

### Admin Features
- **Dashboard**: Ringkasan keuangan, statistik anggota, grafik kehadiran, acara mendatang
- **Manajemen Anggota**: CRUD anggota dengan pencarian dan filter RT
- **Persetujuan Akun**: Approve/reject pendaftaran anggota baru
- **Buku Kas**: Kelola pemasukan dan pengeluaran
- **Kas Online**: Kelola iuran bulanan dengan auto-posting ke buku kas
- **Absensi**: Kelola event, generate token 30-detik, lihat check-in

### User Features
- **Dashboard**: Profil, status kas bulan ini, event aktif dengan countdown
- **Riwayat Kas**: Lihat history pembayaran kas bulanan
- **Riwayat Kehadiran**: Lihat history kehadiran di pertemuan
- **Absensi**: Check-in ke event aktif dengan token

### General Features
- **Pendaftaran Akun**: Form 2-step untuk pendaftaran anggota baru
- **Role-based Access**: Admin dan User dengan hak akses berbeda
- **Supabase Database**: PostgreSQL dengan Row Level Security
- **Responsive Design**: Mobile-friendly UI

## 📦 Tech Stack

- **Vue 3** - Progressive JavaScript Framework
- **Vite** - Next Generation Frontend Tooling
- **TypeScript** - Type Safety
- **Vue Router** - Official Router
- **Pinia** - State Management
- **Supabase** - Backend as a Service (PostgreSQL + Auth + Storage)
- **Chart.js** - Data Visualization
- **Lucide Vue** - Icon Library

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔑 Demo Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`

### User Account
- **Username**: `ahmadf`
- **Password**: `password123`

## 📊 Seed Data

The application comes with pre-populated data:
- **15 Members** across RT 01-04
- **6 Months** of attendance records
- **Finance Transactions** (income & expense)
- **Kas Payments** for 2 months
- **Upcoming Events** and birthdays
- **1 Pending Application** for testing approval workflow

## 🗄️ Database - Supabase

Aplikasi ini menggunakan **Supabase** (PostgreSQL) sebagai database production-ready dengan fitur:
- **Row Level Security (RLS)** - Keamanan tingkat baris
- **Real-time subscriptions** - Update data real-time
- **Auto-generated REST API** - API otomatis untuk semua tabel
- **Built-in authentication** - Sistem autentikasi terintegrasi

### Database Setup

Untuk setup database Supabase, ikuti panduan lengkap di:
📖 **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

Ringkasan singkat:
1. Buat project di [supabase.com](https://supabase.com)
2. Copy credentials (URL & anon key)
3. Setup environment variables (`.env`)
4. Jalankan database migrations
5. Test koneksi

### Environment Variables

Copy `.env.example` menjadi `.env` dan isi dengan credentials Supabase Anda:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Database Structure

Database terdiri dari 9 tabel:
- `members` - Data profil anggota
- `user_accounts` - Akun login (admin & user)
- `account_applications` - Pendaftaran anggota baru
- `attendance_records` - Rekap kehadiran bulanan
- `finance_transactions` - Transaksi keuangan
- `kas_payments` - Iuran kas bulanan
- `events` - Kalender acara & ulang tahun
- `attendance_events` - Event absensi dengan token
- `attendance_checkins` - Data check-in ke event

Semua tabel dilindungi dengan **Row Level Security (RLS)** policies.

## 📁 Project Structure

```
src/
├── assets/           # CSS styles
├── components/       # Reusable Vue components
├── mockdb/          # Mock database layer
│   ├── db.ts        # Database CRUD operations
│   └── seed.ts      # Seed data
├── pages/           # Page components
│   ├── admin/       # Admin pages
│   └── user/        # User pages
├── router/          # Vue Router configuration
├── stores/          # Pinia stores
├── types/           # TypeScript interfaces
├── App.vue          # Root component
└── main.ts          # Application entry point
```

## 🎨 Design System

The application uses an **Atlassian-inspired** design system:
- **Primary Color**: Dark Navy Blue (#1e3a8a)
- **Spacing**: 8px base system
- **Typography**: System fonts with clear hierarchy
- **Components**: Soft cards, generous spacing, subtle shadows
- **Responsive**: Mobile-first approach

## 🔐 Authentication & Authorization

- **Mock Authentication**: Username/password stored in plain text (for demo only)
- **Session Management**: localStorage-based sessions
- **Route Guards**: Automatic redirection based on role
- **Protected Routes**: Admin and User areas separated

## 💰 Kas Management Workflow

1. Admin navigates to **Kas Online** page
2. Selects **Year** and **Month**
3. System auto-initializes all members with default Rp 5,000
4. Admin can:
   - Edit payment amounts
   - Toggle paid/unpaid status
   - Filter by RT
5. On **Save**:
   - Kas payments are stored
   - Finance transaction is auto-created/updated
   - Income entry posted to ledger

## 📋 Attendance Events Workflow

### Admin: Create Event & Generate Token
1. Navigate to **Absensi** page
2. Click **Buat Event** to create new event
3. Fill in event details (title, date, time)
4. Click **Activate** to make event active
5. Click **Generate Token** to create 6-character token
6. Token is valid for exactly **30 seconds**
7. Click **Regenerate Token** to create new token when expired
8. View check-ins by clicking on event

### User: Check-in to Event
1. Navigate to **Absensi** page
2. See active event with countdown timer
3. Enter 6-character token (auto-uppercase)
4. Click **Check In**
5. System validates:
   - Event is active
   - Token matches and not expired
   - User hasn't already checked in
6. Success message displayed
7. User dashboard shows check-in status

## 📝 Application Approval Workflow

1. User submits application via `/apply` (2-step form)
2. Application status: **Pending**
3. Admin reviews in **Permohonan Akun** page
4. Admin clicks **Approve**:
   - Member record created
   - User account created (role: user, status: active)
   - Application status: **Approved**
5. User can now login

## 🧪 Testing Checklist

- [ ] Login as admin and user
- [ ] Create/edit/delete member
- [ ] Approve/reject application
- [ ] Add income/expense transactions
- [ ] Manage kas payments and verify auto-income creation
- [ ] View user dashboard and history
- [ ] Test database persistence (refresh page)
- [ ] Test RLS policies (user can't access admin data)

## 🚀 Deployment

Untuk deploy aplikasi ke production, ikuti panduan lengkap di:
📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Platform yang didukung:
- **Vercel** (Recommended)
- **Netlify**
- **Self-hosted** (VPS/Server dengan Nginx)

## 🚧 Future Enhancements

- [ ] Password hashing dengan bcrypt/argon2
- [ ] Email notifications untuk kas & events
- [ ] Export data ke Excel/PDF
- [ ] Advanced reporting & analytics
- [ ] Member photo uploads
- [ ] WhatsApp integration untuk reminders
- [ ] Real-time notifications
- [ ] Mobile app (React Native/Flutter)
- [ ] Multi-language support

## 📚 Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Panduan setup database
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Panduan deployment
- [Supabase Documentation](https://supabase.com/docs)
- [Vue 3 Documentation](https://vuejs.org)
- [Vite Documentation](https://vitejs.dev)

## 📄 License

This is a demo project for educational purposes.

## 👨‍💻 Development

Built with ❤️ using:
- Vue 3 + Vite + TypeScript
- Supabase (PostgreSQL)
- Pinia State Management
- Chart.js for visualizations

---

**Note**: Aplikasi ini menggunakan Supabase sebagai backend. Untuk production, pastikan sudah setup RLS policies, ganti password admin, dan enable backup database.
