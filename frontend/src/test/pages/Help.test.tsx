import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import Help from '../../pages/Help';

// Mock components used by the Help page
vi.mock('../../components/OnboardingTour', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="mock-tour">Mock Tour <button onClick={onClose}>Close Tour</button></div> : null
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid={`link-to-${to}`}>{children}</a>
  ),
}));

describe('Help Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly', () => {
    renderWithProviders(<Help />);
    
    // Check that the main elements are present
    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for help, guides, and documentation...')).toBeInTheDocument();
    expect(screen.getByText('Platform Tour')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });
  
  it('should have three tabs', () => {
    renderWithProviders(<Help />);
    
    // Check that all tabs are present
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('User Guides')).toBeInTheDocument();
  });
  
  it('can switch between tabs', async () => {
    renderWithProviders(<Help />);
    
    // Default tab should be "Getting Started"
    expect(screen.getByText('Getting Started with .escrow')).toBeInTheDocument();
    
    // Click on the FAQ tab
    fireEvent.click(screen.getByText('FAQ'));
    
    // FAQ content should be visible
    await waitFor(() => {
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    });
    
    // Click on the User Guides tab
    fireEvent.click(screen.getByText('User Guides'));
    
    // User Guides content should be visible
    await waitFor(() => {
      expect(screen.getByText('User Guides')).toBeInTheDocument();
      expect(screen.getByText('Getting Started Guides')).toBeInTheDocument();
    });
  });
  
  it('handles search input', async () => {
    renderWithProviders(<Help />);
    
    // Find the search input
    const searchInput = screen.getByPlaceholderText('Search for help, guides, and documentation...');
    
    // Type in the search query
    fireEvent.change(searchInput, { target: { value: 'escrow' } });
    
    // Submit the search form
    const form = searchInput.closest('form');
    fireEvent.submit(form!);
    
    // Should display search results
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });
  });
  
  it('starts guided tour', async () => {
    renderWithProviders(<Help />);
    
    // Click the Platform Tour button
    fireEvent.click(screen.getByText('Platform Tour'));
    
    // Tour should be visible
    await waitFor(() => {
      expect(screen.getByTestId('mock-tour')).toBeInTheDocument();
    });
    
    // Close the tour
    fireEvent.click(screen.getByText('Close Tour'));
    
    // Tour should be closed
    expect(screen.queryByTestId('mock-tour')).not.toBeInTheDocument();
  });
  
  it('navigates to documentation from button', () => {
    renderWithProviders(<Help />);
    
    // Click the Documentation button
    fireEvent.click(screen.getByText('Documentation'));
    
    // Should switch to the User Guides tab
    expect(screen.getByText('User Guides')).toBeInTheDocument();
    expect(screen.getByText('Getting Started Guides')).toBeInTheDocument();
  });
  
  it('navigates to specific guide pages', () => {
    renderWithProviders(<Help />);
    
    // Go to Getting Started tab
    fireEvent.click(screen.getByText('Getting Started'));
    
    // Click on "Create Escrow" button
    fireEvent.click(screen.getByText('Create Escrow'));
    
    // Should navigate to the create escrow page
    expect(mockNavigate).toHaveBeenCalledWith('/create-escrow');
  });
  
  it('displays FAQ content with expandable questions', async () => {
    renderWithProviders(<Help />);
    
    // Go to FAQ tab
    fireEvent.click(screen.getByText('FAQ'));
    
    // Find a FAQ question
    const faqQuestion = screen.getByText('What is .escrow and how does it work?');
    
    // Initially, the answer should not be visible
    expect(screen.queryByText(/decentralized escrow platform built on Polkadot/)).not.toBeInTheDocument();
    
    // Click the question to expand
    fireEvent.click(faqQuestion);
    
    // Now the answer should be visible
    await waitFor(() => {
      expect(screen.getByText(/decentralized escrow platform built on Polkadot/)).toBeInTheDocument();
    });
  });
}); 