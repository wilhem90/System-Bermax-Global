import { useState } from 'react';
import {
  Bell,
  ChevronDown,
  CircleUser,
  Dices,
  Home,
  Info,
  LogOut,
  Send,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import './Sidebar.css';
import { NavLink, } from 'react-router-dom';
import useAuth from '../../Authentication/UseAuth';

export default function Sidebar({ openLogoutModal }) {
  const [openMenus, setOpenMenus] = useState({}); // controla quais menus estão abertos
  const { user, loading } = useAuth();

  const navLinkActive = ({ isActive }) => (isActive ? 'active' : 'inactive');

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const links = [
    {
      textContent: 'Home',
      pathName: '/home',
      svgName: <Home />,
    },
    {
      textContent: 'Topup',
      pathName: '/topup',
      svgName: <TrendingUp />,
    },
    {
      textContent: 'Tansfer',
      pathName: '/transfer',
      svgName: <Send />,
    },
    {
      textContent: 'Lottery',
      pathName: '/lottery',
      svgName: <Dices />,
    },
    {
      textContent: 'About',
      pathName: '/about',
      svgName: <Info />,
    },
    {
      textContent: 'Account',
      pathName: '/account',
      svgName: <Wallet />,
    },
  ];

  return (
    <div className="sidebar">
      {/* Box Perfil */}
      {!loading && <div className="box-perfil">
        <div className="svg-notification">
          <Bell />
        </div>

        <div className="img-user">
          {user?.urlAvatar ? (
            <img src={user?.urlAvatar} alt="Foto do usuário" />
          ) : (
            <CircleUser size={80} />
          )}
        </div>

        <div className="fullNameUser" onClick={()=> window.location.href="/profil"}>
          <span className="nameUser">
            {user?.firstNameUser || 'loading...'}
          </span>
          <ChevronDown />
        </div>

        <div className="roleUser">
          <span>Email: {user?.emailUser || 'loading...'}</span>
        </div>
      </div>}

      {/* Links */}
      <div className="box-links">
        <ul>
          {links.map((link) => (
            <li key={link.textContent}>
              {link.subLinks ? (
                <>
                  <button
                    className={`menu-btn ${
                      openMenus[link.textContent] ? 'open' : ''
                    }`}
                    onClick={() => toggleMenu(link.textContent)}
                  >
                    {link.svgName}
                    <span>{link.textContent}</span>
                    <ChevronDown
                      className={`btn-chevron ${
                        openMenus[link.textContent] ? 'rotate' : ''
                      }`}
                    />
                  </button>
                </>
              ) : (
                <NavLink to={link.pathName} className={navLinkActive}>
                  {link.svgName}
                  <span>{link.textContent}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
        <div className="logout-box" onClick={openLogoutModal}>
          {<LogOut />}
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
}
