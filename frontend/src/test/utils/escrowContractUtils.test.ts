import { vi } from 'vitest';
import { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import {
  createEscrowContract,
  getEscrowContract,
  listEscrowsContract,
  updateEscrowStatusContract,
  updateMilestoneStatusContract,
  releaseMilestoneContract,
  disputeMilestoneContract,
  estimateGas,
  safeTimestampConversion,
} from '../../utils/escrowContractUtils';

// Mock ContractPromise
const mockContractPromise = {
  query: {
    createEscrow: vi.fn(),
    getEscrow: vi.fn(),
    listEscrows: vi.fn(),
    updateEscrowStatus: vi.fn(),
    updateMilestoneStatus: vi.fn(),
    releaseMilestone: vi.fn(),
    disputeMilestone: vi.fn(),
  },
  tx: {
    createEscrow: vi.fn(),
    getEscrow: vi.fn(),
    listEscrows: vi.fn(),
    updateEscrowStatus: vi.fn(),
    updateMilestoneStatus: vi.fn(),
    releaseMilestone: vi.fn(),
    disputeMilestone: vi.fn(),
  },
};

// Mock @polkadot/api-contract
vi.mock('@polkadot/api-contract', () => ({
  ContractPromise: vi.fn(() => mockContractPromise),
}));

const mockApi = {
  call: {
    transactionPaymentApi: {
      queryInfo: vi.fn(),
    },
  },
  registry: {
    createType: vi.fn(),
  },
  tx: {
    contracts: {
      call: vi.fn(),
    },
  },
  derive: {
    accounts: {
      info: vi.fn(),
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

const mockMilestone = {
  id: 'milestone_1',
  description: 'Design Phase',
  amount: '500',
  status: 'Pending' as const,
  deadline: Date.now() + 86400000,
};

describe('escrowContractUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('estimateGas', () => {
    it('estimates gas successfully with buffer', async () => {
      const mockWeightV2 = {
        refTime: { toBigInt: () => BigInt(1000000) },
        proofSize: { toBigInt: () => BigInt(50000) },
      };

      const mockQueryResult = {
        output: null,
        result: { isOk: true, asOk: null },
        gasRequired: mockWeightV2,
        storageDeposit: { isCharge: false },
      };

      mockContractPromise.query.createEscrow.mockResolvedValue(mockQueryResult);

      const gasLimit = await estimateGas(
        mockApi,
        mockContractPromise as any,
        'createEscrow',
        mockAccount,
        []
      );

      expect(gasLimit).toEqual({
        refTime: BigInt(1250000), // 1000000 * 1.25
        proofSize: BigInt(62500), // 50000 * 1.25
      });
    });

    it('uses default gas on estimation failure', async () => {
      mockContractPromise.query.createEscrow.mockRejectedValue(new Error('Query failed'));

      const gasLimit = await estimateGas(
        mockApi,
        mockContractPromise as any,
        'createEscrow',
        mockAccount,
        []
      );

      expect(gasLimit).toEqual({
        refTime: BigInt(30000000000),
        proofSize: BigInt(1048576),
      });
    });

    it('uses default gas when query result is not ok', async () => {
      const mockQueryResult = {
        result: { isOk: false },
        gasRequired: null,
      };

      mockContractPromise.query.createEscrow.mockResolvedValue(mockQueryResult);

      const gasLimit = await estimateGas(
        mockApi,
        mockContractPromise as any,
        'createEscrow',
        mockAccount,
        []
      );

      expect(gasLimit).toEqual({
        refTime: BigInt(30000000000),
        proofSize: BigInt(1048576),
      });
    });
  });

  describe('safeTimestampConversion', () => {
    it('converts valid future timestamp', () => {
      const futureTime = Date.now() + 86400000; // 1 day from now
      const result = safeTimestampConversion(futureTime);
      expect(result).toBe(futureTime);
    });

    it('converts invalid timestamp to default future date', () => {
      const result = safeTimestampConversion(1); // Invalid timestamp
      expect(result).toBeGreaterThan(Date.now());
      expect(result).toBeLessThan(Date.now() + 7 * 24 * 60 * 60 * 1000 + 1000); // Within 7 days + 1 second
    });

    it('converts past timestamp to default future date', () => {
      const pastTime = Date.now() - 86400000; // 1 day ago
      const result = safeTimestampConversion(pastTime);
      expect(result).toBeGreaterThan(Date.now());
    });

    it('handles zero timestamp', () => {
      const result = safeTimestampConversion(0);
      expect(result).toBeGreaterThan(Date.now());
    });

    it('handles negative timestamp', () => {
      const result = safeTimestampConversion(-1000);
      expect(result).toBeGreaterThan(Date.now());
    });
  });

  describe('createEscrowContract', () => {
    it('creates escrow successfully', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockResolvedValue({
          hash: { toHex: () => '0x123456789abcdef' },
          dispatchError: null,
          events: [],
          status: { isFinalized: true },
        }),
      };

      mockContractPromise.tx.createEscrow.mockReturnValue(mockTxResult);

      const result = await createEscrowContract(
        mockApi,
        mockAccount,
        mockAccount.address,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        'freelancer',
        'Active',
        'Test Escrow',
        'Test Description',
        '1000',
        [mockMilestone],
        '0xusdt123'
      );

      expect(result).toEqual({
        success: true,
        escrowId: '0x123456789abcdef',
        transactionHash: '0x123456789abcdef',
      });
    });

    it('handles transaction signing failure', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockRejectedValue(new Error('Signing failed')),
      };

      mockContractPromise.tx.createEscrow.mockReturnValue(mockTxResult);

      const result = await createEscrowContract(
        mockApi,
        mockAccount,
        mockAccount.address,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        'freelancer',
        'Active',
        'Test Escrow',
        'Test Description',
        '1000',
        [mockMilestone]
      );

      expect(result).toEqual({
        success: false,
        error: 'Signing failed',
      });
    });

    it('handles dispatch error in transaction result', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockResolvedValue({
          hash: { toHex: () => '0x123456789abcdef' },
          dispatchError: { toString: () => 'Dispatch error occurred' },
          events: [],
          status: { isFinalized: true },
        }),
      };

      mockContractPromise.tx.createEscrow.mockReturnValue(mockTxResult);

      const result = await createEscrowContract(
        mockApi,
        mockAccount,
        mockAccount.address,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        'freelancer',
        'Active',
        'Test Escrow',
        'Test Description',
        '1000',
        [mockMilestone]
      );

      expect(result).toEqual({
        success: false,
        error: 'Transaction failed: Dispatch error occurred',
      });
    });
  });

  describe('getEscrowContract', () => {
    it('retrieves escrow successfully', async () => {
      const mockEscrowData = {
        id: 'escrow_123',
        title: 'Test Escrow',
        description: 'Test Description',
        status: 'Active',
        totalAmount: '1000',
        creatorAddress: mockAccount.address,
        counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        milestones: [mockMilestone],
        createdAt: Date.now(),
      };

      const mockQueryResult = {
        output: mockEscrowData,
        result: { isOk: true },
      };

      mockContractPromise.query.getEscrow.mockResolvedValue(mockQueryResult);

      const result = await getEscrowContract(mockApi, mockAccount, 'escrow_123');

      expect(result).toEqual({
        success: true,
        data: mockEscrowData,
      });

      expect(mockContractPromise.query.getEscrow).toHaveBeenCalledWith(
        mockAccount.address,
        { gasLimit: expect.any(Object) },
        'escrow_123'
      );
    });

    it('handles escrow not found', async () => {
      const mockQueryResult = {
        output: null,
        result: { isOk: false },
      };

      mockContractPromise.query.getEscrow.mockResolvedValue(mockQueryResult);

      const result = await getEscrowContract(mockApi, mockAccount, 'nonexistent');

      expect(result).toEqual({
        success: false,
        error: 'Escrow not found',
      });
    });

    it('handles query error', async () => {
      mockContractPromise.query.getEscrow.mockRejectedValue(new Error('Query failed'));

      const result = await getEscrowContract(mockApi, mockAccount, 'escrow_123');

      expect(result).toEqual({
        success: false,
        error: 'Query failed',
      });
    });
  });

  describe('listEscrowsContract', () => {
    it('lists escrows successfully', async () => {
      const mockEscrows = [
        {
          id: 'escrow_1',
          title: 'Escrow 1',
          status: 'Active',
        },
        {
          id: 'escrow_2',
          title: 'Escrow 2',
          status: 'Completed',
        },
      ];

      const mockQueryResult = {
        output: mockEscrows,
        result: { isOk: true },
      };

      mockContractPromise.query.listEscrows.mockResolvedValue(mockQueryResult);

      const result = await listEscrowsContract(mockApi, mockAccount);

      expect(result).toEqual({
        success: true,
        data: mockEscrows,
      });
    });

    it('returns empty array when no escrows found', async () => {
      const mockQueryResult = {
        output: [],
        result: { isOk: true },
      };

      mockContractPromise.query.listEscrows.mockResolvedValue(mockQueryResult);

      const result = await listEscrowsContract(mockApi, mockAccount);

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('updateEscrowStatusContract', () => {
    it('updates escrow status successfully', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockResolvedValue({
          hash: { toHex: () => '0xupdate123' },
          dispatchError: null,
          events: [],
          status: { isFinalized: true },
        }),
      };

      mockContractPromise.tx.updateEscrowStatus.mockReturnValue(mockTxResult);

      const result = await updateEscrowStatusContract(
        mockApi,
        mockAccount,
        'escrow_123',
        'Completed'
      );

      expect(result).toEqual({
        success: true,
        transactionHash: '0xupdate123',
      });
    });

    it('handles update failure', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockRejectedValue(new Error('Update failed')),
      };

      mockContractPromise.tx.updateEscrowStatus.mockReturnValue(mockTxResult);

      const result = await updateEscrowStatusContract(
        mockApi,
        mockAccount,
        'escrow_123',
        'Completed'
      );

      expect(result).toEqual({
        success: false,
        error: 'Update failed',
      });
    });
  });

  describe('updateMilestoneStatusContract', () => {
    it('updates milestone status successfully', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockResolvedValue({
          hash: { toHex: () => '0xmilestone123' },
          dispatchError: null,
          events: [],
          status: { isFinalized: true },
        }),
      };

      mockContractPromise.tx.updateMilestoneStatus.mockReturnValue(mockTxResult);

      const result = await updateMilestoneStatusContract(
        mockApi,
        mockAccount,
        'escrow_123',
        mockMilestone,
        'InProgress'
      );

      expect(result).toEqual({
        success: true,
        transactionHash: '0xmilestone123',
      });
    });
  });

  describe('releaseMilestoneContract', () => {
    it('releases milestone successfully', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockResolvedValue({
          hash: { toHex: () => '0xrelease123' },
          dispatchError: null,
          events: [],
          status: { isFinalized: true },
        }),
      };

      mockContractPromise.tx.releaseMilestone.mockReturnValue(mockTxResult);

      const result = await releaseMilestoneContract(
        mockApi,
        mockAccount,
        'escrow_123',
        'milestone_1'
      );

      expect(result).toEqual({
        success: true,
        transactionHash: '0xrelease123',
      });
    });

    it('handles insufficient balance error', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockResolvedValue({
          hash: { toHex: () => '0xfailed123' },
          dispatchError: { toString: () => 'Insufficient balance' },
          events: [],
          status: { isFinalized: true },
        }),
      };

      mockContractPromise.tx.releaseMilestone.mockReturnValue(mockTxResult);

      const result = await releaseMilestoneContract(
        mockApi,
        mockAccount,
        'escrow_123',
        'milestone_1'
      );

      expect(result).toEqual({
        success: false,
        error: 'Transaction failed: Insufficient balance',
      });
    });
  });

  describe('disputeMilestoneContract', () => {
    it('disputes milestone successfully', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockResolvedValue({
          hash: { toHex: () => '0xdispute123' },
          dispatchError: null,
          events: [],
          status: { isFinalized: true },
        }),
      };

      mockContractPromise.tx.disputeMilestone.mockReturnValue(mockTxResult);

      const result = await disputeMilestoneContract(
        mockApi,
        mockAccount,
        'escrow_123',
        'milestone_1',
        'Work not completed as specified'
      );

      expect(result).toEqual({
        success: true,
        transactionHash: '0xdispute123',
      });
    });

    it('handles dispute reason validation', async () => {
      const result = await disputeMilestoneContract(
        mockApi,
        mockAccount,
        'escrow_123',
        'milestone_1',
        '' // Empty reason
      );

      expect(result).toEqual({
        success: false,
        error: 'Dispute reason is required',
      });
    });

    it('handles transaction signing failure in dispute', async () => {
      const mockTxResult = {
        signAndSend: vi.fn().mockRejectedValue(new Error('User rejected transaction')),
      };

      mockContractPromise.tx.disputeMilestone.mockReturnValue(mockTxResult);

      const result = await disputeMilestoneContract(
        mockApi,
        mockAccount,
        'escrow_123',
        'milestone_1',
        'Valid dispute reason'
      );

      expect(result).toEqual({
        success: false,
        error: 'User rejected transaction',
      });
    });
  });

  describe('error handling', () => {
    it('handles missing API gracefully', async () => {
      const result = await createEscrowContract(
        null as any,
        mockAccount,
        mockAccount.address,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        'freelancer',
        'Active',
        'Test Escrow',
        'Test Description',
        '1000',
        [mockMilestone]
      );

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('API'),
      });
    });

    it('handles missing account gracefully', async () => {
      const result = await createEscrowContract(
        mockApi,
        null as any,
        mockAccount.address,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        'freelancer',
        'Active',
        'Test Escrow',
        'Test Description',
        '1000',
        [mockMilestone]
      );

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('account'),
      });
    });

    it('handles contract instantiation failure', async () => {
      // Mock ContractPromise constructor to throw
      const { ContractPromise } = await import('@polkadot/api-contract');
      vi.mocked(ContractPromise).mockImplementationOnce(() => {
        throw new Error('Failed to instantiate contract');
      });

      const result = await createEscrowContract(
        mockApi,
        mockAccount,
        mockAccount.address,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        'freelancer',
        'Active',
        'Test Escrow',
        'Test Description',
        '1000',
        [mockMilestone]
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to instantiate contract',
      });
    });
  });

  describe('milestone validation', () => {
    it('validates milestone data before contract calls', () => {
      const invalidMilestone = {
        id: '',
        description: '',
        amount: '0',
        status: 'Invalid' as any,
        deadline: -1,
      };

      // The safeTimestampConversion should handle invalid deadline
      const safeDeadline = safeTimestampConversion(invalidMilestone.deadline);
      expect(safeDeadline).toBeGreaterThan(Date.now());
    });

    it('handles milestone amount validation', async () => {
      const milestoneWithZeroAmount = {
        ...mockMilestone,
        amount: '0',
      };

      const mockTxResult = {
        signAndSend: vi.fn().mockResolvedValue({
          hash: { toHex: () => '0x123456789abcdef' },
          dispatchError: null,
          events: [],
          status: { isFinalized: true },
        }),
      };

      mockContractPromise.tx.createEscrow.mockReturnValue(mockTxResult);

      const result = await createEscrowContract(
        mockApi,
        mockAccount,
        mockAccount.address,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        'freelancer',
        'Active',
        'Test Escrow',
        'Test Description',
        '1000',
        [milestoneWithZeroAmount]
      );

      // Should still succeed but with the zero amount milestone
      expect(result.success).toBe(true);
    });
  });
});