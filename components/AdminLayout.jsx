import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "fa-solid fa-table-columns" },
  { href: "/admin/rooms", label: "Rooms Management", icon: "fa-solid fa-bed" },
  { href: "/admin/availability", label: "Room Availability", icon: "fa-solid fa-door-open" },
  { href: "/admin/bookings", label: "Bookings", icon: "fa-solid fa-calendar-check" },
  { href: "/admin/expenses", label: "Expenses", icon: "fa-solid fa-wallet" },
  { href: "/admin/amenities", label: "Amenities", icon: "fa-solid fa-spa" },
  { href: "/admin/messages", label: "Guest Messages", icon: "fa-solid fa-envelope" },
  { href: "/admin/blogs", label: "Blog Posts", icon: "fa-solid fa-newspaper", content: true },
  { href: "/admin/blogs/new", label: "New Blog", icon: "fa-solid fa-pen-to-square", content: true },
  { href: "/admin/authors", label: "Authors", icon: "fa-solid fa-user-pen", content: true },
  { href: "/admin/authors/new", label: "New Author", icon: "fa-solid fa-user-plus", content: true },
];

export default function AdminLayout({ children, title, contentSection = false }) {
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pageSearch, setPageSearch] = useState('');
  const activeHref = navItems.filter(item => router.pathname === item.href || router.pathname.startsWith(item.href + '/')).sort((a,b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className={`admin-app ${contentSection ? "content-admin-app" : ""}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img
            src="/images/LotusInnLogo.png"
            alt="Lotus Inn"
            onError={(e) => {
              e.currentTarget.src = "/images/lotusinn-logo.png";
            }}
          />

          <div>
            <h1>Lotus Inn Guest House</h1>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.filter(item => `${item.label} ${item.href}`.toLowerCase().includes(pageSearch.trim().toLowerCase())).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={activeHref === item.href ? "active" : ""}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h2>
              Welcome <span>Lotus Inn Admin</span>
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6c7890",
              }}
            >
              {title ||
                "Manage rooms, bookings and guest communication from one place."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "center",
            }}
          >
            {/* Search */}
            <div className="admin-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input aria-label="Find an admin page" placeholder="Find an admin page" value={pageSearch} onChange={event => setPageSearch(event.target.value)} />
            </div>

            {/* Actions */}
            <div className="admin-actions">
              {/* Notification */}
              <div className="notification-wrapper">
                <button
                  className="admin-circle" aria-label="Open quick links" aria-expanded={showNotifications}
                  onClick={() =>
                    setShowNotifications(!showNotifications)
                  }
                >
                  <i className="fa-regular fa-bell"></i>

                </button>

                {showNotifications && (
                  <div className="dropdown-box">
                    <h4>Quick Links</h4>
                    <ul>
                      <li><Link href="/admin/bookings">Review bookings</Link></li>
                      <li><Link href="/admin/availability">Check room availability</Link></li>
                      <li><Link href="/admin/messages">Read guest messages</Link></li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="profile-wrapper">
                <button
                  className="admin-avatar" aria-label="Open admin profile" aria-expanded={showProfile}
                  onClick={() => setShowProfile(!showProfile)}
                >
                  LG
                </button>

                {showProfile && (
                  <div className="dropdown-box">
                    <Link href="/">
                      View Website
                    </Link>
                    <button
                      type="button"
                      className="dropdown-logout"
                      onClick={async () => {
                        await fetch("/api/admin/logout", { method: "POST" });
                        window.location.href = "/admin/login";
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
