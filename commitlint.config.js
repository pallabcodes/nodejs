module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type rules
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        // Features and Improvements
        'feat',     // New feature
        'feat!',    // Breaking feature
        'perf',     // Performance improvements
        'refactor', // Code restructuring
        'improve',  // General improvements

        // Bug Fixes
        'fix',      // Bug fix
        'fix!',     // Breaking bug fix
        'hotfix',   // Urgent bug fix

        // Documentation
        'docs',     // Documentation changes
        'readme',   // README updates
        'api',      // API documentation

        // Code Style and Quality
        'style',    // Code style (formatting, etc)
        'lint',     // Linting changes
        'format',   // Code formatting
        'clean',    // Code cleanup

        // Testing
        'test',     // Adding/modifying tests
        'spec',     // Test specifications
        'e2e',      // End-to-end tests

        // Build and Development
        'build',    // Build system changes
        'chore',    // Maintenance tasks
        'ci',       // CI/CD changes
        'deps',     // Dependency updates
        'config',   // Configuration changes
        'docker',   // Docker changes

        // Database
        'db',       // Database changes
        'migrate',  // Database migrations
        'seed',     // Database seeding

        // Security
        'security', // Security improvements
        'auth',     // Authentication changes

        // Other
        'revert',   // Reverting changes
        'wip',      // Work in progress
        'release'   // Release commits
      ]
    ],
    'type-case': [2, 'always', 'lower-case'],

    // Scope rules
    'scope-empty': [0], // Optional scope
    'scope-enum': [
      2,
      'always',
      [
        // Application Areas
        'auth',     // Authentication
        'api',      // API endpoints
        'db',       // Database
        'cache',    // Caching
        'queue',    // Message queues
        'email',    // Email service
        'upload',   // File uploads

        // Technical Areas
        'core',     // Core functionality
        'config',   // Configuration
        'middleware', // Middleware
        'utils',    // Utilities
        'types',    // TypeScript types
        'validation', // Data validation

        // Infrastructure
        'docker',   // Docker
        'ci',       // CI/CD
        'deploy',   // Deployment
        'infra',    // Infrastructure

        // Development
        'deps',     // Dependencies
        'dev',      // Development tools
        'test',     // Testing
        'docs',     // Documentation
        'lint',     // Linting
        'format'    // Code formatting
      ]
    ],
    'scope-case': [2, 'always', 'lower-case'],

    // Subject rules
    'subject-empty': [2, 'never'],
    'subject-case': [
      2,
      'always',
      ['lower-case', 'sentence-case', 'start-case']
    ],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],
    'subject-min-length': [2, 'always', 10],

    // Body rules
    'body-max-line-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'body-empty': [0],

    // Footer rules
    'footer-leading-blank': [2, 'always'],
    'footer-empty': [0],
    'footer-max-line-length': [2, 'always', 100],

    // Header rules
    'header-max-length': [2, 'always', 72],
    'header-min-length': [2, 'always', 10]
  }
}; 