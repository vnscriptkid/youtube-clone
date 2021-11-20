const path = require("path");

module.exports = {
  roots: [path.join(__dirname, "./server/src")],
  rootDir: path.join(__dirname, "./"),
  testEnvironment: "node",
  testMatch: ["**/__tests__/**"],
  moduleDirectories: [
    "node_modules",
    path.join(__dirname, "./test"),
    path.join(__dirname, "./src"),
  ],
  coverageDirectory: path.join(__dirname, "./coverage/collective"),
  collectCoverageFrom: ["**/src/**/*.js"],
  coveragePathIgnorePatterns: [".*/__tests__/.*"],
  setupFilesAfterEnv: [require.resolve("./test/setup-env")],
  testEnvironment: path.join(__dirname, "./prisma/prisma-test-environment.js"),
};
