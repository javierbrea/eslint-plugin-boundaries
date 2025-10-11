import boundaries from 'eslint-plugin-boundaries';

export default [
  {
    files: ['**/*.js', '**/*.ts'],
    plugins: {
      boundaries
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'api',
          pattern: 'src/api/*'
        },
        {
          type: 'service',
          pattern: 'src/services/*'
        },
        {
          type: 'utils',
          pattern: 'src/utils/*'
        }
      ]
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          {
            from: 'api',
            allow: ['service', 'utils']
          },
          {
            from: 'service',
            allow: ['utils']
          }
        ]
      }],
      'boundaries/no-private': ['error']
    }
  }
];