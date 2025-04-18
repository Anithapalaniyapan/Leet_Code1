import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

/**
 * Redux Provider component that wraps the entire application
 * and provides access to the Redux store.
 */
export const ReduxProvider = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider; 