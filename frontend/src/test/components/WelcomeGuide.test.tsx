import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import WelcomeGuide from '../../components/WelcomeGuide';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useLocalStorage hook
vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: () => [false, vi.fn()],
}));

describe('WelcomeGuide Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly with default props', () => {
    renderWithProviders(<WelcomeGuide />);
    
    // The welcome guide should be visible
    expect(screen.getByText('Getting Started with .escrow')).toBeInTheDocument();
    
    // Check that the first step is active
    expect(screen.getByText('Welcome to .escrow')).toBeInTheDocument();
    
    // Check for navigation buttons
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });
  
  it('navigates through steps with Next button', async () => {
    renderWithProviders(<WelcomeGuide />);
    
    // Initial step should be "Welcome to .escrow"
    expect(screen.getByText('Welcome to .escrow')).toBeInTheDocument();
    
    // Click Next button
    fireEvent.click(screen.getByText('Next'));
    
    // Now we should see "Connect Your Wallet" step
    await waitFor(() => {
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    });
    
    // Click Next button again
    fireEvent.click(screen.getByText('Next'));
    
    // Now we should see "Create an Escrow" step
    await waitFor(() => {
      expect(screen.getByText('Create an Escrow')).toBeInTheDocument();
    });
  });
  
  it('can skip the guide', () => {
    renderWithProviders(<WelcomeGuide />);
    
    // Click Skip button
    fireEvent.click(screen.getByText('Skip'));
    
    // Modal should close (mock function calls will be checked)
    expect(screen.queryByText('Welcome to .escrow')).not.toBeInTheDocument();
  });
  
  it('completes the guide with Finish button', async () => {
    renderWithProviders(<WelcomeGuide />);
    
    // Go through all steps
    // 1. Welcome
    fireEvent.click(screen.getByText('Next'));
    
    // 2. Connect Wallet
    await waitFor(() => {
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));
    
    // 3. Create Escrow
    await waitFor(() => {
      expect(screen.getByText('Create an Escrow')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));
    
    // 4. Manage Milestones
    await waitFor(() => {
      expect(screen.getByText('Manage Milestones')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));
    
    // 5. Get Paid Securely (final step)
    await waitFor(() => {
      expect(screen.getByText('Get Paid Securely')).toBeInTheDocument();
    });
    
    // Now there should be a "Finish" button instead of Next
    expect(screen.getByText('Finish')).toBeInTheDocument();
    
    // Click Finish button
    fireEvent.click(screen.getByText('Finish'));
    
    // Modal should close (mock function calls will be checked)
    expect(screen.queryByText('Get Paid Securely')).not.toBeInTheDocument();
  });
  
  it('remembers preference with "Don\'t show again" checkbox', async () => {
    const mockSetHasSeenGuide = vi.fn();
    vi.mock('../../hooks/useLocalStorage', () => ({
      useLocalStorage: () => [false, mockSetHasSeenGuide],
    }));
    
    renderWithProviders(<WelcomeGuide />);
    
    // Check the "Don't show again" checkbox
    const checkbox = screen.getByText("Don't show this guide again");
    fireEvent.click(checkbox);
    
    // Skip the guide
    fireEvent.click(screen.getByText('Skip'));
    
    // Verify that the preference was saved
    expect(mockSetHasSeenGuide).toHaveBeenCalledWith(true);
  });
  
  it('navigates to specific pages from guide buttons', async () => {
    renderWithProviders(<WelcomeGuide />);
    
    // Go to "Connect Your Wallet" step
    fireEvent.click(screen.getByText('Next'));
    
    // Wait for the step to appear
    await waitFor(() => {
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    });
    
    // Click "Connect Wallet Now" button
    const connectButton = screen.getByText('Connect Wallet Now');
    fireEvent.click(connectButton);
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/connect-wallet');
  });
}); 