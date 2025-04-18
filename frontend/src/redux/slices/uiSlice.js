import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeSection: 'profile',  // For dashboard navigation
  snackbar: {
    open: false,
    message: '',
    severity: 'info'  // 'success', 'info', 'warning', 'error'
  },
  dialog: {
    open: false,
    title: '',
    content: '',
    confirmAction: null,
    cancelAction: null
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveSection: (state, action) => {
      state.activeSection = action.payload;
    },
    
    // Snackbar actions
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info'
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    
    // Dialog actions
    showDialog: (state, action) => {
      state.dialog = {
        open: true,
        title: action.payload.title || '',
        content: action.payload.content || '',
        confirmAction: action.payload.confirmAction || null,
        cancelAction: action.payload.cancelAction || null
      };
    },
    hideDialog: (state) => {
      state.dialog.open = false;
    }
  }
});

export const { 
  setActiveSection, 
  showSnackbar, 
  hideSnackbar, 
  showDialog, 
  hideDialog 
} = uiSlice.actions;

// Utility function to show a snackbar with a message
export const displaySnackbar = (message, severity = 'info') => {
  return (dispatch) => {
    dispatch(showSnackbar({ message, severity }));
    
    // Auto-hide after 6 seconds
    setTimeout(() => {
      dispatch(hideSnackbar());
    }, 6000);
  };
};

// Utility function to show a confirmation dialog
export const displayConfirmDialog = (title, content, confirmAction, cancelAction = null) => {
  return (dispatch) => {
    dispatch(showDialog({
      title,
      content,
      confirmAction,
      cancelAction
    }));
  };
};

export default uiSlice.reducer; 