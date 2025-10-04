import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import Search from '../../pages/Search';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

// SKIPPED: Search page is completely commented out in implementation
describe.skip('Search Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly with loading state', () => {
    renderWithProviders(<Search />);
    
    // Initially should show loading state
    expect(screen.getByText('Loading search results...')).toBeInTheDocument();
  });
  
  it('displays search results after loading', async () => {
    renderWithProviders(<Search />);
    
    // Wait for loading to complete and results to display
    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).not.toBeInTheDocument();
    });
    
    // Should display search heading
    expect(screen.getByText('Search')).toBeInTheDocument();
    
    // Should have search input
    expect(screen.getByPlaceholderText('Search escrows, milestones, transactions...')).toBeInTheDocument();
    
    // Should have tabs for different result types
    expect(screen.getByText(/All Results/)).toBeInTheDocument();
    expect(screen.getByText(/Escrows/)).toBeInTheDocument();
    expect(screen.getByText(/Milestones/)).toBeInTheDocument();
    expect(screen.getByText(/Transactions/)).toBeInTheDocument();
    
    // Should display at least one result (from mock data)
    expect(screen.getAllByRole('button', { name: /Search/i })).not.toHaveLength(0);
  });
  
  it('handles search input and submission', async () => {
    renderWithProviders(<Search />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).not.toBeInTheDocument();
    });
    
    // Find search input
    const searchInput = screen.getByPlaceholderText('Search escrows, milestones, transactions...');
    
    // Type a search query
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Submit the search form
    const searchButton = screen.getByRole('button', { name: 'Search' });
    fireEvent.click(searchButton);
    
    // Search results should update (this would trigger a state update in the real component)
    expect(searchInput).toHaveValue('test query');
  });
  
  it('toggles filters panel', async () => {
    renderWithProviders(<Search />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).not.toBeInTheDocument();
    });
    
    // Filters button should be visible
    const filtersButton = screen.getByRole('button', { name: /Filters/i });
    expect(filtersButton).toBeInTheDocument();
    
    // Click to open filters
    fireEvent.click(filtersButton);
    
    // Filters section should now be visible
    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
    
    // Click again to close
    fireEvent.click(filtersButton);
    
    // Filters should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Status')).not.toBeInTheDocument();
    });
  });
  
  it('applies status filter', async () => {
    renderWithProviders(<Search />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).not.toBeInTheDocument();
    });
    
    // Open filters panel
    const filtersButton = screen.getByRole('button', { name: /Filters/i });
    fireEvent.click(filtersButton);
    
    // Wait for filters to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Active')).toBeInTheDocument();
    });
    
    // Check Active status
    const activeCheckbox = screen.getByLabelText('Active');
    fireEvent.click(activeCheckbox);
    
    // Apply filters
    const applyButton = screen.getByRole('button', { name: 'Apply Filters' });
    fireEvent.click(applyButton);
    
    // Status filter tag should appear
    await waitFor(() => {
      expect(screen.getByText('Status: active')).toBeInTheDocument();
    });
  });
  
  it('switches between result tabs', async () => {
    renderWithProviders(<Search />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).not.toBeInTheDocument();
    });
    
    // Default tab should be "All Results"
    expect(screen.getByRole('tab', { name: /All Results/i })).toHaveAttribute('aria-selected', 'true');
    
    // Click on Escrows tab
    const escrowsTab = screen.getByRole('tab', { name: /Escrows/i });
    fireEvent.click(escrowsTab);
    
    // Escrows tab should now be active
    await waitFor(() => {
      expect(escrowsTab).toHaveAttribute('aria-selected', 'true');
    });
    
    // Click on Milestones tab
    const milestonesTab = screen.getByRole('tab', { name: /Milestones/i });
    fireEvent.click(milestonesTab);
    
    // Milestones tab should now be active
    await waitFor(() => {
      expect(milestonesTab).toHaveAttribute('aria-selected', 'true');
    });
  });
  
  it('navigates to result item on click', async () => {
    renderWithProviders(<Search />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).not.toBeInTheDocument();
    });
    
    // Find a result card (the first one)
    const resultCards = screen.getAllByRole('group');
    expect(resultCards.length).toBeGreaterThan(0);
    
    // Click on the result
    fireEvent.click(resultCards[0]);
    
    // Should navigate to the item page
    expect(mockNavigate).toHaveBeenCalled();
  });
  
  it('resets filters', async () => {
    renderWithProviders(<Search />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).not.toBeInTheDocument();
    });
    
    // Open filters panel
    const filtersButton = screen.getByRole('button', { name: /Filters/i });
    fireEvent.click(filtersButton);
    
    // Wait for filters to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Active')).toBeInTheDocument();
    });
    
    // Apply multiple filters
    fireEvent.click(screen.getByLabelText('Active'));
    fireEvent.click(screen.getByLabelText('Completed'));
    
    // Apply filters
    const applyButton = screen.getByRole('button', { name: 'Apply Filters' });
    fireEvent.click(applyButton);
    
    // Filter tags should appear
    await waitFor(() => {
      expect(screen.getByText('Status: active')).toBeInTheDocument();
      expect(screen.getByText('Status: completed')).toBeInTheDocument();
    });
    
    // Click Reset button
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);
    
    // Filter tags should disappear
    await waitFor(() => {
      expect(screen.queryByText('Status: active')).not.toBeInTheDocument();
      expect(screen.queryByText('Status: completed')).not.toBeInTheDocument();
    });
  });
}); 