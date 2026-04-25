import React from 'react';
import './TaskItemList.css';

export const TaskItemList = (props) => {
  const { items, onDone, onDelete } = props;

  const getCategoryIcon = (category) => {
    const icons = { 'верх': '👕', 'низ': '👖', 'нижнее': '🩲', 'носки': '🧦', 'другое': '👔' };
    return icons[category] || '👔';
  };

  const getCategoryName = (category) => {
    const names = { 'верх': 'Верх', 'низ': 'Низ', 'нижнее': 'Нижнее бельё', 'носки': 'Носки', 'другое': 'Другое' };
    return names[category] || category;
  };

  return (
    <div className="task-item-list">
      {items.length === 0 ? (
        <div className="empty-state"><p>📦 Добавьте первую вещь для складывания</p></div>
      ) : (
        items.map((item) => (
          <div key={item.id} className={`task-item ${item.completed ? 'completed' : ''}`}>
            <div className="task-item-header">
              <span className="task-item-icon">{getCategoryIcon(item.category)}</span>
              <div className="task-item-info">
                <h3 className="task-item-name">{item.name}</h3>
                <span className="task-item-category">{getCategoryName(item.category)}</span>
              </div>
            </div>
            <div className="task-item-instruction"><p>{item.instruction}</p></div>
            <div className="task-item-actions">
              <button className={`task-item-button ${item.completed ? 'completed' : ''}`} onClick={() => onDone(item)}>
                {item.completed ? '✓ Сложено' : 'Отметить как сложенное'}
              </button>
              <button className="task-item-delete" onClick={() => onDelete(item)}>🗑️</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};