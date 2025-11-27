/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Test patterns
  testMatch: [
    '**/tests/**/*.(test|spec).(ts|js)',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    'scripts/**/*.js',
    '.mcp/tools/**/*.js',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  
  // Coverage thresholds - enforce quality standards
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@mcp/(.*)$': '<rootDir>/.mcp/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: {
        allowJs: true,
      },
    },
  },
  
  // Timeouts
  testTimeout: 30000,
  
  // Verbose output for CI
  verbose: true,
};