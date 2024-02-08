import { type Config } from 'jest';

const config: Config = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  testMatch: ['**/test/*_test.ts'],
  testEnvironment: 'jsdom',
};

export default config;
