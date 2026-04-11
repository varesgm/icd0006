<script setup lang="ts"></script>

<template>
  <div class="page-header">
    <h1 class="page-title">About</h1>
    <p class="page-subtitle">TodoVue — Vue 3 task manager</p>
  </div>
  <div class="card">
    <div class="card-body" style="line-height: 1.8;">
      <p>Built with <strong style="color: var(--primary);">Vue 3</strong>, Pinia, Vue Router, and Bootstrap 5.</p>
      <p>Authenticates against <a href="https://taltech.akaver.com" target="_blank" class="auth-link">taltech.akaver.com</a> using JWT with automatic token refresh.</p>
      <ul style="color: #ccc;">
        <li>Manage tasks with due dates, categories, and priorities</li>
        <li>Archive completed work to keep your list clean</li>
        <li>Tokens are stored locally and refreshed automatically</li>
      </ul>
    </div>
  </div>
</template>
