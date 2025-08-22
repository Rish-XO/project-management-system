import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import App from './App';

// Mock Apollo Client queries that the app uses
const mocks: MockedResponse[] = [];

test('renders project management system title', () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <App />
    </MockedProvider>
  );
  
  const titleElement = screen.getByText(/project management system/i);
  expect(titleElement).toBeInTheDocument();
});

