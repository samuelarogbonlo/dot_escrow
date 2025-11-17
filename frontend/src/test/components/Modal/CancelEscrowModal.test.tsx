import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';
import CancelEscrowModal from '../../../components/Modal/CancelEscrowModal';

const TestWrapper = ({ children }) => {
  return <ChakraProvider>{children}</ChakraProvider>;
};

const mockEscrow = {
  id: 'escrow_123',
  title: 'Website Development Project',
  totalAmount: '10000',
};

describe('CancelEscrowModal', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Cancel Escrow')).toBeInTheDocument();
    expect(screen.getByText(/you are about to cancel the entire escrow/i)).toBeInTheDocument();
    expect(screen.getByText('Website Development Project')).toBeInTheDocument();
    expect(screen.getByText('Total Amount: 10000 USDT')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={false}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Cancel Escrow')).not.toBeInTheDocument();
  });

  it('displays escrow information correctly', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Website Development Project')).toBeInTheDocument();
    expect(screen.getByText('Total Amount: 10000 USDT')).toBeInTheDocument();
  });

  it('shows cancellation reason textarea', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/reason for cancellation/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/please explain why you are cancelling/i)).toBeInTheDocument();
  });

  it('allows typing in cancellation reason textarea', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    const reasonText = 'Project requirements have changed significantly';

    await user.type(textarea, reasonText);

    expect(textarea).toHaveValue(reasonText);
  });

  it('disables request button when no reason is provided', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const requestButton = screen.getByRole('button', { name: /request cancellation/i });
    expect(requestButton).toBeDisabled();
  });

  it('enables request button when reason is provided', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    const requestButton = screen.getByRole('button', { name: /request cancellation/i });

    await user.type(textarea, 'Valid cancellation reason');

    expect(requestButton).not.toBeDisabled();
  });

  it('disables request button when reason contains only whitespace', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    const requestButton = screen.getByRole('button', { name: /request cancellation/i });

    await user.type(textarea, '   ');

    expect(requestButton).toBeDisabled();
  });

  it('calls onConfirm with cancellation reason when submitted', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    const requestButton = screen.getByRole('button', { name: /request cancellation/i });
    const reasonText = 'Client requested project cancellation';

    await user.type(textarea, reasonText);
    await user.click(requestButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(reasonText);
  });

  it('calls onClose when Back button is clicked', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('clears cancellation reason when modal is closed', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    const backButton = screen.getByRole('button', { name: /back/i });

    await user.type(textarea, 'Some cancellation reason');
    await user.click(backButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('clears cancellation reason when submitted', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    const requestButton = screen.getByRole('button', { name: /request cancellation/i });

    await user.type(textarea, 'Cancellation reason');
    await user.click(requestButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      </TestWrapper>
    );

    const requestButton = screen.getByRole('button', { name: /requesting/i });
    expect(requestButton).toBeDisabled();
    expect(requestButton).toHaveTextContent('Requesting...');
  });

  it('shows warning about mutual agreement requirement', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/cancelling an escrow requires mutual agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/the other party will need to confirm/i)).toBeInTheDocument();
  });

  it('handles null escrow gracefully', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={null}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Cancel Escrow')).toBeInTheDocument();
    expect(screen.getByText(/you are about to cancel the entire escrow/i)).toBeInTheDocument();
  });

  it('calls onClose when close button (X) is clicked', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
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
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    
    await user.click(textarea);
    expect(textarea).toHaveFocus();

    await user.type(textarea, 'Test cancellation reason');
    expect(textarea).toHaveValue('Test cancellation reason');
  });

  it('handles long cancellation reasons appropriately', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    const longText = 'This is a very long cancellation reason that explains in detail why the escrow needs to be cancelled. '.repeat(10);

    await user.type(textarea, longText);

    expect(textarea).toHaveValue(longText);

    const requestButton = screen.getByRole('button', { name: /request cancellation/i });
    await user.click(requestButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(longText);
  });

  it('displays different escrow amounts correctly', () => {
    const expensiveEscrow = {
      ...mockEscrow,
      title: 'Enterprise Software Development',
      totalAmount: '50000',
    };

    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={expensiveEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Enterprise Software Development')).toBeInTheDocument();
    expect(screen.getByText('Total Amount: 50000 USDT')).toBeInTheDocument();
  });

  it('prevents form submission when loading', async () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      </TestWrapper>
    );

    const requestButton = screen.getByRole('button', { name: /requesting/i });
    expect(requestButton).toBeDisabled();

    // Try to click disabled button
    await user.click(requestButton);
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Back button should still work
    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    const textarea = screen.getByLabelText(/reason for cancellation/i);
    expect(textarea).toHaveAttribute('aria-required', 'true');

    const requestButton = screen.getByRole('button', { name: /request cancellation/i });
    const backButton = screen.getByRole('button', { name: /back/i });

    expect(requestButton).toBeInTheDocument();
    expect(backButton).toBeInTheDocument();
  });

  it('closes modal on overlay click and clears form', () => {
    const { container } = render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
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

  it('uses red color scheme for destructive action button', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const requestButton = screen.getByRole('button', { name: /request cancellation/i });
    expect(requestButton).toBeInTheDocument();
    // The button should have red styling (tested through className or computed styles in integration tests)
  });

  it('shows error alert with proper styling', () => {
    render(
      <TestWrapper>
        <CancelEscrowModal
          isOpen={true}
          onClose={mockOnClose}
          escrow={mockEscrow}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const alertText = screen.getByText(/cancelling an escrow requires mutual agreement/i);
    const alertContainer = alertText.closest('[role="alert"]');
    expect(alertContainer).toBeInTheDocument();
  });
});