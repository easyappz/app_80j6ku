import React from 'react';

export const Instruction = () => {
  return (
    <div data-easytag="id4-src/components/Instruction/index.jsx" className="instruction-page">
      <style>
        {`
          .instruction-page { 
            padding: 32px 24px; 
            background: #0b1220; 
            min-height: calc(100vh - 60px); 
            color: #e7ecf7; 
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; 
          }
          .container { max-width: 900px; margin: 0 auto; }
          h1 { font-size: 28px; margin: 0 0 12px 0; }
          .note { background: #111a2e; border: 1px solid #1f2a44; padding: 14px; border-radius: 12px; color: #c9d4f1; margin-bottom: 18px; }
          section { background: #0e1526; border: 1px solid #1f2a44; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
          h2 { font-size: 18px; margin: 0 0 8px 0; }
          ul { margin: 8px 0 0 18px; color: #c9d4f1; }
          li { margin: 6px 0; }
          code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 6px; }
        `}
      </style>
      <div className="container">
        <h1>Инструкция</h1>
        <div className="note">
          Приложение оптимизировано для работы на компьютере (только десктоп). Максимальный размер загружаемого видео — <strong>50MB</strong>. Поддерживаемый формат: <code>MP4</code>.
        </div>

        <section>
          <h2>Обрезка видео</h2>
          <ul>
            <li>Добавьте видео в проект.</li>
            <li>Выберите клип на таймлайне.</li>
            <li>Укажите начальную и конечную точки, сохраните результат.</li>
          </ul>
        </section>

        <section>
          <h2>Склейка видео</h2>
          <ul>
            <li>Импортируйте несколько клипов MP4.</li>
            <li>Расположите их на таймлайне в нужном порядке.</li>
            <li>Объедините клипы в один ролик.</li>
          </ul>
        </section>

        <section>
          <h2>Добавление текста</h2>
          <ul>
            <li>Создайте текстовый слой в нужный момент времени.</li>
            <li>Выберите шрифт, размер, цвет и положение.</li>
            <li>Сохраните изменения. Запись появится в истории редактирования.</li>
          </ul>
        </section>

        <section>
          <h2>Кадрирование</h2>
          <ul>
            <li>Выберите клип и режим кадрирования.</li>
            <li>Установите рамку кадра и подтвердите действие.</li>
            <li>Изменения будут сохранены в проекте.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Instruction;
