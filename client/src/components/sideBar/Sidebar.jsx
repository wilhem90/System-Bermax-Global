import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleDollarSignIcon,
  CircleUser,
  Dices,
  Home,
  LogOut,
  Plus,
  Smartphone,
} from 'lucide-react';

import './Sidebar.css';
import { NavLink } from 'react-router-dom';
import useAuth from '../../Authentication/UseAuth';

export default function Sidebar({ openLogoutModal }) {
  const [openMenus, setOpenMenus] = useState({}); // controla quais menus estão abertos
  const { user } = useAuth();

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
      textContent: 'Transactions',
      pathName: '/transactions',
      svgName: <ArrowRightLeft />,
    },
    {
      textContent: 'Send',
      svgName: <ArrowUpRight />,
      subLinks: [
        {
          textContent: 'TopUp',
          pathName: '/send-topup',
          svgName: <Smartphone />,
        },
        {
          textContent: 'Money',
          pathName: '/send-money',
          svgName: <CircleDollarSignIcon />,
        },
      ],
    },
    {
      textContent: 'Create Ticket',
      pathName: '/create-ticket',
      svgName: <Dices />,
    },
    {
      textContent: 'Add Money',
      pathName: '/add-money',
      svgName: <Plus />,
    },
    {
      textContent: 'Request',
      pathName: '/request',
      svgName: <ArrowDownLeft />,
    },
  ];

  return (
    <div className="sidebar">
      {/* Box Perfil */}
      <div className="box-perfil">
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

        <div className="fullNameUser">
          <span className="nameUser">{user?.firstNameUser}</span>
          <ChevronDown />
        </div>

        <div className="roleUser">
          <span>Email: {user?.emailUser}</span>
        </div>
      </div>

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

                  {openMenus[link.textContent] && (
                    <ul className="submenu">
                      {link.subLinks.map((sublink) => (
                        <li key={sublink.textContent}>
                          <NavLink
                            to={sublink.pathName}
                            className={navLinkActive}
                          >
                            {sublink.svgName}
                            <span>{sublink.textContent}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
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
          <span>Logout</span> {<LogOut />}
        </div>
      </div>
    </div>
  );
}
