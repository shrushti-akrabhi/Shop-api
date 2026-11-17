const transform = { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }] };

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests/unit'],
      testMatch: ['**/*.test.ts'],
      transform,
      setupFiles: ['<rootDir>/tests/setup-env.ts'],
      clearMocks: true,
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests/integration'],
      testMatch: ['**/*.test.ts'],
      transform,
      globalSetup: '<rootDir>/tests/integration/global-setup.ts',
      setupFiles: ['<rootDir>/tests/integration/setup-env.ts'],
      testTimeout: 30000, 
    },
  ],

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts', 
    '!src/db/pool.ts', 
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { statements: 95, branches: 90, functions: 95, lines: 95 },
  },
};
