# Deployment Guide - PRSDN Dashboard

Panduan deployment aplikasi PRSDN Dashboard dengan Supabase ke production.

## � Quick Start: Deploy via GitHub & Vercel (Recommended)

Karena Anda sudah push code ke GitHub, cara termudah adalah menghubungkan repository GitHub Anda langsung ke Vercel.

**Langkah-langkah:**

1.  **Buka Vercel Dashboard:**
    - Login ke [vercel.com](https://vercel.com).
    - Klik tombol **"Add New..."** -> **"Project"**.

2.  **Import Git Repository:**
    - Di bagian "Import Git Repository", cari repository `prsdn-dashboard` (pastikan akun GitHub Anda sudah terhubung).
    - Klik **"Import"**.

3.  **Configure Project:**
    - **Framework Preset:** Vercel biasanya otomatis mendeteksi **Vite**. Jika tidak, pilih **Vite**.
    - **Root Directory:** `./` (biarkan default).
    - **Environment Variables:**
      - Buka file `.env` di komputer lokal Anda (JANGAN commit file ini).
      - Copy value dari `.env` dan masukkan ke Vercel:
        - `VITE_SUPABASE_URL`: (URL Project Supabase Anda)
        - `VITE_SUPABASE_ANON_KEY`: (Anon Key Project Supabase Anda)

4.  **Deploy:**
    - Klik tombol **"Deploy"**.
    - Tunggu proses build selesai.

5.  **Finish!**
    - Aplikasi Anda sekarang online!
    - Vercel akan otomatis redeploy setiap kali Anda push update ke branch `main`.

> **Note:** File `vercel.json` sudah dibuat di repository untuk menangani routing (agar page refresh tidak error 404).

---

## �📋 Prasyarat

- ✅ Supabase project sudah setup (lihat [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- ✅ Database migrations sudah dijalankan
- ✅ Aplikasi sudah ditest di local
- ✅ Git repository (opsional tapi recommended)

## 🚀 Pilihan Deployment

### Option 1: Vercel (Recommended)

Vercel adalah platform deployment gratis yang sangat cocok untuk Vue/Vite apps.

#### Setup Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login ke Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # Build production
   npm run build
   
   # Deploy
   vercel
   ```

4. **Set Environment Variables di Vercel Dashboard:**
   - Buka project di [vercel.com](https://vercel.com)
   - Settings → Environment Variables
   - Tambahkan:
     - `VITE_SUPABASE_URL` = your-supabase-url
     - `VITE_SUPABASE_ANON_KEY` = your-anon-key

5. **Redeploy untuk apply env variables:**
   ```bash
   vercel --prod
   ```

#### Auto-Deploy dari Git

1. **Push code ke GitHub/GitLab/Bitbucket**
2. **Import project di Vercel Dashboard**
3. **Set environment variables**
4. **Deploy!**

Setiap push ke branch main akan auto-deploy.

---

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   # Build
   npm run build
   
   # Deploy
   netlify deploy --prod
   ```

4. **Set Environment Variables:**
   - Buka Netlify Dashboard
   - Site settings → Environment variables
   - Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`

---

### Option 3: Self-Hosted (VPS/Server)

#### Menggunakan Nginx

1. **Build aplikasi:**
   ```bash
   npm run build
   ```

2. **Upload folder `dist` ke server**

3. **Setup Nginx config:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       root /var/www/prsdn-dashboard/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

4. **Reload Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Setup SSL dengan Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔒 Security Checklist

Sebelum deploy ke production:

### 1. Ganti Password Admin
```sql
-- Jalankan di Supabase SQL Editor
UPDATE user_accounts 
SET password = 'new-strong-password-here'
WHERE username = 'admin';
```

> **⚠️ PENTING:** Untuk production yang sebenarnya, gunakan password hashing (bcrypt, argon2, dll.)

### 2. Review RLS Policies
- Pastikan semua tabel punya RLS enabled
- Test akses dengan akun user biasa
- Pastikan user tidak bisa akses data admin

### 3. Environment Variables
- ✅ Jangan commit file `.env` ke Git
- ✅ Gunakan environment variables di platform deployment
- ✅ Jangan expose `service_role` key di frontend

### 4. Supabase Settings
- Enable "Email confirmations" jika pakai email auth
- Set "Site URL" di Supabase → Authentication → URL Configuration
- Review "Auth Providers" settings

---

## 📊 Monitoring & Maintenance

### Supabase Dashboard

Monitor aplikasi melalui Supabase Dashboard:

1. **Database:**
   - Table Editor: Lihat data real-time
   - SQL Editor: Jalankan queries
   - Database: Monitor size & performance

2. **Authentication:**
   - Users: Lihat daftar user
   - Policies: Review RLS policies

3. **Logs:**
   - API Logs: Monitor API requests
   - Postgres Logs: Debug database issues

### Backup Database

Setup automatic backups di Supabase:

1. **Buka Supabase Dashboard → Settings → Database**
2. **Enable "Point in Time Recovery" (PITR)** (Pro plan)
3. **Atau export manual:**
   ```bash
   # Menggunakan Supabase CLI
   supabase db dump -f backup.sql
   ```

### Performance Monitoring

1. **Monitor Supabase Usage:**
   - Dashboard → Settings → Usage
   - Cek database size, API requests, bandwidth

2. **Optimize Queries:**
   - Gunakan indexes untuk queries yang sering
   - Review slow queries di Postgres Logs

3. **Caching:**
   - Implement client-side caching untuk data yang jarang berubah
   - Gunakan Supabase Realtime hanya untuk data yang perlu real-time

---

## 🔄 Update & Rollback

### Update Aplikasi

1. **Test di local:**
   ```bash
   npm run dev
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   # Vercel
   vercel --prod
   
   # Netlify
   netlify deploy --prod
   ```

### Database Migrations

Untuk update schema database:

1. **Buat migration file baru:**
   ```sql
   -- supabase/migrations/05_add_new_feature.sql
   ALTER TABLE members ADD COLUMN new_field VARCHAR(255);
   ```

2. **Test di local Supabase (jika pakai CLI):**
   ```bash
   supabase db reset
   ```

3. **Apply di production:**
   - Buka Supabase Dashboard → SQL Editor
   - Run migration file
   - Atau gunakan: `supabase db push`

### Rollback

Jika ada masalah:

1. **Rollback Aplikasi:**
   - Vercel/Netlify: Revert ke deployment sebelumnya di dashboard
   - Self-hosted: Deploy versi lama dari Git

2. **Rollback Database:**
   - Gunakan PITR (Point in Time Recovery) jika ada
   - Atau restore dari backup manual

---

## 🐛 Troubleshooting Production

### Error: "Failed to fetch"
- Cek Supabase URL dan API key
- Cek CORS settings di Supabase
- Cek network/firewall

### Error: "Row Level Security policy violation"
- Review RLS policies
- Cek user role dan permissions
- Test dengan akun berbeda

### Slow Performance
- Add database indexes
- Optimize queries
- Enable caching
- Upgrade Supabase plan jika perlu

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm run build -- --force`
- Check TypeScript errors: `npm run build`

---

## 📈 Scaling

Ketika aplikasi berkembang:

### Database
- **Upgrade Supabase Plan:** Untuk lebih banyak storage & bandwidth
- **Add Indexes:** Untuk queries yang lambat
- **Partitioning:** Untuk tabel yang sangat besar

### Application
- **CDN:** Gunakan CDN untuk static assets
- **Caching:** Implement Redis/Memcached
- **Load Balancing:** Untuk traffic tinggi

### Monitoring
- **Error Tracking:** Sentry, Rollbar
- **Analytics:** Google Analytics, Plausible
- **Uptime Monitoring:** UptimeRobot, Pingdom

---

## ✅ Post-Deployment Checklist

- [ ] Aplikasi bisa diakses di production URL
- [ ] Login admin berhasil
- [ ] Login user berhasil
- [ ] Semua fitur CRUD berfungsi
- [ ] RLS policies berfungsi dengan benar
- [ ] Password admin sudah diganti
- [ ] Environment variables sudah di-set
- [ ] Backup database sudah di-setup
- [ ] Monitoring sudah aktif
- [ ] SSL certificate aktif (HTTPS)
- [ ] Custom domain sudah di-setup (jika ada)

---

## 📞 Support

Jika ada masalah:

1. **Cek Logs:**
   - Browser Console (F12)
   - Supabase Logs
   - Platform logs (Vercel/Netlify)

2. **Dokumentasi:**
   - [Supabase Docs](https://supabase.com/docs)
   - [Vite Docs](https://vitejs.dev)
   - [Vue Router Docs](https://router.vuejs.org)

3. **Community:**
   - Supabase Discord
   - Stack Overflow
   - GitHub Issues

---

**Selamat! Aplikasi Anda sudah production-ready! 🎉**
