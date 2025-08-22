import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { useEscrowContract } from '../../hooks/useEscrowContract';
import * as escrowContractUtils from '../../utils/escrowContractUtils';

// Mock axios
vi.mock('axios');

// Mock escrow contract utils
vi.mock('../../utils/escrowContractUtils', () => ({
  createEscrowContract: vi.fn(),
  getEscrowContract: vi.fn(),
  listEscrowsContract: vi.fn(),
  updateEscrowStatusContract: vi.fn(),
  updateMilestoneStatusContract: vi.fn(),
  releaseMilestoneContract: vi.fn(),
  disputeMilestoneContract: vi.fn(),
}));

const mockApi = {
  rpc: {
    chain: {
      getBlockHash: vi.fn(),
      getBlock: vi.fn(),
      getFinalizedHead: vi.fn(),
    },
  },
  call: {
    transactionPaymentApi: {
      queryInfo: vi.fn(),
    },
  },
} as unknown as ApiPromise;

const mockAccount: InjectedAccountWithMeta = {
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  meta: {
    name: 'Test Account',
    source: 'polkadot-js',
  },
  type: 'sr25519',
};

const mockTestAccount: InjectedAccountWithMeta = {
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  meta: {
    name: 'Test Account',
    source: 'test',
  },
  type: 'sr25519',
};

const mockGetSigner = vi.fn().mockResolvedValue({
  success: true,
  signer: {
    signPayload: vi.fn(),
    signRaw: vi.fn(),
    update: vi.fn(),
  },
});

const sampleEscrowData = {
  id: 'escrow_123',
  title: 'Test Escrow',
  description: 'Test Description',
  totalAmount: '1000',
  creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  counterpartyType: 'freelancer',
  status: 'Active' as const,
  createdAt: Date.now(),
  milestones: [
    {
      id: 'milestone_1',
      description: 'Design Phase',
      amount: '500',
      status: 'Pending' as const,
      deadline: Date.now() + 86400000,
    },
  ],
  transactionHash: '0x123456789abcdef',
};

describe('useEscrowContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hook initialization', () => {
    it('returns all expected functions', () => {
      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      expect(result.current).toHaveProperty('createEscrow');
      expect(result.current).toHaveProperty('getEscrow');
      expect(result.current).toHaveProperty('listEscrows');
      expect(result.current).toHaveProperty('releaseMilestone');
      expect(result.current).toHaveProperty('disputeMilestone');
      expect(result.current).toHaveProperty('notifyCounterparty');
      expect(result.current).toHaveProperty('updateEscrowStatus');
      expect(result.current).toHaveProperty('updateEscrowMilestoneStatus');
      expect(result.current).toHaveProperty('checkTransactionStatus');
    });
  });

  describe('createEscrow', () => {
    it('creates escrow successfully', async () => {
      const mockCreateEscrowContract = vi.mocked(escrowContractUtils.createEscrowContract);
      mockCreateEscrowContract.mockResolvedValue({
        success: true,
        escrowId: 'escrow_123',
        transactionHash: '0x123456789',
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.createEscrow(
          mockAccount.address,
          '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          'freelancer',
          'Active',
          'Test Escrow',
          'Test Description',
          '1000',
          [
            {
              id: 'milestone_1',
              description: 'Design Phase',
              amount: '500',
              status: 'Pending',
              deadline: Date.now() + 86400000,
            },
          ]
        );
      });

      expect(response).toEqual({
        recipientAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        success: true,
        escrowId: 'escrow_123',
        transactionHash: '0x123456789',
      });

      expect(mockCreateEscrowContract).toHaveBeenCalledWith(
        mockApi,
        mockAccount,
        mockAccount.address, // Should use account.address
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        'freelancer',
        'Active',
        'Test Escrow',
        'Test Description',
        '1000',
        expect.any(Array),
        undefined
      );
    });

    it('handles API not available error', async () => {
      const { result } = renderHook(() =>
        useEscrowContract({
          api: null,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.createEscrow(
          mockAccount.address,
          '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          'freelancer',
          'Active',
          'Test Escrow',
          'Test Description',
          '1000',
          []
        );
      });

      expect(response).toEqual({
        success: false,
        error: 'API or account not available',
      });
    });

    it('handles contract creation failure', async () => {
      const mockCreateEscrowContract = vi.mocked(escrowContractUtils.createEscrowContract);
      mockCreateEscrowContract.mockResolvedValue({
        success: false,
        error: 'Contract execution failed',
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.createEscrow(
          mockAccount.address,
          '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          'freelancer',
          'Active',
          'Test Escrow',
          'Test Description',
          '1000',
          []
        );
      });

      expect(response).toEqual({
        success: false,
        error: 'Contract execution failed',
      });
    });
  });

  describe('getEscrow', () => {
    it('retrieves escrow successfully', async () => {
      const mockGetEscrowContract = vi.mocked(escrowContractUtils.getEscrowContract);
      mockGetEscrowContract.mockResolvedValue({
        success: true,
        data: sampleEscrowData,
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.getEscrow('escrow_123');
      });

      expect(response).toEqual({
        success: true,
        escrow: sampleEscrowData,
      });

      expect(mockGetEscrowContract).toHaveBeenCalledWith(mockApi, mockAccount, 'escrow_123');
    });

    it('handles escrow not found', async () => {
      const mockGetEscrowContract = vi.mocked(escrowContractUtils.getEscrowContract);
      mockGetEscrowContract.mockResolvedValue({
        success: false,
        error: 'Escrow not found',
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.getEscrow('nonexistent');
      });

      expect(response).toEqual({
        success: false,
        error: 'Escrow not found',
      });
    });
  });

  describe('listEscrows', () => {
    it('lists escrows successfully', async () => {
      const mockListEscrowsContract = vi.mocked(escrowContractUtils.listEscrowsContract);
      mockListEscrowsContract.mockResolvedValue({
        success: true,
        data: [sampleEscrowData],
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.listEscrows();
      });

      expect(response).toEqual({
        success: true,
        escrows: [sampleEscrowData],
      });

      expect(mockListEscrowsContract).toHaveBeenCalledWith(mockApi, mockAccount);
    });

    it('handles empty escrows list', async () => {
      const mockListEscrowsContract = vi.mocked(escrowContractUtils.listEscrowsContract);
      mockListEscrowsContract.mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.listEscrows();
      });

      expect(response).toEqual({
        success: true,
        escrows: [],
      });
    });
  });

  describe('releaseMilestone', () => {
    it('releases milestone successfully', async () => {
      const mockReleaseMilestoneContract = vi.mocked(escrowContractUtils.releaseMilestoneContract);
      mockReleaseMilestoneContract.mockResolvedValue({
        success: true,
        transactionHash: '0xabc123def456',
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.releaseMilestone('escrow_123', 'milestone_1');
      });

      expect(response).toEqual({
        success: true,
        recieverAddress: mockAccount.address,
        payerAddress: mockAccount.address,
        transactionHash: '0xabc123def456',
      });

      expect(mockReleaseMilestoneContract).toHaveBeenCalledWith(
        mockApi,
        mockAccount,
        'escrow_123',
        'milestone_1'
      );
    });

    it('handles signer error', async () => {
      const mockGetSignerError = vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed to get signer',
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSignerError,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.releaseMilestone('escrow_123', 'milestone_1');
      });

      expect(response).toEqual({
        success: false,
        error: 'Failed to get signer',
      });
    });
  });

  describe('disputeMilestone', () => {
    it('disputes milestone successfully', async () => {
      const mockDisputeMilestoneContract = vi.mocked(escrowContractUtils.disputeMilestoneContract);
      mockDisputeMilestoneContract.mockResolvedValue({
        success: true,
        transactionHash: '0xdef456ghi789',
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.disputeMilestone(
          'escrow_123',
          'milestone_1',
          'Work not completed',
          mockAccount.address,
          'client',
          'Disputed'
        );
      });

      expect(response).toEqual({
        success: true,
        escrowId: 'escrow_123',
        message: 'Milestone disputed successfully',
        transactionHash: '0xdef456ghi789',
      });

      expect(mockDisputeMilestoneContract).toHaveBeenCalledWith(
        mockApi,
        mockAccount,
        'escrow_123',
        'milestone_1',
        'Work not completed'
      );
    });
  });

  describe('updateEscrowStatus', () => {
    it('updates escrow status successfully', async () => {
      const mockUpdateEscrowStatusContract = vi.mocked(escrowContractUtils.updateEscrowStatusContract);
      mockUpdateEscrowStatusContract.mockResolvedValue({
        success: true,
        transactionHash: '0xupdated123',
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.updateEscrowStatus('escrow_123', 'Completed');
      });

      expect(response).toEqual({
        success: true,
        escrow: { id: 'escrow_123', status: 'Completed', transactionHash: '0xupdated123' },
        message: 'Escrow status updated to Completed',
        transactionHash: '0xupdated123',
      });
    });
  });

  describe('updateEscrowMilestoneStatus', () => {
    it('updates milestone status successfully', async () => {
      const mockUpdateMilestoneStatusContract = vi.mocked(escrowContractUtils.updateMilestoneStatusContract);
      mockUpdateMilestoneStatusContract.mockResolvedValue({
        success: true,
        transactionHash: '0xmilestone123',
      });

      const milestone = {
        id: 'milestone_1',
        description: 'Design Phase',
        amount: '500',
        status: 'Pending' as const,
        deadline: Date.now() + 86400000,
      };

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.updateEscrowMilestoneStatus(
          'escrow_123',
          milestone,
          'InProgress'
        );
      });

      expect(response).toEqual({
        success: true,
        escrow: { id: 'escrow_123', milestones: [{ ...milestone, status: 'InProgress' }] },
        message: 'Milestone status updated to InProgress',
        transactionHash: '0xmilestone123',
      });
    });
  });

  describe('checkTransactionStatus', () => {
    it('finds transaction in recent blocks', async () => {
      const mockTransaction = {
        hash: {
          toHex: () => '0x123456789abcdef',
        },
      };

      const mockBlock = {
        block: {
          header: {
            number: { toNumber: () => 1000 },
          },
          extrinsics: [mockTransaction],
        },
      };

      mockApi.rpc.chain.getBlockHash.mockResolvedValue({
        toHex: () => '0xblockhash123'
      });
      mockApi.rpc.chain.getBlock.mockResolvedValue(mockBlock);
      mockApi.rpc.chain.getFinalizedHead.mockResolvedValue({
        toHex: () => '0xfinalizedhash'
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.checkTransactionStatus('0x123456789abcdef');
      });

      expect(response).toEqual({
        success: true,
        receipt: {
          status: 1,
          transactionHash: '0x123456789abcdef',
          blockHash: '0xblockhash123',
          blockNumber: 1000,
          finalized: true,
        },
      });
    });

    it('handles transaction not found', async () => {
      const mockBlock = {
        block: {
          header: {
            number: { toNumber: () => 1000 },
          },
          extrinsics: [],
        },
      };

      mockApi.rpc.chain.getBlockHash.mockResolvedValue({
        toHex: () => '0xblockhash123'
      });
      mockApi.rpc.chain.getBlock.mockResolvedValue(mockBlock);

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.checkTransactionStatus('0xnotfound');
      });

      expect(response).toEqual({
        success: false,
        error: 'Transaction not found in recent blocks',
      });
    });

    it('handles API error during transaction check', async () => {
      mockApi.rpc.chain.getBlockHash.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.checkTransactionStatus('0x123456789abcdef');
      });

      expect(response).toEqual({
        success: false,
        error: 'Network error',
      });
    });
  });

  describe('test account handling', () => {
    it('uses mock signer for test accounts', async () => {
      const mockCreateEscrowContract = vi.mocked(escrowContractUtils.createEscrowContract);
      mockCreateEscrowContract.mockResolvedValue({
        success: true,
        escrowId: 'escrow_123',
        transactionHash: '0x123456789',
      });

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockTestAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.createEscrow(
          mockTestAccount.address,
          '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          'freelancer',
          'Active',
          'Test Escrow',
          'Test Description',
          '1000',
          []
        );
      });

      expect(response.success).toBe(true);
      expect(mockGetSigner).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles generic errors in contract calls', async () => {
      const mockCreateEscrowContract = vi.mocked(escrowContractUtils.createEscrowContract);
      mockCreateEscrowContract.mockRejectedValue(new Error('Generic contract error'));

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.createEscrow(
          mockAccount.address,
          '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          'freelancer',
          'Active',
          'Test Escrow',
          'Test Description',
          '1000',
          []
        );
      });

      expect(response).toEqual({
        success: false,
        error: 'Generic contract error',
      });
    });

    it('handles non-Error exceptions', async () => {
      const mockCreateEscrowContract = vi.mocked(escrowContractUtils.createEscrowContract);
      mockCreateEscrowContract.mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useEscrowContract({
          api: mockApi,
          account: mockAccount,
          getSigner: mockGetSigner,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.createEscrow(
          mockAccount.address,
          '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          'freelancer',
          'Active',
          'Test Escrow',
          'Test Description',
          '1000',
          []
        );
      });

      expect(response).toEqual({
        success: false,
        error: 'Failed to create escrow',
      });
    });
  });
});