import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Train from './pages/Train'
import Session from './pages/Session'
import Results from './pages/Results'
import Analytics from './pages/Analytics'
import Learn from './pages/Learn'
import './styles/global.css'
import './App.css'

function NavBar() {
  return (
    <nav className="app-nav">
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
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/train" element={<Train />} />
          <Route path="/session/:type" element={<Session />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/learn" element={<Learn />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
