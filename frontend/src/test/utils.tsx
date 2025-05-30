import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';

// Create a custom renderer that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ChakraProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </ChakraProvider>
  );
};

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
}

// Test data generators for common test scenarios
export const generateMockUser = () => ({
  id: '123',
  name: 'Test User',
  email: 'testuser@example.com',
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
});

export const generateMockEscrow = (id = '1') => ({
  id,
  title: 'Test Escrow',
  description: 'This is a test escrow project',
  amount: '1000',
  status: 'active',
  client: {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    name: 'Client Name',
  },
  worker: {
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    name: 'Worker Name',
  },
  createdAt: new Date().toISOString(),
  milestones: [
    {
      id: '1-1',
      title: 'Milestone 1',
      description: 'First milestone',
      amount: '300',
      status: 'completed',
      deadline: new Date().toISOString(),
    },
    {
      id: '1-2',
      title: 'Milestone 2',
      description: 'Second milestone',
      amount: '700',
      status: 'active',
      deadline: new Date().toISOString(),
    },
  ],
}); 