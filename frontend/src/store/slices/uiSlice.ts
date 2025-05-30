import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  title?: string
  autoClose?: boolean
}

interface UIState {
  notifications: Notification[]
  isWalletModalOpen: boolean
  isCreateEscrowModalOpen: boolean
  isDarkMode: boolean
}

const initialState: UIState = {
  notifications: [],
  isWalletModalOpen: false,
  isCreateEscrowModalOpen: false,
  isDarkMode: false
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString()
      state.notifications.push({ ...action.payload, id })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(notification => notification.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    toggleWalletModal: (state) => {
      state.isWalletModalOpen = !state.isWalletModalOpen
    },
    setWalletModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isWalletModalOpen = action.payload
    },
    toggleCreateEscrowModal: (state) => {
      state.isCreateEscrowModalOpen = !state.isCreateEscrowModalOpen
    },
    setCreateEscrowModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateEscrowModalOpen = action.payload
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode
    }
  }
})

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  toggleWalletModal,
  setWalletModalOpen,
  toggleCreateEscrowModal,
  setCreateEscrowModalOpen,
  toggleDarkMode
} = uiSlice.actions

export default uiSlice.reducer 