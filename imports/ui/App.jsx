import React, { Fragment, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { TasksCollection } from '/imports/db/TasksCollection.js';
import { Task } from './Task.jsx';
import { TaskForm } from '/imports/ui/TaskForm.jsx';
import { LoginForm } from '/imports/ui/LoginForm.jsx';

export const App = () => {
  const user = useTracker(() => Meteor.user());

  const [hideCompleted, setHideCompleted] = useState(false);
  const hideCompletedFilter = { isChecked: { $ne: true } };
  
  const userFilter = user ? { userId: user._id } : {};

  const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter };

  const { tasks, pendingTaskCount, isLoading } = useTracker(() => {
    const noDataAvailable = {
      tasks: [],
      pendingTaskCount: 0
    };

    if(!Meteor.user()) {
      return noDataAvailable;
    }

    const handler = Meteor.subscribe('tasks');

    if(!handler.ready()) {
      return {...noDataAvailable, isLoading: true};
    }

    const tasks = TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : userFilter, 
      {
        sort: { createdAt: -1 },
      }
    ).fetch();
    const pendingTaskCount = TasksCollection.find(pendingOnlyFilter).count();

    return {tasks, pendingTaskCount};

  });

  const pendingTaskTitle = pendingTaskCount ? ` (${pendingTaskCount})` : ''; 

  const toggleChecked = ({ _id, isChecked }) => {
    Meteor.call('tasks.setIsChecked', _id, !isChecked);
  };

  const deleteTask = ({ _id }) => {
    Meteor.call('tasks.remove', _id);
  };

  const logout = () => Meteor.logout();

  return (
    <div className="app">
      <header>
        <div className="app-bar">
          <div className="app-header">
            <h1>
              📝️ To Do List
              {pendingTaskTitle}
            </h1>
          </div>
        </div>
      </header>

      <div className="main">
        {user ? (
        <Fragment>
          <div className="user" onClick={logout}>
            {user.username || user.profile.name } 🚪
          </div>

          <TaskForm />
          <div className="filter">
            <button onClick={() => setHideCompleted(!hideCompleted)}>
              {hideCompleted ? 'Show All' : 'Hide Completed'}
            </button>
          </div>

          {isLoading && <div className="loading">Loading...</div>}
          <ul className='tasks'>
            { tasks.map(task => (
            <Task 
              key={ task._id } 
              task={ task } 
              onCheckboxClick={toggleChecked} 
              onDeleteClick={deleteTask}
            />)) }
          </ul>
        </Fragment>
        ) : (
          <LoginForm />
        )}
        
      </div>
    </div>
  )
};
