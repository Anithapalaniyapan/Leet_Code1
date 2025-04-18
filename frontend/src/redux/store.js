import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import meetingReducer from './slices/meetingSlice';
import questionReducer from './slices/questionSlice';
import feedbackReducer from './slices/feedbackSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    meetings: meetingReducer,
    questions: questionReducer,
    feedback: feedbackReducer,
    ui: uiReducer,
  },
}); 