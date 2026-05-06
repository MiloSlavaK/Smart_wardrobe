import React from 'react';
import './TaskItemList.css';
import { isDue } from '../utils/helpers';
import { useSpeech } from '../hooks/useSpeech';

export const TaskItemList = ({ items, onDone, onDelete, onUpdateReminder, onCare }) => {
  const { handleSpeakInstruction, handleSpeakWashing } = useSpeech();

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
