# Gold Investment Platform - Backend API

Modern Node.js/Express backend API for the Gold Investment Platform.

## Features

- ✅ RESTful API with Express.js
- ✅ MySQL database integration with connection pooling
- ✅ JWT authentication
- ✅ Real-time updates with Socket.IO
- ✅ Data integrity checks
- ✅ Automated backups
- ✅ Email notifications
- ✅ SMS alerts (Twilio)
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ Request logging
- ✅ Error handling

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update database credentials and other settings

```bash
cp .env.example .env
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Members
- `GET /api/members/profile` - Get profile
- `PUT /api/members/profile` - Update profile
- `GET /api/members/referral-link` - Get referral link

### Packages
- `GET /api/packages` - Get all packages
- `GET /api/packages/:id` - Get package by ID

### Investments
- `GET /api/investments/history` - Get investment history
- `POST /api/investments` - Create new investment

### Dashboard
- `GET /api/dashboard/member` - Member dashboard
- `GET /api/dashboard/admin` - Admin dashboard

### Income
- `GET /api/income/history` - Income history
- `GET /api/income/summary` - Income summary

### Referrals
- `GET /api/referrals/list` - Referral list
- `GET /api/referrals/tree` - Referral tree
- `GET /api/referrals/stats` - Referral statistics

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Analytics
- `GET /api/analytics` - Get analytics data

### Admin
- `POST /api/admin/approve-signup/:id` - Approve signup
- `GET /api/admin/pending-signups` - Pending signups

### Backup
- `POST /api/backup/create` - Create manual backup

### Health Check
- `GET /api/health` - Health check and data integrity

## Data Integrity

The backend includes automatic data integrity checks:
- Orphaned member records
- Negative balances
- Missing package references

Run daily at 3 AM via cron job.

## Backups

Automated backups run daily at 2 AM. Manual backups can be created via API.

## Security

- JWT token authentication
- Rate limiting
- Helmet security headers
- Input validation
- SQL injection prevention (parameterized queries)
- CORS configuration

## Logging

Logs are stored in:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

## Deployment

See `DEPLOYMENT.md` for deployment instructions.




