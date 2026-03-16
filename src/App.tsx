import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import PWAPrompt from './components/PWAPrompt'
import './styles/global.css'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const Train = lazy(() => import('./pages/Train'))
const Session = lazy(() => import('./pages/Session'))
const Results = lazy(() => import('./pages/Results'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Learn = lazy(() => import('./pages/Learn'))

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const pageTransition = { duration: 0.18, ease: 'easeInOut' as const }

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Suspense fallback={null}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/train" element={<Train />} />
            <Route path="/session/:type" element={<Session />} />
            <Route path="/results/:sessionId" element={<Results />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/learn" element={<Learn />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function NavBar() {
  return (
    <nav className="app-nav" aria-label="Main navigation">
      <div className="app-nav__inner">
        <span className="app-nav__brand">attention</span>
        <div className="app-nav__links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}>
            Home
          </NavLink>
          <NavLink to="/train" className={({ isActive }) => isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}>
            Train
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}>
            Analytics
          </NavLink>
          <NavLink to="/learn" className={({ isActive }) => isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}>
            Learn
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

function Layout() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <NavBar />
      <main id="main-content" className="app-main">
        <AnimatedRoutes />
      </main>
      <PWAPrompt />
    </>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </MotionConfig>
  )
}
