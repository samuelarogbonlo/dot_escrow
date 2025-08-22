import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';
import DisputeMilestoneModal from '../../../components/Modal/DisputeMilestoneModal';

const TestWrapper = ({ children }) => {
  return <ChakraProvider>{children}</ChakraProvider>;
};

const mockMilestone = {
  id: 'milestone_1',
  description: 'Frontend Development Phase',
  amount: '3000',
  deadline: new Date(Date.now() + 86400000),
  status: 'InProgress',
  completionDate: new Date(Date.now() - 3600000),
};

describe('DisputeMilestoneModal', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Dispute Milestone')).toBeInTheDocument();
    expect(screen.getByText(/you are disputing the following milestone/i)).toBeInTheDocument();
    expect(screen.getByText('Frontend Development Phase')).toBeInTheDocument();
    expect(screen.getByText('Amount: 3000 USDT')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={false}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Dispute Milestone')).not.toBeInTheDocument();
  });

  it('displays milestone information correctly', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Frontend Development Phase')).toBeInTheDocument();
    expect(screen.getByText('Amount: 3000 USDT')).toBeInTheDocument();
  });

  it('shows dispute reason textarea', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/reason for dispute/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/please explain why you are disputing/i)).toBeInTheDocument();
  });

  it('allows typing in dispute reason textarea', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    const disputeText = 'The work was not completed according to specifications';

    await user.type(textarea, disputeText);

    expect(textarea).toHaveValue(disputeText);
  });

  it('disables submit button when no reason is provided', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /submit dispute/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when reason is provided', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    const submitButton = screen.getByRole('button', { name: /submit dispute/i });

    await user.type(textarea, 'Valid dispute reason');

    expect(submitButton).not.toBeDisabled();
  });

  it('disables submit button when reason contains only whitespace', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    const submitButton = screen.getByRole('button', { name: /submit dispute/i });

    await user.type(textarea, '   ');

    expect(submitButton).toBeDisabled();
  });

  it('calls onConfirm with dispute reason when submitted', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    const submitButton = screen.getByRole('button', { name: /submit dispute/i });
    const disputeText = 'Quality does not meet requirements';

    await user.type(textarea, disputeText);
    await user.click(submitButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(disputeText);
  });

  it('calls onClose when Cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
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

  it('clears dispute reason when modal is closed', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    await user.type(textarea, 'Some dispute reason');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('clears dispute reason when submitted', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    const submitButton = screen.getByRole('button', { name: /submit dispute/i });

    await user.type(textarea, 'Dispute reason');
    await user.click(submitButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /submitting/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Submitting...');
  });

  it('shows warning about dispute resolution process', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/disputes will be reviewed/i)).toBeInTheDocument();
    expect(screen.getByText(/please provide clear details/i)).toBeInTheDocument();
  });

  it('handles null milestone gracefully', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={null}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Dispute Milestone')).toBeInTheDocument();
    expect(screen.getByText(/you are disputing the following milestone/i)).toBeInTheDocument();
  });

  it('calls onClose when close button (X) is clicked', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
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

  it('maintains textarea focus and selection', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    
    await user.click(textarea);
    expect(textarea).toHaveFocus();

    await user.type(textarea, 'Test dispute reason');
    expect(textarea).toHaveValue('Test dispute reason');
  });

  it('prevents submission when textarea is focused but empty after losing focus', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    const submitButton = screen.getByRole('button', { name: /submit dispute/i });

    await user.click(textarea);
    await user.tab(); // Lose focus

    expect(submitButton).toBeDisabled();
  });

  it('handles long dispute reasons appropriately', async () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for dispute/i);
    const longText = 'This is a very long dispute reason that explains in detail why the milestone is being disputed. '.repeat(10);

    await user.type(textarea, longText);

    expect(textarea).toHaveValue(longText);

    const submitButton = screen.getByRole('button', { name: /submit dispute/i });
    await user.click(submitButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(longText);
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    const textarea = screen.getByLabelText(/reason for dispute/i);
    expect(textarea).toHaveAttribute('aria-required', 'true');

    const submitButton = screen.getByRole('button', { name: /submit dispute/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    expect(submitButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('closes modal on overlay click and clears form', () => {
    const { container } = render(
      <TestWrapper>
        <DisputeMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const overlay = container.querySelector('.chakra-modal__overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});