// import Link from 'next/link';
// import { useRouter } from 'next/router';

// const navItems = [
//   { href: '/admin', label: 'Dashboard', icon: 'fa-solid fa-table-columns' },
//   { href: '/admin/rooms', label: 'Rooms Management', icon: 'fa-solid fa-bed' },
//   { href: '/admin/availability', label: 'Room Availability', icon: 'fa-solid fa-door-open' },
//   { href: '/admin/bookings', label: 'Bookings', icon: 'fa-solid fa-calendar-check' },
//   { href: '/admin/expenses', label: 'Expenses', icon: 'fa-solid fa-wallet' },
//   { href: '/admin/amenities', label: 'Amenities', icon: 'fa-solid fa-spa' },
//   { href: '/admin/messages', label: 'Guest Messages', icon: 'fa-solid fa-envelope' }
// ];

// export default function AdminLayout({ children, title, contentSection = false }) {
//   const router = useRouter();
//   return (
//     <div className={`admin-app ${contentSection ? "content-admin-app" : ""}`}>
//       <aside className="admin-sidebar">
//         <div className="admin-brand">
//           <img src="/images/LotusInnLogo.png" alt="Lotus Inn Guest House" onError={(e)=>{e.currentTarget.src='/images/lotusinn-logo.png';}} />
//           <div>
//             <h1>Lotus Inn Guest House</h1>
//             <p>Admin Panel</p>
//           </div>
//         </div>
//         <nav className="admin-nav">
//           {navItems.map((item) => (
//             <Link key={item.href} href={item.href} className={router.pathname === item.href ? 'active' : ''}>
//               <i className={item.icon}></i>
//               <span>{item.label}</span>
//             </Link>
            
//           ))}
//         </nav>
//       </aside>
//       <main className="admin-main">
//         <div className="admin-topbar">
//           <div>
//             <h2>Welcome <span>Lotus Inn Admin</span></h2>
//             <p style={{margin:'8px 0 0',color:'#6c7890'}}>{title || 'Manage rooms, bookings and guest communication from one place.'}</p>
//           </div>
//           <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
//             <div className="admin-search">
//               <i className="fa-solid fa-magnifying-glass"></i>
//               <input placeholder="Search dashboard" />
//             </div>
//             <div className="admin-actions">
//               <div className="admin-circle"><i className="fa-regular fa-bell"></i><span className="admin-badge">9</span></div>
//               <div className="admin-avatar">LG</div>
//             </div>
//           </div>
//         </div>
//         {children}
//       </main>
//     </div>
//   );
// }

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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={router.pathname === item.href || (item.content && router.pathname.startsWith(item.href) && item.href !== "/admin/blogs/new" && item.href !== "/admin/authors/new") ? "active" : ""}
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
              <input placeholder="Search dashboard" />
            </div>

            {/* Actions */}
            <div className="admin-actions">
              {/* Notification */}
              <div className="notification-wrapper">
                <button
                  className="admin-circle"
                  onClick={() =>
                    setShowNotifications(!showNotifications)
                  }
                >
                  <i className="fa-regular fa-bell"></i>
                  <span className="admin-badge">9</span>
                </button>

                {showNotifications && (
                  <div className="dropdown-box">
                    <h4>Notifications</h4>
                    <ul>
                      <li>New booking request</li>
                      <li>Room availability updated</li>
                      <li>Guest sent a message</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="profile-wrapper">
                <button
                  className="admin-avatar"
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