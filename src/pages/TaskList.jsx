import React from 'react';
import { AddTask } from '../components/AddTask';
import { TaskItemList } from '../components/TaskItemList';

export const TaskList = (props) => {
  const { items, onAdd, onDone, onDelete, onUpdateReminder, onAskFolding, onAskWashing } = props;

  return (
    <main className="container">
      <header className="header">
        <h1>УМНЫЙ ГАРДЕРОБ</h1>
        <p className="subtitle">Организуйте свой шкаф с умным помощником</p>
      </header>

      <AddTask onAdd={onAdd} />

      <section className="task-section">
        <h2>Ваши вещи</h2>
        <TaskItemList
          items={items}
          onDone={onDone}
          onDelete={onDelete}
          onUpdateReminder={onUpdateReminder}
          onAskFolding={onAskFolding}
          onAskWashing={onAskWashing}
        />
      </section>
    </main>
  );
};

export default TaskList;