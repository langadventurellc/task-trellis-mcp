export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  rootDir: ".",
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.test.ts"
  ],
  testPathIgnorePatterns: [
    ".*\\.e2e\\.test\\.ts$"
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/__tests__/**",
    "!src/**/*.d.ts",
  ],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
