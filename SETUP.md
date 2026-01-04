# 🛠️ Setup Instructions

## Complete Setup Guide

### Step 1: Database Setup

1. **Create Database:**
```bash
mysql -u root -p
CREATE DATABASE mlm_manager;
EXIT;
```

2. **Run Schema:**
```bash
cd database
mysql -u root -p mlm_manager < 01_init.sql
mysql -u root -p mlm_manager < 02_performance_indexes.sql
```

3. **Verify:**
```bash
mysql -u root -p mlm_manager -e "SHOW TABLES;"
```

### Step 2: Backend Setup

1. **Install Dependencies:**
```bash
cd backend
npm install
```

2. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start Backend:**
```bash
npm start
```

4. **Verify:**
```bash
curl http://localhost:8081/api/health
```

### Step 3: Mobile App Setup

1. **Install Dependencies:**
```bash
cd mobile-app
npm install
```

2. **Configure API URL:**
Edit `app.config.js`:
```javascript
extra: {
  apiUrl: "http://YOUR_IP:8081/api"
}
```

3. **Start Development:**
```bash
npx expo start
```

### Step 4: Testing

1. **Test Backend:**
   - Health check endpoint
   - Login endpoint
   - Signup endpoint

2. **Test Mobile App:**
   - Open in Expo Go
   - Test login
   - Test signup
   - Test payment flow

---

## 🔧 Troubleshooting

### Database Connection Issues
- Check MySQL is running
- Verify credentials in .env
- Check firewall settings

### Backend Issues
- Check port 8081 is available
- Verify database connection
- Check environment variables

### Mobile App Issues
- Verify API URL is correct
- Check network connectivity
- Clear Expo cache: `npx expo start --clear`

---

## ✅ Verification Checklist

- [ ] Database created and tables exist
- [ ] Backend starts without errors
- [ ] API health check returns success
- [ ] Mobile app connects to backend
- [ ] Login works
- [ ] Signup works
- [ ] Payment flow works

