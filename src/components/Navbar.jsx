import { useEffect, useState } from "react";
import { getStoredUser, logout } from "../lib_auth.js";
import { apiFetch } from "../lib_api.js";
import ProfilePanel from "./ProfilePanel.jsx";
import "./Navbar.css";




const BASE_LINKS = [
  { label: "Home", href: "#home" },
  { label: "How It Works", href: "#how-it-works" },
];
const STUDENT_LINK = { label: "Find Accommodation", href: "#accommodation" };
const SHOP_LINK = { label: "Student Shop", href: "#shop" };

const initials = (name = "User") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "U";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener("hashchange", sync);
    window.addEventListener("studentnest-auth", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("studentnest-auth", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadUnread = async () => {
      if (!getStoredUser()) { setUnread(0); return; }
      try { const data = await apiFetch('/notifications/unread-count'); if (!cancelled) setUnread(Number(data.unread_count || 0)); } catch { if (!cancelled) setUnread(0); }
    };
    loadUnread();
    const timer = setInterval(loadUnread, 8000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [user?.role]);

  const dashboard =
    user?.role === "student"
      ? "#student-dashboard"
      : user?.role === "provider"
        ? "#provider-dashboard"
        : user?.role === "inspector"
          ? "#inspection-dashboard"
          : user?.role === "admin"
            ? "#admin-dashboard"
            : "#login";
  const navLinks =
    user?.role === "provider" ||
    user?.role === "inspector" ||
    user?.role === "admin"
      ? BASE_LINKS
      : [BASE_LINKS[0], STUDENT_LINK, ...(user?.role === 'student' ? [SHOP_LINK] : []), BASE_LINKS[1]];

  const signout = async () => {
    try {
      await logout();
    } catch (error) {
      window.alert(`You are signed out on this device, but the server could not confirm logout: ${error.message}`);
    } finally {
      setUser(null);
      setProfileOpen(false);
      setMenuOpen(false);
      window.dispatchEvent(new Event("studentnest-auth"));
      window.location.hash = "home";
    }
  };

  return (
    <>
      <header className='navbar'>
        <div className='container navbar-inner'>
          <a href='#home' className='navbar-logo'>
            <span className='navbar-logo-mark'>StudentNest</span>
          </a>
          <nav className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
            <ul>
              {navLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} onClick={() => setMenuOpen(false)}>
                    {l.label}
                  </a>
                </li>
              ))}
              {user && user.role !== "admin" && (
                <li>
                  <a href={dashboard}>
                    {user.role === "student"
                      ? "Student Space"
                      : user.role === "inspector"
                        ? "Inspector Hub"
                        : "Provider Space"}
                  </a>
                </li>
              )}
              {user && user.role === 'admin' && <li className='navbar-notification-item'><a href='#admin-dashboard' onClick={()=>setUnread(0)} className='navbar-notification'>Notifications{unread>0&&<span className='notification-badge'>{unread>99?'99+':unread}</span>}</a></li>}
            </ul>
            <div className='navbar-auth navbar-auth-mobile'>
              {user ? (
                <>
                  <button
                    className='profile-trigger'
                    onClick={() => setProfileOpen(true)}>
                    <span className='nav-avatar'>
                      {initials(user.fullName)}
                    </span>
                    <span>Profile</span>
                  </button>
                  <button onClick={signout} className='btn btn-primary'>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <a href='#login' className='btn btn-outline-ink'>
                    Login
                  </a>
                  <a href='#signup' className='btn btn-primary'>
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </nav>
          <div className='navbar-auth navbar-auth-desktop'>
            {user ? (
              <>
                <button
                  className='profile-trigger'
                  onClick={() => setProfileOpen(true)}
                  aria-label='Open profile'>
                  <span className='nav-avatar'>{initials(user.fullName)}</span>
                  <span>Profile</span>
                </button>
                <button onClick={signout} className='btn btn-primary'>
                  Log out
                </button>
              </>
            ) : (
              <>
                <a href='#login' className='btn btn-outline-ink'>
                  Login
                </a>
                <a href='#signup' className='btn btn-primary'>
                  Sign Up
                </a>
              </>
            )}
          </div>
          <button
            className={`navbar-toggle ${menuOpen ? "is-open" : ""}`}
            aria-label='Toggle menu'
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} />}
    </>
  );
}

export default Navbar;
