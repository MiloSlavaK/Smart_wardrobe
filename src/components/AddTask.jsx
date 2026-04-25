import React from "react";
import "../App.css";

export class AddTask extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      category: 'верх',
      instruction: '',
      showAdvanced: false,
    };
  }

  render() {
    const { onAdd } = this.props;
    const { name, category, instruction, showAdvanced } = this.state;

    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) {
            onAdd(name.trim(), category, instruction.trim());
            this.setState({ name: '', category: 'верх', instruction: '', showAdvanced: false });
          }
        }}
      >
        <div className="add-task-container">
          <input
            className="add-task-input"
            type="text"
            placeholder="Название вещи (например: Футболка)"
            value={name}
            onChange={({ target: { value } }) => this.setState({ name: value })}
            required
            autoFocus
          />

          <select
            className="add-task-select"
            value={category}
            onChange={({ target: { value } }) => this.setState({ category: value })}
          >
            <option value="верх">Верх (футболки, рубашки)</option>
            <option value="низ">Низ (брюки, джинсы)</option>
            <option value="нижнее">Нижнее бельё</option>
            <option value="носки">Носки</option>
            <option value="другое">Другое</option>
          </select>

          <button
            type="button"
            className="toggle-advanced"
            onClick={() => this.setState({ showAdvanced: !showAdvanced })}
          >
            {showAdvanced ? 'Скрыть инструкцию' : 'Добавить инструкцию'}
          </button>

          {showAdvanced && (
            <textarea
              className="add-task-textarea"
              placeholder="Инструкция по складыванию (необязательно)"
              value={instruction}
              onChange={({ target: { value } }) => this.setState({ instruction: value })}
              rows="3"
            />
          )}

          <button type="submit" className="add-task-button">
            Добавить вещь
          </button>
        </div>
      </form>
    );
  }
}