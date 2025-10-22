# Atlas Network Educational Simulator - Frontend

React.js frontend for the Atlas Network Educational MLM Simulator.

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** CSS-in-JS with theme system

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Environment variables:

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3001/api/v1)
- `VITE_APP_NAME` - Application name
- `VITE_REFERRAL_BASE_URL` - Base URL for referral links

## Running

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components (Button, Card, Input)
│   ├── student/         # Student-specific components
│   └── instructor/      # Instructor-specific components
├── pages/               # Page components (routes)
├── context/             # React Context (AuthContext)
├── services/            # API client (axios)
├── utils/               # Helper functions (formatters)
├── styles/              # Global CSS and theme
├── App.jsx              # Main app with routing
└── index.jsx            # Entry point
```

## Key Features

### Authentication

- JWT-based authentication
- LocalStorage token persistence
- Protected routes
- Role-based access control

### Student Interface

- Dashboard with balance and earnings
- Referral link sharing
- Network visualization
- Earnings history

### Instructor Interface

- Comprehensive analytics dashboard
- Participant management
- Network graph visualization
- Simulation controls

### Design System

- Modern gradient theme
- Responsive mobile-first design
- Reusable component library
- Educational watermark

## Building for Production

```bash
npm run build
```

Output in `dist/` directory. Deploy to any static hosting service (Vercel, Netlify, etc.).

## License

MIT
