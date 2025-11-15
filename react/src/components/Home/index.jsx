import React from 'react';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div data-easytag="id5-src/components/Home/index.jsx" className="home-page">
      <style>
        {`
          .home-page { background: #0b1220; color: #e7ecf7; min-height: calc(100vh - 60px); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
          .workspace { max-width: 1200px; margin: 0 auto; padding: 18px 24px; }
          .toolbar { background: #111a2e; border: 1px solid #1f2a44; border-radius: 12px; padding: 10px 12px; display: flex; gap: 10px; align-items: center; justify-content: space-between; }
          .toolbar .links { display: flex; gap: 14px; }
          .toolbar a { color: #8ab4ff; text-decoration: none; }
          .toolbar a:hover { text-decoration: underline; }
          .grid { margin-top: 14px; display: grid; grid-template-columns: 260px 1fr 280px; gap: 12px; }
          .panel { background: #0e1526; border: 1px solid #1f2a44; border-radius: 12px; padding: 12px; }
          .panel h3 { margin: 0 0 10px 0; font-size: 14px; color: #c9d4f1; }
          .viewer { height: 360px; display: grid; place-items: center; color: #9fb0d3; border-style: dashed; }
          .timeline { margin-top: 12px; background: #0e1526; border: 1px solid #1f2a44; border-radius: 12px; padding: 12px; height: 140px; color: #9fb0d3; }
          @media (max-width: 1024px) { 
            .workspace { padding: 12px; }
            .grid { grid-template-columns: 1fr; }
            .timeline { height: auto; }
          }
        `}
      </style>
      <div className="workspace">
        <div className="toolbar">
          <div>Рабочая область видеоредактора (заглушка)</div>
          <div className="links">
            <Link to="/instruction">Инструкция</Link>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </div>
        </div>

        <div className="grid">
          <div className="panel">
            <h3>Медиа и проекты</h3>
            <div>Здесь появятся ваши проекты и файлы (MP4 до 50MB).</div>
          </div>
          <div className="panel viewer">
            Просмотр видео / Канва (будет реализовано позже)
          </div>
          <div className="panel">
            <h3>Свойства</h3>
            <div>Настройки клипа, текста, кадрирования и др.</div>
          </div>
        </div>

        <div className="timeline">
          Таймлайн проекта — дорожки видео и текста (заглушка)
        </div>
      </div>
    </div>
  );
};
