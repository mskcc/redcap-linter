module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transform: {
    '^.+\\.(css|scss|less)$': 'jest-css-modules',
    '^.+\\.(js|jsx)?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/{src|test}/$1',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: ['<rootDir>/**/*.test.(js|jsx|ts|tsx)'],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
};
