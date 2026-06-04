import React, { useState } from 'react';
import '../App.css';
import { CATEGORY_OPTIONS } from '../constants/clothingData';

export const AddTask = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [instruction, setInstruction] = useState('');
  const [washing, setWashing] = useState('');
  const [nextReminder, setNextReminder] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAdd = () => {
    if (name) {
      onAdd({ 
        name, 
        category, 
        instruction: instruction || undefined, 
        washing: washing || undefined,
        nextReminder 
      });
      setName('');
      setInstruction('');
      setWashing('');
      setNextReminder('');
      setShowAdvanced(false);
    }
  };

  return (
    <div className="add-task-container">
      <h3>🧥 Добавить новую вещь</h3>
      <input
        className="add-task-input"
        placeholder="Название (напр. Шерстяной свитер)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
      />

      <select
        className="add-task-select"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        className="toggle-advanced"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '▲ Скрыть настройки' : '▼ Дополнительные настройки'}
      </button>

      {showAdvanced && (
        <div className="advanced-settings">
          <textarea
            className="add-task-textarea"
            placeholder="Инструкция по складыванию (оставьте пустым для авто-совета)"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows="3"
          />
          <textarea
            className="add-task-textarea"
            placeholder="Совет по стирке (оставьте пустым для авто-совета)"
            value={washing}
            onChange={(e) => setWashing(e.target.value)}
            rows="2"
          />
        </div>
      )}

      <label className="date-label">
        📅 Напомнить об уходе:
        <input
          type="date"
          className="date-input"
          value={nextReminder}
          onChange={(e) => setNextReminder(e.target.value)}
        />
      </label>

      <button
        className="add-task-button"
        onClick={handleAdd}
      >
        ✨ Добавить в гардероб
      </button>
    </div>
  );
};

export default AddTask;
