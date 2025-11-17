import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';
import ReleaseMilestoneModal from '../../../components/Modal/ReleaseMilestoneModal';

const TestWrapper = ({ children }) => {
  return <ChakraProvider>{children}</ChakraProvider>;
};

const mockMilestone = {
  id: 'milestone_1',
  description: 'Design Phase Completion',
  amount: '2000',
  deadline: Date.now() + 86400000,
  status: 'InProgress',
  completionDate: Date.now() - 3600000, // Completed 1 hour ago
};

describe('ReleaseMilestoneModal', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Release Milestone Payment')).toBeInTheDocument();
    expect(screen.getByText(/you are about to release payment/i)).toBeInTheDocument();
    expect(screen.getByText('Design Phase Completion')).toBeInTheDocument();
    expect(screen.getByText('Amount: 2000 USDT')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={false}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Release Milestone Payment')).not.toBeInTheDocument();
  });

  it('displays milestone information correctly', () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Design Phase Completion')).toBeInTheDocument();
    expect(screen.getByText('Amount: 2000 USDT')).toBeInTheDocument();
  });

  it('shows warning message about irreversible action', () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/by releasing this milestone/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be reversed/i)).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Confirm Release button is clicked', async () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const confirmButton = screen.getByRole('button', { name: /confirm release/i });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button (X) is clicked', async () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      </TestWrapper>
    );

    const confirmButton = screen.getByRole('button', { name: /releasing/i });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveTextContent('Releasing...');
  });

  it('handles null milestone gracefully', () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={null}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Release Milestone Payment')).toBeInTheDocument();
    expect(screen.getByText(/you are about to release payment/i)).toBeInTheDocument();
  });

  it('displays different milestone amounts correctly', () => {
    const expensiveMilestone = {
      ...mockMilestone,
      description: 'Backend Development',
      amount: '50000',
    };

    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={expensiveMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Backend Development')).toBeInTheDocument();
    expect(screen.getByText('Amount: 50000 USDT')).toBeInTheDocument();
  });

  it('maintains button states correctly', async () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
          isLoading={false}
        />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const confirmButton = screen.getByRole('button', { name: /confirm release/i });

    expect(cancelButton).not.toBeDisabled();
    expect(confirmButton).not.toBeDisabled();

    // Should be able to interact with buttons
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays milestone information in proper format', () => {
    const milestoneWithLongDescription = {
      ...mockMilestone,
      description: 'This is a very long milestone description that should be displayed properly in the modal',
      amount: '15000.50',
    };

    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={milestoneWithLongDescription}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/this is a very long milestone description/i)).toBeInTheDocument();
    expect(screen.getByText('Amount: 15000.50 USDT')).toBeInTheDocument();
  });

  it('prevents interaction when loading', async () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      </TestWrapper>
    );

    const confirmButton = screen.getByRole('button', { name: /releasing/i });
    expect(confirmButton).toBeDisabled();

    // Try to click disabled button
    await user.click(confirmButton);
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Cancel button should still work
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirm release/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    expect(confirmButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('closes modal on overlay click', () => {
    render(
      <TestWrapper>
        <ReleaseMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const overlay = document.querySelector('.chakra-modal__overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});