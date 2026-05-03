import React from 'react';
import './TaskItemList.css';

export const TaskItemList = (props) => {
  const { items, onDone, onDelete, onUpdateReminder, onCare } = props;
  
  const isDue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) <= new Date();
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeakInstruction = (item) => {
    const text = `Как сложить ${item.name}: ${item.instruction}`;
    speakText(text);
  };

  const handleSpeakWashing = (item) => {
    const text = `Совет по стирке для ${item.name}: ${item.washing}`;
    speakText(text);
  };

  return (
    <div className="task-item-list">
      {items.length === 0 ? (
        <div className="empty-state">
          <p>🎉 Пока нет вещей. Добавьте первую!</p>
        </div>
      ) : (
        items.map((item) => {
          const due = isDue(item.nextReminder);
          return (
            <div key={item.id} className={`task-item ${item.completed ? 'completed' : ''} ${due ? 'alert' : ''}`}>
              <div className="task-header">
                <h3>{item.name}</h3>
                {due && <span className="badge-alert">⚠️ Время ухода!</span>}
              </div>

              <div className="task-category-badge">{item.category}</div>

              <div className="task-info">
                <p><strong>📐 Как сложить:</strong> {item.instruction}</p>
                <p><strong>🧼 Стирка:</strong> {item.washing}</p>
              </div>

              <div className="task-actions">
                <button 
                  className="btn-action btn-speak-fold" 
                  onClick={() => handleSpeakInstruction(item)}
                  title="Озвучить инструкцию по складыванию"
                >
                  🔊 Складка
                </button>
                <button 
                  className="btn-action btn-speak-wash" 
                  onClick={() => handleSpeakWashing(item)}
                  title="Озвучить совет по стирке"
                >
                  🔊 Стирка
                </button>
                <button 
                  className={`btn-action ${item.completed ? 'btn-undo' : 'btn-done'}`} 
                  onClick={() => onDone(item)}
                >
                  {item.completed ? '↩️ Не готово' : '✅ Готово'}
                </button>
                {item.nextReminder && (
                  <span className="reminder-date">
                    📅 {item.nextReminder}
                  </span>
                )}
                <button className="btn-delete" onClick={() => onDelete(item)}>🗑</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
