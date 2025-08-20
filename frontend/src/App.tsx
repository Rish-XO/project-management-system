import React from 'react';
import { ApolloProvider, useQuery, gql } from '@apollo/client';
import { apolloClient } from './appollo';


const TEST_QUERY = gql`
  query TestQuery {
    hello
  }
`;

function TestComponent() {
  const { loading, error, data } = useQuery(TEST_QUERY);

  if (loading) return <p className="text-blue-500">Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Project Management System
        </h1>
        <p className="text-green-600">
          ✅ Backend Response: {data.hello}
        </p>
        <p className="text-blue-600 mt-2">
          ✅ React + TypeScript working
        </p>
        <p className="text-purple-600 mt-2">
          ✅ TailwindCSS working
        </p>
        <p className="text-orange-600 mt-2">
          ✅ Apollo Client working
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <TestComponent />
    </ApolloProvider>
  );
}

export default App;