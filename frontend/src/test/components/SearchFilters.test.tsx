import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import SearchFilters from '../../components/SearchFilters';

describe('SearchFilters Component', () => {
  const mockOnFilterChange = vi.fn();
  const mockOnSearch = vi.fn();
  
  const defaultFilters = {
    query: '',
    status: [],
    dateRange: [0, 4],
    amountRange: [0, 5],
    category: [],
    tags: [],
    sortBy: 'date',
    sortDirection: 'desc',
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly with default props', () => {
    renderWithProviders(
      <SearchFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    // Check that basic elements exist
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Show Filters')).toBeInTheDocument();
  });
  
  it('handles search input change', () => {
    renderWithProviders(
      <SearchFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    // Enter text in the search input
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Click the search button
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    
    // Verify that onSearch was called
    expect(mockOnSearch).toHaveBeenCalled();
  });
  
  it('toggles filter visibility', () => {
    renderWithProviders(
      <SearchFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    // Initially, filter controls should be hidden
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    
    // Click the show filters button
    const toggleButton = screen.getByText('Show Filters');
    fireEvent.click(toggleButton);
    
    // Now filter controls should be visible
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Click again to hide filters
    const hideButton = screen.getByText('Hide Filters');
    fireEvent.click(hideButton);
    
    // Filters should be hidden again
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
  });
  
  it('applies status filters', async () => {
    const filters = {
      ...defaultFilters,
      status: ['active'],
    };
    
    renderWithProviders(
      <SearchFilters 
        filters={filters} 
        onFilterChange={mockOnFilterChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    // Show filters
    fireEvent.click(screen.getByText('Show Filters'));
    
    // Check the Pending status
    const pendingCheckbox = screen.getByLabelText('Pending');
    fireEvent.click(pendingCheckbox);
    
    // Click Apply Filters
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);
    
    // Check that onFilterChange was called with updated filters
    expect(mockOnFilterChange).toHaveBeenCalled();
    expect(mockOnSearch).toHaveBeenCalled();
  });
  
  it('resets filters', () => {
    const filters = {
      ...defaultFilters,
      status: ['active', 'completed'],
      category: ['web-development'],
    };
    
    renderWithProviders(
      <SearchFilters 
        filters={filters} 
        onFilterChange={mockOnFilterChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    // Verify filter tags are displayed
    expect(screen.getByText('Status: Active')).toBeInTheDocument();
    expect(screen.getByText('Status: Completed')).toBeInTheDocument();
    
    // Click the reset button
    const resetButton = screen.getByText('Clear all');
    fireEvent.click(resetButton);
    
    // Verify onFilterChange was called with reset filters
    expect(mockOnFilterChange).toHaveBeenCalled();
  });
}); 