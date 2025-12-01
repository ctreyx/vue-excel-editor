<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div>
    <nav style="padding:10px; background:#f6f6f6; border-bottom:1px solid #ddd;">
      <!-- <RouterLink to="/" style="margin-right:12px;">Excel 编辑</RouterLink> -->
      <RouterLink to="/person-extract">人员提取</RouterLink>
    </nav>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
main {
  padding: 16px;
}
</style>
