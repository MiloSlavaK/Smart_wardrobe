import React from 'react';
import './TaskItemList.css';

export const TaskItemList = (props) => {
  const { items, onDelete, onUpdateReminder, onCare } = props;

  const isDue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) <= new Date();
  };

  return (
    <div className="task-item-list">
      {items.map((item) => {
        const due = isDue(item.nextReminder);
        return (
          <div key={item.id} className={`task-item ${due ? 'alert' : ''}`}>
            <div className="task-header">
              <h3>{item.name}</h3>
              {due && <span className="badge-alert">⚠️ Время ухода!</span>}
            </div>

            <div className="task-info">
              <p><strong>🧼 Стирка:</strong> {item.washing}</p>
              <p><strong>📐 Складка:</strong> {item.instruction}</p>
            </div>

            <div className="task-actions">
              {item.nextReminder && (
                <span className="reminder-date">
                  📅 {item.nextReminder}
                </span>
              )}
              <button className="btn-care" onClick={() => onCare(item.id)}>🗣 Озвучить совет</button>
              <button className="btn-delete" onClick={() => onDelete(item.id)}>🗑</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};