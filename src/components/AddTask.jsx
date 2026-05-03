import React from "react";
import "../App.css";

export class AddTask extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      name: '', 
      category: 'верх', 
      instruction: '', 
      washing: '',
      nextReminder: '',
      showAdvanced: false
    };
  }

  handleAdd = () => {
    const { name, category, instruction, washing, nextReminder } = this.state;
    if (name) {
      this.props.onAdd({ 
        name, 
        category, 
        instruction: instruction || undefined, 
        washing: washing || undefined,
        nextReminder 
      });
      this.setState({ 
        name: '', 
        instruction: '', 
        washing: '',
        nextReminder: '',
        showAdvanced: false
      });
    }
  }

  render() {
    const { onAdd } = this.props;
    const { name, category, instruction, washing, nextReminder, showAdvanced } = this.state;

    return (
      <div className="add-task-container">
        <h3>🧥 Добавить новую вещь</h3>
        <input
          className="add-task-input"
          placeholder="Название (напр. Шерстяной свитер)"
          value={name}
          onChange={(e) => this.setState({ name: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && this.handleAdd()}
        />

        <select
          className="add-task-select"
          value={category}
          onChange={(e) => this.setState({ category: e.target.value })}
        >
          <option value="верх">👕 Верх (Футболки/Рубашки)</option>
          <option value="низ">👖 Низ (Брюки/Джинсы)</option>
          <option value="нижнее">🩲 Нижнее бельё</option>
          <option value="носки">🧦 Носки</option>
          <option value="шерсть">🧶 Шерсть (Свитера/Пальто)</option>
          <option value="другое">📦 Другое</option>
        </select>

        <button
          className="toggle-advanced"
          onClick={() => this.setState({ showAdvanced: !showAdvanced })}
        >
          {showAdvanced ? '▲ Скрыть настройки' : '▼ Дополнительные настройки'}
        </button>

        {showAdvanced && (
          <div className="advanced-settings">
            <textarea
              className="add-task-textarea"
              placeholder="Инструкция по складыванию (оставьте пустым для авто-совета)"
              value={instruction}
              onChange={(e) => this.setState({ instruction: e.target.value })}
              rows="3"
            />
            <textarea
              className="add-task-textarea"
              placeholder="Совет по стирке (оставьте пустым для авто-совета)"
              value={washing}
              onChange={(e) => this.setState({ washing: e.target.value })}
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
            onChange={(e) => this.setState({ nextReminder: e.target.value })}
          />
        </label>

        <button
          className="add-task-button"
          onClick={this.handleAdd}
        >
          ✨ Добавить в гардероб
        </button>
      </div>
    );
  }
}
