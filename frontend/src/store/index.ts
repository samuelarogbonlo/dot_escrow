import { configureStore } from '@reduxjs/toolkit'
import walletReducer from './slices/walletSlice'
import escrowReducer from './slices/escrowSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    escrow: escrowReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['wallet/setWallet'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.api', 'payload.extension'],
        // Ignore these paths in the state
        ignoredPaths: ['wallet.api', 'wallet.extension'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 