import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import './App.css';
import { TaskList } from './pages/TaskList';

const initializeAssistant = (getState) => {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,
      nativePanel: {
        defaultText: 'Добавьте вещь...',
        screenshotMode: false,
        tabIndex: -1,
      },
    });
  } else {
    return createAssistant({ getState });
  }
};

export class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [
        {
          id: Math.random().toString(36).substring(7),
          name: 'Футболка',
          category: 'верх',
          instruction: 'Сложите пополам вдоль, затем ещё раз пополам',
          completed: false
        }
      ],
    };

    this.assistant = initializeAssistant(() => this.getStateForAssistant());

    this.assistant.on('data', (event) => {
      if (event.type === 'character') {
        console.log(`character: "${event?.character?.id}"`);
      } else {
        const { action } = event;
        this.dispatchAssistantAction(action);
      }
    });
  }

  getStateForAssistant() {
    return {
      item_selector: {
        items: this.state.items.map(({ id, name, category }, index) => ({
          number: index + 1,
          id,
          title: name,
          subtitle: category,
        })),
        ignored_words: [
          'добавить', 'положить', 'складывай', 'новая', 'вещь', 'одежда',
          'удалить', 'убрать', 'выполнил', 'готово', 'сделал', 'сложил'
        ],
      },
    };
  }

  dispatchAssistantAction(action) {
    if (action) {
      switch (action.type) {
        case 'add_clothing': return this.addClothing(action);
        case 'done_clothing': return this.doneClothing(action);
        case 'delete_clothing': return this.deleteClothing(action);
        default: throw new Error();
      }
    }
  }

  getDefaultInstruction(category) {
    const instructions = {
      'верх': 'Сложите пополам вдоль, затем ещё раз пополам',
      'низ': 'Сложите пополам по длине, затем втрое',
      'нижнее': 'Аккуратно сложите пополам',
      'носки': 'Сложите вместе и заверните один в другой',
      'другое': 'Аккуратно сложите и уберите в шкаф'
    };
    return instructions[category] || instructions['другое'];
  }

  addClothing(action) {
    this.setState({
      items: [
        ...this.state.items,
        {
          id: Math.random().toString(36).substring(7),
          name: action.name,
          category: action.category || 'другое',
          instruction: action.instruction || this.getDefaultInstruction(action.category),
          completed: false,
        },
      ],
    });
  }

  doneClothing(action) {
    this.setState({
      items: this.state.items.map((item) =>
        item.id === action.id ? { ...item, completed: !item.completed } : item
      ),
    });
  }

  deleteClothing(action) {
    this.setState({
      items: this.state.items.filter(({ id }) => id !== action.id),
    });
  }

  _sendActionValue(actionId, value) {
    const data = {
      action: { action_id: actionId, parameters: { value } },
    };
    const unsubscribe = this.assistant.sendData(data, (data) => {
      console.log('sendData onData:', data);
      unsubscribe();
    });
  }

  playSuccessMessage(id) {
    const completed = this.state.items.find(({ id: itemId }) => itemId === id)?.completed;
    if (!completed) {
      const texts = ['Отлично сложено!', 'Прекрасная работа!', 'Теперь в шкафу порядок!'];
      const idx = Math.floor(Math.random() * texts.length);
      this._sendActionValue('done', texts[idx]);
    }
  }

  render() {
    return (
      <TaskList
        items={this.state.items}
        onAdd={(name, category, instruction) => {
          this.addClothing({ type: 'add_clothing', name, category, instruction });
        }}
        onDone={(item) => {
          this.playSuccessMessage(item.id);
          this.doneClothing({ type: 'done_clothing', id: item.id });
        }}
        onDelete={(item) => {
          this.deleteClothing({ type: 'delete_clothing', id: item.id });
        }}
      />
    );
  }
}