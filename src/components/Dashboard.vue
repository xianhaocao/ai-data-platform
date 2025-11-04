<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-left">
        <h1>智能数据可视化平台</h1>
      </div>
      <div class="header-right">
        <span class="user-info">欢迎，管理员</span>
      </div>
    </header>
    <div class="dashboard-content">
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <router-link to="/" class="nav-item">仪表盘</router-link>
          <router-link to="/data-management" class="nav-item">数据管理</router-link>
          <router-link to="/component-library" class="nav-item">组件库</router-link>
          <router-link to="/system-settings" class="nav-item">系统设置</router-link>
        </nav>
      </aside>
      <main class="main-content">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #333;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-right .user-info {
  font-size: 1rem;
}

.dashboard-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
}

.sidebar-nav {
  padding: 1rem;
}

.nav-item {
  display: block;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-item:hover {
  background-color: #e0e0e0;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>