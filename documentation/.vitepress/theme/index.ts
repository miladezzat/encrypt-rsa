import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import HomeAI from './HomeAI.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeAI', HomeAI);
  },
} satisfies Theme;
