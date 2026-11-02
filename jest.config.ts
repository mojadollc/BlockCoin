import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@blockcoin/shared$': '<rootDir>/packages/shared/index.ts',
    '^@blockcoin/validation$': '<rootDir>/packages/validation/index.ts',
    '^@blockcoin/database$': '<rootDir>/node_modules/@prisma/client',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/apps/api/tsconfig.json',
      diagnostics: false,
    }],
  },
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.ts',
  setupFilesAfterEach: ['<rootDir>/tests/setup/jest.setup.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
}

export default config
