import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import DisputeResolution from '../../pages/DisputeResolution';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}));

// Mock the useWallet hook
vi.mock('../../hooks/useWalletContext', () => ({
  useWallet: () => ({
    selectedAccount: {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Client address
      name: 'ClientCo',
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: true,
    accounts: [
      {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        name: 'ClientCo',
      },
    ],
  }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

describe('DisputeResolution Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders loading state initially', () => {
    renderWithProviders(<DisputeResolution />);
    
    // Should show loading spinner
    expect(screen.getByText('Loading dispute data...')).toBeInTheDocument();
  });
  
  it('displays dispute details after loading', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Check that dispute details are displayed
    expect(screen.getByText('Dispute Resolution')).toBeInTheDocument();
    expect(screen.getByText(/Dispute: Logo Design Services/)).toBeInTheDocument();
    expect(screen.getByText('Reason for Dispute:')).toBeInTheDocument();
    expect(screen.getByText(/The delivered logo files are not in the format/)).toBeInTheDocument();
  });
  
  it('shows correct tabs', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Check that all tabs are present
    expect(screen.getByRole('tab', { name: /Communication/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Evidence/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Resolution Proposals/i })).toBeInTheDocument();
  });
  
  it('displays messages in communication tab', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Communication tab should be active by default
    // Check for message content
    expect(screen.getByText(/I need vector files/)).toBeInTheDocument();
    expect(screen.getByText(/I apologize for the misunderstanding/)).toBeInTheDocument();
  });
  
  it('allows sending new messages', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Find message input
    const messageInput = screen.getByPlaceholderText('Type your message here...');
    
    // Type a message
    fireEvent.change(messageInput, { target: { value: 'Test message from client' } });
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(sendButton);
    
    // Message should be added to the chat
    expect(screen.getByText('Test message from client')).toBeInTheDocument();
    
    // Input should be cleared
    expect(messageInput).toHaveValue('');
  });
  
  it('can switch to Evidence tab and view evidence', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Click on Evidence tab
    const evidenceTab = screen.getByRole('tab', { name: /Evidence/i });
    fireEvent.click(evidenceTab);
    
    // Should show evidence items
    await waitFor(() => {
      expect(screen.getByText('Original Contract Agreement')).toBeInTheDocument();
      expect(screen.getByText('Delivered Files')).toBeInTheDocument();
    });
    
    // Check evidence details
    expect(screen.getByText(/The contract clearly states that all deliverables/)).toBeInTheDocument();
    
    // Check file attachments
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByText('logo-vectors.zip')).toBeInTheDocument();
  });
  
  it('can switch to Resolution Proposals tab', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Click on Resolution Proposals tab
    const proposalsTab = screen.getByRole('tab', { name: /Resolution Proposals/i });
    fireEvent.click(proposalsTab);
    
    // Should show proposal details
    await waitFor(() => {
      expect(screen.getByText(/I propose that I fix the color profile issues/)).toBeInTheDocument();
    });
    
    // As client, should have options to accept/reject
    expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
  });
  
  it('can accept a resolution proposal', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Go to Resolution Proposals tab
    const proposalsTab = screen.getByRole('tab', { name: /Resolution Proposals/i });
    fireEvent.click(proposalsTab);
    
    // Wait for tab content to load
    await waitFor(() => {
      expect(screen.getByText(/I propose that I fix the color profile issues/)).toBeInTheDocument();
    });
    
    // Click Accept button
    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);
    
    // Should update status (proposal accepted, but not fully resolved yet)
    expect(mockToast).toHaveBeenCalled();
  });
  
  it('can submit new resolution proposal', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Go to Resolution Proposals tab
    const proposalsTab = screen.getByRole('tab', { name: /Resolution Proposals/i });
    fireEvent.click(proposalsTab);
    
    // Wait for tab content to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Propose Resolution/i })).toBeInTheDocument();
    });
    
    // Click Propose Resolution button
    const proposeButton = screen.getByRole('button', { name: /Propose Resolution/i });
    fireEvent.click(proposeButton);
    
    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Propose Resolution')).toBeInTheDocument();
    });
    
    // Type proposal
    const proposalInput = screen.getByPlaceholderText('Describe your proposed resolution...');
    fireEvent.change(proposalInput, { target: { value: 'I propose a 50% refund and we end the contract.' } });
    
    // Submit proposal
    const submitButton = screen.getByRole('button', { name: /Submit Proposal/i });
    fireEvent.click(submitButton);
    
    // Should show toast and add proposal to the list
    expect(mockToast).toHaveBeenCalled();
    expect(screen.getByText('I propose a 50% refund and we end the contract.')).toBeInTheDocument();
  });
  
  it('can submit new evidence', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Go to Evidence tab
    const evidenceTab = screen.getByRole('tab', { name: /Evidence/i });
    fireEvent.click(evidenceTab);
    
    // Click Submit Evidence button
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Submit Evidence/i });
      fireEvent.click(submitButton);
    });
    
    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Submit Evidence')).toBeInTheDocument();
    });
    
    // Fill out evidence form
    const titleInput = screen.getByPlaceholderText('Title for your evidence');
    fireEvent.change(titleInput, { target: { value: 'Additional Requirements Document' } });
    
    const descriptionInput = screen.getByPlaceholderText('Describe your evidence...');
    fireEvent.change(descriptionInput, { target: { value: 'This document outlines the exact color specifications required.' } });
    
    // Submit evidence
    const submitButton = screen.getByRole('button', { name: /Submit Evidence$/i });
    fireEvent.click(submitButton);
    
    // Should show toast and add evidence to the list
    expect(mockToast).toHaveBeenCalled();
  });
  
  it('can request a mediator', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading dispute data...')).not.toBeInTheDocument();
    });
    
    // Go to Resolution Proposals tab
    const proposalsTab = screen.getByRole('tab', { name: /Resolution Proposals/i });
    fireEvent.click(proposalsTab);
    
    // Click Request Mediator button
    await waitFor(() => {
      const mediatorButton = screen.getByRole('button', { name: /Request Mediator/i });
      fireEvent.click(mediatorButton);
    });
    
    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Request a Mediator')).toBeInTheDocument();
    });
    
    // Confirm request
    const confirmButton = screen.getByRole('button', { name: /Request Mediator$/i });
    fireEvent.click(confirmButton);
    
    // Should show toast
    expect(mockToast).toHaveBeenCalled();
    
    // Dispute status should change to mediation
    await waitFor(() => {
      expect(screen.getByText('Mediation')).toBeInTheDocument();
    });
  });
}); 