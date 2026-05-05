import React from 'react';
import { TaskList } from './pages/TaskList';
import { useClosetItems } from './hooks/useClosetItems';
import { useAssistant, ASSISTANT_IGNORED_WORDS } from './hooks/useAssistant';
import { useSuccessMessage } from './hooks/useSpeech';
import './App.css';

const DEMO_ITEM = {
  id: 'demo-1',
  name: 'Футболка',
  category: 'верх',
  instruction: 'Сложите пополам вдоль, затем ещё раз пополам',
  washing: '30°C, деликатный режим. Сушить в расправленном виде.',
  nextReminder: '',
  completed: false,
};

export const App = () => {
  const { items, addItem, toggleItemCompleted, deleteItem, updateReminder } = useClosetItems([DEMO_ITEM]);

  const handleAssistantAction = (action) => {
    switch (action.type) {
      case 'add_clothing':
        addItem({
          name: action.name,
          category: action.category,
          instruction: action.instruction,
          washing: action.washing,
          nextReminder: action.nextReminder,
        });
        break;
      case 'done_clothing':
        toggleItemCompleted(action.id);
        break;
      case 'delete_clothing':
        deleteItem(action.id);
        break;
      case 'set_reminder':
        updateReminder(action.id, action.date);
        break;
      default:
        console.log('Unknown action type:', action.type);
    }
  };

  const { assistant, updateState, sendActionValue } = useAssistant(handleAssistantAction);

  const { playSuccessMessage } = useSuccessMessage(sendActionValue);

  const getStateForAssistant = () => ({
    item_selector: {
      items: items.map(({ id, name, category }, index) => ({
        number: index + 1,
        id,
        title: name,
        subtitle: category,
      })),
      ignored_words: ASSISTANT_IGNORED_WORDS,
    },
  });

  updateState(getStateForAssistant);

  return (
    <TaskList
      items={items}
      onAdd={addItem}
      onDone={(item) => {
        playSuccessMessage(item.id, items);
        toggleItemCompleted(item.id);
      }}
      onDelete={(item) => deleteItem(item.id)}
      onUpdateReminder={(id, date) => updateReminder(id, date)}
    />
  );
};
