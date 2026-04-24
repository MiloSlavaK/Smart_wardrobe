import React, { useEffect, useState } from 'react';
import { createAssistant } from '@salutejs/client';
import './App.css';

const App = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    // Инициализация связи с Салютом
    const [itemsList] = useState(['футболка', 'джинсы', 'свитер'])
    const assistant = createAssistant({ getState: () => ({
        item_selector: {
      items: itemsList.map(title => ({ title }))
    }
        }) });

    assistant.on('data', (event) => {
      if (event.type === 'smart_app_data' && event.smart_app_data) {
        setContent(event.smart_app_data);
      }
    });
  }, []);

  return (
    <div className="container">
      <header className="header">👗 Гардеробный Помощник</header>

      <main className="main-content">
        {!content && (
          <div className="welcome">
            <h1>Привет!</h1>
            <p>Спроси меня: <strong>"Как сложить свитер?"</strong> или <strong>"Где мои джинсы?"</strong></p>
          </div>
        )}

        {content?.type === 'FOLDING' && (
          <div className="card animate-fade">
            <h2>{content.title}</h2>
            <div className="steps-list">
              {content.steps.map((step, i) => (
                <div key={i} className="step-item">
                  <span className="step-number">{i + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
            {content.img && <img src={content.img} alt="instruction" className="instr-img" />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;