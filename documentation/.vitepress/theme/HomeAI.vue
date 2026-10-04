<script setup lang="ts">
import { withBase } from 'vitepress';

const recipes = [
  {
    tag: 'MEMORY',
    title: 'Encrypted agent memory',
    description: 'Bind records to a tenant and user, handle revision conflicts, and rotate encryption keys.',
    link: '/ai/encrypted-memory.html',
  },
  {
    tag: 'CONVERSATIONS',
    title: 'AI SDK persistence',
    description: 'Validate full message history and save completed generations, including tool results and metadata.',
    link: '/ai/conversation-persistence.html',
  },
  {
    tag: 'ASSISTANT',
    title: 'Explore approved code templates',
    description: 'Run the local docs assistant with offline fixtures. Choose a runtime and operation to get a matching example.',
    link: '/ai/docs-assistant.html',
  },
  {
    tag: 'MESSAGES',
    title: 'Verify agent messages',
    description: 'Check signed payloads, expected identities, expiry, and replay before using an agent result.',
    link: '/signed-messages.html',
  },
];
</script>

<template>
  <section class="home-ai" aria-labelledby="ai-for-your-application">
    <div class="home-ai-heading">
      <span class="home-ai-label">AI INTEGRATIONS</span>
      <h2 id="ai-for-your-application">Build encrypted AI memory and chat history.</h2>
      <p>Use the same JSON and signature APIs around your AI application. Start with a focused recipe, then adapt it to your storage and authentication.</p>
    </div>
    <div class="home-ai-recipes">
      <a v-for="recipe in recipes" :key="recipe.link" :href="withBase(recipe.link)" class="home-ai-recipe">
        <span class="home-ai-tag">{{ recipe.tag }}</span>
        <h3>{{ recipe.title }}</h3>
        <p>{{ recipe.description }}</p>
        <span class="home-ai-link">Open guide <span aria-hidden="true">→</span></span>
      </a>
    </div>
    <p class="home-ai-note"><strong>Separate examples, lightweight core.</strong> AI SDK lives in the example app. Encryption protects stored data; your application and any model provider receiving it can see the plaintext.</p>
  </section>
</template>

<style scoped>
.home-ai {
  margin-bottom: 56px;
  padding: 32px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 24px;
  background: linear-gradient(145deg, var(--vp-c-brand-soft), var(--vp-c-bg) 60%);
}
.home-ai-label, .home-ai-tag {
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.home-ai h2 {
  margin: 12px 0;
  padding: 0;
  border: 0;
  font-size: 28px;
  line-height: 1.25;
}
.home-ai-heading > p { max-width: 680px; color: var(--vp-c-text-2); }
.home-ai-recipes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 24px 0; }
.home-ai a.home-ai-recipe {
  display: flex;
  flex-direction: column;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.2s;
}
.home-ai a.home-ai-recipe:hover { border-color: var(--vp-c-brand-1); }
.home-ai a.home-ai-recipe:focus-visible { outline: 3px solid var(--vp-c-brand-1); outline-offset: 3px; }
.home-ai h3 { margin: 10px 0 8px; font-size: 19px; line-height: 1.4; }
.home-ai-recipe p { margin: 0 0 16px; color: var(--vp-c-text-2); font-size: 14px; line-height: 1.65; }
.home-ai-link { margin-top: auto; color: var(--vp-c-brand-1); font-size: 14px; font-weight: 600; }
.home-ai .home-ai-note { margin: 0; padding-top: 16px; border-top: 1px solid var(--vp-c-divider); color: var(--vp-c-text-2); font-size: 13px; line-height: 1.7; }
@media (max-width: 639px) {
  .home-ai { padding: 24px 20px; }
  .home-ai h2 { font-size: 24px; }
  .home-ai-recipes { grid-template-columns: 1fr; }
  .home-ai a.home-ai-recipe { padding: 20px; }
}
</style>
