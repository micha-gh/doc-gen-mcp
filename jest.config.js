export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ["**/?(*.)+(test).[jt]s", "**/?(*.)+(test).mjs"],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'json'],
}; 