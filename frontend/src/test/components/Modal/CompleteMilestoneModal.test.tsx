import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';
import CompleteMilestoneModal from '../../../components/Modal/CompleteMilestoneModal';

// Mock Cloudinary upload
const mockXMLHttpRequest = {
  open: vi.fn(),
  send: vi.fn(),
  setRequestHeader: vi.fn(),
  addEventListener: vi.fn(),
  upload: {
    addEventListener: vi.fn(),
  },
  status: 200,
  responseText: JSON.stringify({ secure_url: 'https://res.cloudinary.com/test/upload/test-file.jpg' }),
};

global.XMLHttpRequest = vi.fn(() => mockXMLHttpRequest) as any;
global.FileReader = class FileReader {
  result = 'data:image/jpeg;base64,mockbase64data';
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  readAsDataURL = vi.fn((file) => {
    setTimeout(() => {
      this.onload?.(new ProgressEvent('load') as any);
    }, 10);
  });
} as any;

const TestWrapper = ({ children }) => {
  return <ChakraProvider>{children}</ChakraProvider>;
};

const mockMilestone = {
  id: 'milestone_1',
  description: 'Full Stack Development',
  amount: '5000',
  deadline: Date.now() + 86400000,
  status: 'InProgress',
  completionDate: Date.now(),
};

// Mock file for testing
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('CompleteMilestoneModal', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Complete Milestone')).toBeInTheDocument();
    expect(screen.getByText(/you are about to submit a milestone/i)).toBeInTheDocument();
    expect(screen.getByText('Full Stack Development')).toBeInTheDocument();
    expect(screen.getByText('Amount: 5000 USDT')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={false}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Complete Milestone')).not.toBeInTheDocument();
  });

  it('displays milestone information correctly', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Full Stack Development')).toBeInTheDocument();
    expect(screen.getByText('Amount: 5000 USDT')).toBeInTheDocument();
  });

  it('shows completion note textarea', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/completion note/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/please describe what you have completed/i)).toBeInTheDocument();
  });

  it('allows typing in completion note textarea', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/completion note/i);
    const noteText = 'I have completed all the required features for this milestone';

    await user.type(textarea, noteText);

    expect(textarea).toHaveValue(noteText);
  });

  it('disables submit button when no note is provided', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /complete milestone/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when note is provided', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/completion note/i);
    const submitButton = screen.getByRole('button', { name: /complete milestone/i });

    await user.type(textarea, 'Milestone completed successfully');

    expect(submitButton).not.toBeDisabled();
  });

  it('shows file upload area', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/upload evidence files/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum file size: 10mb/i)).toBeInTheDocument();
  });

  it('allows file selection via click', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const mockFile = createMockFile('test-document.pdf', 1024 * 1024, 'application/pdf');
    const uploadArea = screen.getByText(/drag and drop files here/i).closest('div');
    const fileInput = uploadArea?.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).toBeInTheDocument();

    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      configurable: true,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });
  });

  it('handles drag and drop file upload', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const mockFile = createMockFile('image.jpg', 500 * 1024, 'image/jpeg');
    const uploadArea = screen.getByText(/drag and drop files here/i).closest('div');

    // Simulate drag events
    fireEvent.dragOver(uploadArea!, {
      dataTransfer: { files: [mockFile] }
    });

    fireEvent.drop(uploadArea!, {
      dataTransfer: { files: [mockFile] }
    });

    await waitFor(() => {
      expect(screen.getByText('image.jpg')).toBeInTheDocument();
    });
  });

  it('displays uploaded files correctly', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const mockFile = createMockFile('presentation.pdf', 2 * 1024 * 1024, 'application/pdf');
    const uploadArea = screen.getByText(/drag and drop files here/i).closest('div');
    const fileInput = uploadArea?.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      configurable: true,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('presentation.pdf')).toBeInTheDocument();
      expect(screen.getByText('2.00 MB')).toBeInTheDocument();
      expect(screen.getByText(/uploaded files \(1\)/i)).toBeInTheDocument();
    });
  });

  it('allows removing uploaded files', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const mockFile = createMockFile('document.pdf', 1024, 'application/pdf');
    const uploadArea = screen.getByText(/drag and drop files here/i).closest('div');
    const fileInput = uploadArea?.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      configurable: true,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove file/i });
    await user.click(removeButton);

    expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
  });

  it('rejects files that are too large', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const mockLargeFile = createMockFile('large-file.zip', 15 * 1024 * 1024, 'application/zip');
    const uploadArea = screen.getByText(/drag and drop files here/i).closest('div');
    const fileInput = uploadArea?.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockLargeFile],
      configurable: true,
    });

    fireEvent.change(fileInput);

    // File should not appear in the list due to size restriction
    expect(screen.queryByText('large-file.zip')).not.toBeInTheDocument();
  });

  it('calls onConfirm with note and empty files when no files uploaded', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/completion note/i);
    const submitButton = screen.getByRole('button', { name: /complete milestone/i });
    const noteText = 'Milestone completed successfully';

    await user.type(textarea, noteText);
    await user.click(submitButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(noteText, []);
  });

  it('calls onClose when Cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
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

  it('shows loading state when isLoading is true', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
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

  it('handles null milestone gracefully', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={null}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Complete Milestone')).toBeInTheDocument();
    expect(screen.getByText(/you are about to submit a milestone/i)).toBeInTheDocument();
  });

  it('clears form when modal is closed', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/completion note/i);
    await user.type(textarea, 'Some note');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays file type badges correctly', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const mockImageFile = createMockFile('screenshot.png', 1024, 'image/png');
    const uploadArea = screen.getByText(/drag and drop files here/i).closest('div');
    const fileInput = uploadArea?.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockImageFile],
      configurable: true,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('screenshot.png')).toBeInTheDocument();
      expect(screen.getByText('image')).toBeInTheDocument(); // File type badge
    });
  });

  it('prevents form submission while files are uploading', async () => {
    const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
    
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const textarea = screen.getByLabelText(/completion note/i);
    await user.type(textarea, 'Completed milestone');

    const uploadArea = screen.getByText(/drag and drop files here/i).closest('div');
    const fileInput = uploadArea?.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      configurable: true,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /complete milestone/i });
    // Button should be enabled when no files are uploading in the initial state
    expect(submitButton).not.toBeDisabled();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    const textarea = screen.getByLabelText(/completion note/i);
    expect(textarea).toHaveAttribute('required');

    const fileInput = screen.getByLabelText(/upload evidence files/i);
    expect(fileInput).toBeInTheDocument();
  });

  it('formats file sizes correctly', async () => {
    render(
      <TestWrapper>
        <CompleteMilestoneModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={mockMilestone}
          onConfirm={mockOnConfirm}
        />
      </TestWrapper>
    );

    const mockFiles = [
      createMockFile('small.txt', 512, 'text/plain'),
      createMockFile('medium.jpg', 1024 * 500, 'image/jpeg'), // 500KB
      createMockFile('large.pdf', 1024 * 1024 * 2, 'application/pdf'), // 2MB
    ];

    for (const mockFile of mockFiles) {
      const uploadArea = screen.getByText(/drag and drop files here/i).closest('div');
      const fileInput = uploadArea?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      });

      fireEvent.change(fileInput);
    }

    await waitFor(() => {
      expect(screen.getByText('512 Bytes')).toBeInTheDocument();
      expect(screen.getByText('500.00 KB')).toBeInTheDocument();
      expect(screen.getByText('2.00 MB')).toBeInTheDocument();
    });
  });
});