# Codev Template

This is a Codev template project that includes:

1. Next.js with Pages Router
2. Tailwind CSS Framework
3. Context for global state management

## Features

- **Next.js Pages Router**: Utilizes the traditional routing system of Next.js for easy navigation and page management.
- **Tailwind CSS**: A utility-first CSS framework that provides low-level utility classes to build custom designs quickly and efficiently.
- **Context API**: Implements React's Context API for efficient global state management.

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

- `pages/`: Contains all the pages of the application
- `components/`: Reusable React components
- `contexts/`: Global state management using Context API
- `hooks/`: Custom React hooks
- `styles/`: Global style (global.css)
- `utils/`: Utility functions and helpers

## Documentation page (`/manage/docs`)

An internal, auth-protected documentation page covering the mobile app and admin portal is available at `/manage/docs`. It is linked from the admin nav as **Docs** and is only visible to logged-in admin/manager users.

**Screenshots** are served as static assets from `public/docs/`:

| Folder | Contents |
|--------|----------|
| `public/docs/app/` | Mobile app screenshots (tabs, run experience) |
| `public/docs/onboarding/` | Onboarding flow (`step1-welcome.png` … `step5-mission.png`) |
| `public/docs/admin/` | Admin portal screenshots |

To add or update screenshots, copy the new PNG into the appropriate `public/docs/` subfolder, then reference it in `src/pages/manage/docs.tsx`. See `../CLAUDE.md` for the full step-by-step update guide.

## Learn More

To learn more about the technologies used in this template, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Context API](https://reactjs.org/docs/context.html)
