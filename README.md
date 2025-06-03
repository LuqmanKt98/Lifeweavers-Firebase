# Lifeweavers E-Doc System

This is a Next.js-based electronic document management system for LWV Clinic.

## Features

- Modern UI with Tailwind CSS
- TypeScript support
- Next.js 13+ with App Router
- Fully responsive design
- Role-based access control
- Real-time notifications
- User impersonation (Super Admin only)

## Demo Users & Privileges

Here are the available demo users and their credentials:

### Super Admin

- Email: superadmin@lifeweaver.com
- Password: super123
- Privileges:
  - Full system access
  - User management
  - System configuration
  - User impersonation
  - All admin privileges

### Admin

- Email: admin@lifeweaver.com
- Password: admin123
- Privileges:
  - User management
  - Notification management
  - Content management
  - Dashboard access

### Clinicians

1. Primary Clinician

   - Email: clinician@lifeweaver.com
   - Password: clinic123
   - Privileges:
     - Patient management
     - Appointment scheduling
     - Medical records access

2. Secondary Clinician
   - Email: clinician2@lifeweaver.com
   - Password: clinic123
   - Privileges:
     - Patient management
     - Appointment scheduling
     - Medical records access

### New Users

1. First User

   - Email: new.user1@example.com
   - Password: newuser123
   - Privileges:
     - Limited access
     - Profile setup

2. Second User
   - Email: new.user2@example.com
   - Password: newuser123
   - Privileges:
     - Limited access
     - Profile setup

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, set up your environment variables in `.env`:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

To set up the demo users, run:

```bash
node scripts/setup-users.js
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This project is configured for easy deployment on Vercel. To deploy:

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build settings
4. Add your environment variables in the Vercel project settings
5. Your project will be deployed and you'll get a production URL

## Environment Variables

Make sure to set up the following environment variables in your Vercel project:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
