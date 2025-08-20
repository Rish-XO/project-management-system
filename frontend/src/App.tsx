import React, { useState } from 'react';
import { ApolloProvider, useQuery, gql } from '@apollo/client';
import { apolloClient } from './appollo';


const TEST_QUERY = gql`
  query TestQuery {
    hello
  }
`;

function TestComponent() {
  const { loading, error, data } = useQuery(TEST_QUERY);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        Error: {error.message}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Project Management System
            </h1>
            <div className="flex space-x-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 transform hover:scale-105">
                New Project
              </button>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200">
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <p className="text-green-700 font-semibold">
                ✅ Backend Response: {data.hello}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <p className="text-blue-700 font-semibold">
                ✅ React + TypeScript working
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <p className="text-purple-700 font-semibold">
                ✅ TailwindCSS working
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              <p className="text-orange-700 font-semibold">
                ✅ Apollo Client working
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['overview', 'projects', 'tasks'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Organizations</h4>
                    <p className="text-3xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-blue-700">Ready to create</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Projects</h4>
                    <p className="text-3xl font-bold text-green-600">0</p>
                    <p className="text-sm text-green-700">Waiting for data</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">Tasks</h4>
                    <p className="text-3xl font-bold text-purple-600">0</p>
                    <p className="text-sm text-purple-700">Models pending</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                <p className="text-gray-600 mb-4">Create your first project to get started</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                  Create Project
                </button>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Available</h3>
                <p className="text-gray-600">Tasks will appear here once you create projects</p>
              </div>
            )}
          </div>
        </div>

        {/* Feature Test Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="font-semibold text-gray-900 mb-3">Responsive Design</h4>
            <p className="text-gray-600 text-sm mb-4">Grid adapts from 1 to 3 columns</p>
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="font-semibold text-gray-900 mb-3">Animations</h4>
            <p className="text-gray-600 text-sm mb-4">Hover effects and transitions</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="font-semibold text-gray-900 mb-3">Color Palette</h4>
            <p className="text-gray-600 text-sm mb-4">Comprehensive color system</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="w-8 h-8 bg-red-500 rounded"></div>
              <div className="w-8 h-8 bg-yellow-500 rounded"></div>
              <div className="w-8 h-8 bg-green-500 rounded"></div>
              <div className="w-8 h-8 bg-indigo-500 rounded"></div>
            </div>
          </div>
        </div>
      </main>
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