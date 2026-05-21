import nextConfig from 'eslint-config-next/core-web-vitals';
import reactCompiler from 'eslint-plugin-react-compiler';

const config = [
  ...nextConfig,
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
  // Mapbox init effects are intentionally mount-only and already opted out
  // of React Compiler via 'use no memo'. Suppress exhaustive-deps for these files.
  {
    files: [
      'src/components/admin/ShachuHakuMap.tsx',
      'src/components/shachu-haku/ShachuHakuMap.tsx',
    ],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react-compiler/react-compiler': 'off',
    },
  },
  // useScrollRestoration intentionally mutates a DOM node through a caller-provided ref.
  // The compiler rule over-flags this as "mutating a hook argument."
  {
    files: ['src/hooks/useScrollRestoration.ts'],
    rules: {
      'react-compiler/react-compiler': 'off',
    },
  },
];

export default config;
