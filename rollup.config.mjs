/* eslint-disable import/no-extraneous-dependencies */

import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig([
  {
    input: 'src/index.ts',
    external: ['leaflet'],
    output: {
      file: 'dist/leaflet.timeline.js',
      format: 'iife',
      globals: {
        leaflet: 'L',
      },
    },
    plugins: [
      commonjs({}),
      typescript(),
      nodeResolve({}),
      postcss({
        inject: true,
      }),
      terser(),
      visualizer(),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'esm',
    },
    plugins: [
      typescript(),
      postcss({
        inject: true,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
    },
    plugins: [
      typescript(),
      postcss({
        inject: true,
      }),
    ],
  },
]);
