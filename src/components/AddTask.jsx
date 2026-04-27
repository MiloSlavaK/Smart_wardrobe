import React from "react";
import "../App.css";

export class AddTask extends React.Component {
  constructor(props) {
    super(props);
    this.state = { name: '', category: 'верх', nextReminder: '' };
  }

  render() {
    const { onAdd } = this.props;
    const { name, category, nextReminder } = this.state;

    return (
      <div className="add-task-container">
        <h3>🧥 Новая вещь</h3>
        <input
          className="add-task-input"
          placeholder="Название (напр. Шерстяной свитер)"
          value={name}
          onChange={(e) => this.setState({ name: e.target.value })}
        />

        <select
          className="add-task-select"
          value={category}
          onChange={(e) => this.setState({ category: e.target.value })}
        >
          <option value="верх">👕 Верх (Футболки/Рубашки)</option>
          <option value="низ">👖 Низ (Брюки/Джинсы)</option>
          <option value="шерсть">🧶 Шерсть (Свитера/Пальто)</option>
        </select>

        <label className="date-label">
          📅 Напомнить об уходе через:
          <input
            type="date"
            className="date-input"
            value={nextReminder}
            onChange={(e) => this.setState({ nextReminder: e.target.value })}
          />
        </label>

        <button
          className="add-task-button"
          onClick={() => {
            if (name) {
              onAdd({ name, category, nextReminder });
              this.setState({ name: '', nextReminder: '' });
            }
          }}
        >
          Добавить в гардероб
        </button>
      </div>
    );
  }
}