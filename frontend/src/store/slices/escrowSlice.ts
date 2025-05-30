import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Milestone {
  id: string
  title: string
  description: string
  percentage: number
  amount: string
  status: 'pending' | 'complete' | 'disputed'
  deadline?: string
}

export interface Escrow {
  id: string
  title: string
  description?: string
  client: {
    address: string
    name?: string
  }
  provider: {
    address: string
    name?: string
  }
  totalAmount: string
  releasedAmount: string
  remainingAmount: string
  status: 'active' | 'complete' | 'cancelled' | 'disputed'
  createdAt: string
  deadlineAt?: string
  milestones: Milestone[]
}

interface EscrowState {
  escrows: Escrow[]
  currentEscrow: Escrow | null
  isLoading: boolean
  error: string | null
}

const initialState: EscrowState = {
  escrows: [],
  currentEscrow: null,
  isLoading: false,
  error: null
}

export const escrowSlice = createSlice({
  name: 'escrow',
  initialState,
  reducers: {
    fetchEscrowsStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchEscrowsSuccess: (state, action: PayloadAction<Escrow[]>) => {
      state.escrows = action.payload
      state.isLoading = false
    },
    fetchEscrowsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    fetchEscrowByIdStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchEscrowByIdSuccess: (state, action: PayloadAction<Escrow>) => {
      state.currentEscrow = action.payload
      state.isLoading = false
    },
    fetchEscrowByIdFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    createEscrowStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    createEscrowSuccess: (state, action: PayloadAction<Escrow>) => {
      state.escrows.push(action.payload)
      state.isLoading = false
    },
    createEscrowFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    updateMilestoneStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    updateMilestoneSuccess: (state, action: PayloadAction<{ escrowId: string; milestone: Milestone }>) => {
      const { escrowId, milestone } = action.payload
      const escrowIndex = state.escrows.findIndex(e => e.id === escrowId)
      
      if (escrowIndex !== -1) {
        const milestoneIndex = state.escrows[escrowIndex].milestones.findIndex(m => m.id === milestone.id)
        
        if (milestoneIndex !== -1) {
          state.escrows[escrowIndex].milestones[milestoneIndex] = milestone
          
          // Update related fields
          if (milestone.status === 'complete') {
            const releasedAmount = state.escrows[escrowIndex].milestones
              .filter(m => m.status === 'complete')
              .reduce((sum, m) => sum + parseFloat(m.amount), 0)
              .toString()
            
            state.escrows[escrowIndex].releasedAmount = releasedAmount
            state.escrows[escrowIndex].remainingAmount = (
              parseFloat(state.escrows[escrowIndex].totalAmount) - parseFloat(releasedAmount)
            ).toString()
          }
        }
      }
      
      if (state.currentEscrow?.id === escrowId) {
        const milestoneIndex = state.currentEscrow.milestones.findIndex(m => m.id === milestone.id)
        
        if (milestoneIndex !== -1) {
          state.currentEscrow.milestones[milestoneIndex] = milestone
          
          // Update related fields
          if (milestone.status === 'complete') {
            const releasedAmount = state.currentEscrow.milestones
              .filter(m => m.status === 'complete')
              .reduce((sum, m) => sum + parseFloat(m.amount), 0)
              .toString()
            
            state.currentEscrow.releasedAmount = releasedAmount
            state.currentEscrow.remainingAmount = (
              parseFloat(state.currentEscrow.totalAmount) - parseFloat(releasedAmount)
            ).toString()
          }
        }
      }
      
      state.isLoading = false
    },
    updateMilestoneFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    clearCurrentEscrow: (state) => {
      state.currentEscrow = null
    }
  }
})

export const {
  fetchEscrowsStart,
  fetchEscrowsSuccess,
  fetchEscrowsFailure,
  fetchEscrowByIdStart,
  fetchEscrowByIdSuccess,
  fetchEscrowByIdFailure,
  createEscrowStart,
  createEscrowSuccess,
  createEscrowFailure,
  updateMilestoneStart,
  updateMilestoneSuccess,
  updateMilestoneFailure,
  clearCurrentEscrow
} = escrowSlice.actions

export default escrowSlice.reducer 