import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ApiPromise } from '@polkadot/api'
import { InjectedExtension } from '@polkadot/extension-inject/types'

interface WalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
  api: ApiPromise | null
  extension: InjectedExtension | null
  isConnecting: boolean
  error: string | null
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  balance: null,
  api: null,
  extension: null,
  isConnecting: false,
  error: null
}

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWalletStart: (state) => {
      state.isConnecting = true
      state.error = null
    },
    connectWalletSuccess: (state, action: PayloadAction<{ address: string; balance: string }>) => {
      state.isConnected = true
      state.address = action.payload.address
      state.balance = action.payload.balance
      state.isConnecting = false
    },
    connectWalletFailure: (state, action: PayloadAction<string>) => {
      state.isConnected = false
      state.isConnecting = false
      state.error = action.payload
    },
    disconnectWallet: (state) => {
      state.isConnected = false
      state.address = null
      state.balance = null
      state.api = null
      state.extension = null
    },
    setWallet: (state, action: PayloadAction<{ api: ApiPromise; extension: InjectedExtension }>) => {
      state.api = action.payload.api
      state.extension = action.payload.extension
    },
    updateBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload
    }
  }
})

export const {
  connectWalletStart,
  connectWalletSuccess,
  connectWalletFailure,
  disconnectWallet,
  setWallet,
  updateBalance
} = walletSlice.actions

export default walletSlice.reducer 