# Silks & Readymades Billing Application

A comprehensive billing system for retail stores specializing in silks and readymade garments.

## Features

### User Management
- User authentication with JWT
- Role-based access control (Admin, Manager, Staff)
- User profile management
- Password change functionality

### Billing System
- Create and print bills
- Barcode scanning support
- Customer management
- Multiple payment modes
- Discount management

### Product Management
- Product catalog with categories
- Barcode generation
- Stock management
- Low stock alerts

### Returns & Exchanges
- Return processing
- Exchange management
- Return history tracking

### Reporting
- Daily sales reports
- Inventory reports
- Financial reports
- Top selling items

## Environment Setup

### Local Development

1. **Prerequisites**:
   - Node.js v18+
   - npm or yarn
   - Docker (optional, for containerized development)

2. **Install dependencies**:
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment configuration**:
   - Copy `.env.example` to `.env` for frontend
   - Copy `server/.env.local` to `server/.env` for backend
   - Configure database and JWT settings

4. **Run the application**:
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or use Docker
   docker-compose up --build
   ```

### Production Deployment

1. **Environment variables**:
   - Configure `.env` file with production settings
   - Set strong JWT secrets
   - Configure database connection

2. **Build for production**:
   ```bash
   npm run build
   ```

3. **Run in production**:
   ```bash
   npm run start
   ```

## Configuration

### Environment Variables

**Frontend (`.env`)**:
```
VITE_API_URL=https://your-api-url.com
NODE_ENV=production
```

**Backend (`.env`)**:
```
# Database
TURSO_DATABASE_URL=your-turso-db-url
TURSO_AUTH_TOKEN=your-turso-auth-token

# JWT Configuration
JWT_SECRET=your-very-strong-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# Security
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTP_ONLY=true
SESSION_COOKIE_SAME_SITE=strict
```

### Local Development (`.env.local`)**:
```
NODE_ENV=development
JWT_SECRET=local-development-secret
LOCAL_DB_URL=./server/data/billing.db
DEBUG=true
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm run start
```

### Docker
```bash
docker-compose up --build
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/register` - Register new user (Admin only)

### Users
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Change password

### Bills
- `POST /api/bills` - Create new bill
- `GET /api/bills` - List bills (filtered by user role)
- `GET /api/bills/:id` - Get bill details
- `PUT /api/bills/:id` - Update bill

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

## Database Schema

The application uses SQLite/Turso database with the following main tables:
- `users` - User accounts and profiles
- `user_sessions` - Active user sessions
- `bills` - Bill records with user association
- `bill_items` - Individual items in bills
- `products` - Product catalog
- `customers` - Customer information

## Deployment

### Render.com
The application is configured for deployment on Render.com with the `render.yaml` configuration file.

### Docker
Use the provided `Dockerfile` and `docker-compose.yml` for containerized deployment.

## Security

- JWT authentication with short-lived tokens
- Password hashing with bcrypt
- Role-based access control
- Input validation
- Secure session management

## Support

For issues and support, please contact the development team.