// store.js (or redux/store.js)
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';

// Get initial user state from localStorage
const userFromStorage = localStorage.getItem('user');
const initialState = {
  user: {
    user: userFromStorage ? JSON.parse(userFromStorage) : null
  }
};

const store = configureStore({
  reducer: {
    user: userReducer,
  },
  preloadedState: initialState
});

export default store;
