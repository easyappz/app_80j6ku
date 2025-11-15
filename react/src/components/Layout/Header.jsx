import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <div data-easytag="id1-src/components/Layout/Header.jsx" className="app-header">
      <style>
        {`
          .app-header { 
            display: block; 
            border-bottom: 1px solid #e6e9ef; 
            background: #0b1220; 
            color: #ffffff; 
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; 
          }
          @media (max-width: 1024px) { 
            .app-header { display: none; } 
          }
          .app-header .inner { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 14px 24px; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
          }
          .brand { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            font-weight: 700; 
            letter-spacing: 0.2px; 
            font-size: 18px; 
          }
          .brand .dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; display: inline-block; }
          .nav { display: flex; gap: 18px; align-items: center; }
          .nav a { 
            color: #c9d4f1; 
            text-decoration: none; 
            padding: 8px 10px; 
            border-radius: 8px; 
            font-weight: 500; 
            transition: background 0.2s ease, color 0.2s ease; 
          }
          .nav a:hover { background: rgba(255,255,255,0.06); color: #ffffff; }
          .nav a.active { background: rgba(59,130,246,0.18); color: #ffffff; }
        `}
      </style>
      <div className="inner">
        <div className="brand" aria-label="brand">
          <span className="dot" />
          <span>Видеоредактор</span>
        </div>
        <nav className="nav" aria-label="main navigation">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Главная</NavLink>
          <NavLink to="/instruction" className={({ isActive }) => (isActive ? 'active' : '')}>Инструкция</NavLink>
          <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>Войти</NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Header;
