<template>
  <div class="dashboard-layout" :class="currentTheme">
    <!-- Sidebar (Blue Theme: Full, Black Theme: Icons Only) -->
    <aside class="sidebar" :class="{ 'collapsed': currentTheme === 'theme-black' }">
      <div class="logo-area">
        <div class="logo-icon">⚡</div>
        <span class="logo-text" v-if="currentTheme !== 'theme-black'">fumi</span>
      </div>
      
      <nav class="nav-menu">
        <div class="nav-group">
          <!-- <div class="nav-label" v-if="currentTheme !== 'theme-black'">MAIN MENU</div> -->
          <router-link to="/person-extract" class="nav-item active" title="人员提取">
            <span class="icon">📊</span>
            <span class="text" v-if="currentTheme !== 'theme-black'">人员提取</span>
          </router-link>
          <a href="#" class="nav-item" title="我的文件">
            <span class="icon">📁</span>
            <span class="text" v-if="currentTheme !== 'theme-black'">我的文件</span>
          </a>
          <a href="#" class="nav-item" title="设置">
            <span class="icon">⚙️</span>
            <span class="text" v-if="currentTheme !== 'theme-black'">设置</span>
          </a>
        </div>
      </nav>

      <div class="theme-switcher">
        <div class="nav-label" v-if="currentTheme !== 'theme-black'">主题风格</div>
        <div class="theme-options">
          <!-- <button 
            class="theme-btn blue" 
            :class="{ active: currentTheme === 'theme-blue' }"
            @click="setTheme('theme-blue')"
            title="霓虹蓝"
          >
            <span class="color-dot blue-dot"></span>
            <span v-if="currentTheme !== 'theme-black'">霓虹蓝</span>
          </button> -->
          <!-- <button 
            class="theme-btn black" 
            :class="{ active: currentTheme === 'theme-black' }"
            @click="setTheme('theme-black')"
            title="极夜黑"
          >
            <span class="color-dot black-dot"></span>
            <span v-if="currentTheme !== 'theme-black'">极夜黑</span>
          </button> -->
          <button 
            class="theme-btn purple" 
            :class="{ active: currentTheme === 'theme-purple' }"
            @click="setTheme('theme-purple')"
            title="星系紫"
          >
            <span class="color-dot purple-dot"></span>
            <span v-if="currentTheme !== 'theme-black'">星系紫</span>
          </button>
          <button 
            class="theme-btn white" 
            :class="{ active: currentTheme === 'theme-white' }"
            @click="setTheme('theme-white')"
            title="磨砂白"
          >
            <span class="color-dot white-dot"></span>
            <span v-if="currentTheme !== 'theme-black'">磨砂白</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Top Header (Blue Theme: Standard, Black Theme: Floating, Purple Theme: Glass) -->
      <header class="top-header" :class="{ 
        'floating-header': currentTheme === 'theme-black',
        'glass-header': currentTheme === 'theme-purple'
      }">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search..." />
        </div>
        
        <div class="header-actions">
          <button class="icon-btn">🔔<span class="badge">2</span></button>
          <div class="user-profile">
            <div class="avatar">👤</div>
            <span class="username" v-if="currentTheme !== 'theme-black'">Admin User</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="content-scroll-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const currentTheme = ref('theme-blue');

function setTheme(theme: string) {
  currentTheme.value = theme;
  document.documentElement.className = theme;
  localStorage.setItem('app-theme', theme);
}

onMounted(() => {
  const saved = localStorage.getItem('app-theme');
  if (saved) {
    setTheme(saved);
  } else {
    setTheme('theme-blue');
  }
});
</script>

<style scoped>
/* Layout Structure */
.dashboard-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  transition: background 0.5s ease;
}

/* Sidebar */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 10;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), background 0.4s ease;
}

.sidebar.collapsed {
  width: 80px;
  padding: 24px 12px;
  align-items: center;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  padding: 0 12px;
  height: 40px;
}

.sidebar.collapsed .logo-area {
  justify-content: center;
  padding: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #00d2ff, #3a7bd5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  box-shadow: 0 0 15px rgba(0, 210, 255, 0.5);
  flex-shrink: 0;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  margin-bottom: 24px;
  width: 100%;
}

.nav-menu::-webkit-scrollbar {
  width: 4px;
}
.nav-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.nav-group {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed .nav-group {
  align-items: center;
}

.nav-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 16px;
  padding-left: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: all 0.3s ease;
  margin-bottom: 4px;
  height: 44px;
  box-sizing: border-box;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  width: 44px;
  padding: 0;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  backdrop-filter: blur(10px);
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(0, 210, 255, 0.15), transparent);
  color: #00d2ff;
  border-left: 3px solid #00d2ff;
}

.sidebar.collapsed .nav-item.active {
  background: rgba(0, 255, 157, 0.15);
  color: #00ff9d;
  border-left: none;
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(0, 255, 157, 0.2);
}

.nav-item .icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
}

.nav-item .text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* Theme Switcher */
.theme-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.sidebar.collapsed .theme-options {
  align-items: center;
}

.theme-btn {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar.collapsed .theme-btn {
  width: 40px;
  height: 40px;
  justify-content: center;
  padding: 0;
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.theme-btn.active {
  border-color: currentColor;
  background: rgba(255, 255, 255, 0.08);
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: block;
}
.blue-dot { background: #00d2ff; box-shadow: 0 0 8px #00d2ff; }
.black-dot { background: #00ff9d; box-shadow: 0 0 8px #00ff9d; }
.purple-dot { background: #d946ef; box-shadow: 0 0 8px #d946ef; }
.white-dot { background: #ecf0f1; box-shadow: 0 0 8px #bdc3c7; border: 1px solid #bdc3c7; }

.theme-btn.blue.active { color: #00d2ff; box-shadow: 0 0 10px rgba(0, 210, 255, 0.2); }
.theme-btn.black.active { color: #00ff9d; box-shadow: 0 0 10px rgba(0, 255, 157, 0.2); }
.theme-btn.purple.active { color: #d946ef; box-shadow: 0 0 10px rgba(217, 70, 239, 0.2); }
.theme-btn.white.active { color: #2c3e50; box-shadow: 0 0 10px rgba(189, 195, 199, 0.5); background: rgba(255, 255, 255, 0.5); }

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: transparent;
}

/* Header */
.top-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.4s ease;
}

/* Floating Header for Black Theme */
.floating-header {
  margin: 24px 32px 0 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  height: 70px;
  padding: 0 24px;
}

/* Glass Header for Purple Theme */
.glass-header {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.search-bar {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 8px 16px;
  width: 300px;
  transition: all 0.3s;
}

.search-bar:focus-within {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.4);
}

.theme-purple .search-bar:focus-within {
  border-color: #d946ef;
  box-shadow: 0 0 15px rgba(217, 70, 239, 0.2);
}

.search-icon {
  opacity: 0.5;
  margin-right: 8px;
}

.search-bar input {
  background: transparent;
  border: none;
  color: white;
  width: 100%;
  outline: none;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  position: relative;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.icon-btn:hover {
  opacity: 1;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff3b30;
  color: white;
  font-size: 10px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 0 5px #ff3b30;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.user-profile:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ff00cc, #333399);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

/* Content Area */
.content-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

/* Theme Specifics */
/* Theme Blue */
.theme-blue {
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --text-tertiary: rgba(255, 255, 255, 0.5);
  --bg-panel: rgba(255, 255, 255, 0.08);
  --border-color: rgba(255, 255, 255, 0.15);
  --input-bg: rgba(0, 0, 0, 0.25);
  --dropdown-bg: rgba(20, 20, 35, 0.95);
  --accent-color: #00d2ff;

  background: radial-gradient(circle at top left, #1a1a2e, #16213e, #0f3460);
  color: var(--text-primary);
}
.theme-blue .sidebar { 
  background: rgba(22, 33, 62, 0.4); 
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
.theme-blue .logo-text { color: white; }

/* Theme Black */
.theme-black {
  --text-primary: #cccccc;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-tertiary: rgba(255, 255, 255, 0.4);
  --bg-panel: rgba(255, 255, 255, 0.03);
  --border-color: rgba(255, 255, 255, 0.1);
  --input-bg: rgba(0, 0, 0, 0.2);
  --dropdown-bg: rgba(10, 10, 10, 0.95);
  --accent-color: #00ff9d;

  background: #050505;
  color: var(--text-primary);
}
.theme-black .sidebar { 
  background: rgba(10, 10, 10, 0.6); 
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
.theme-black .logo-icon { background: #00ff9d; color: black; box-shadow: 0 0 15px rgba(0, 255, 157, 0.4); }
.theme-black .search-bar:focus-within { border-color: #00ff9d; }

/* Theme Purple (Galaxy) */
.theme-purple {
  --text-primary: #4a148c;
  --text-secondary: rgba(74, 20, 140, 0.7);
  --text-tertiary: rgba(74, 20, 140, 0.5);
  --bg-panel: rgba(255, 255, 255, 0.3);
  --border-color: rgba(255, 255, 255, 0.5);
  --input-bg: rgba(255, 255, 255, 0.3);
  --dropdown-bg: rgba(255, 255, 255, 0.9);
  --accent-color: #8e24aa;

  background: radial-gradient(circle at bottom right, #6a1b9a, #8e24aa, #ab47bc); /* Lighter purple gradient */
  color: var(--text-primary);
}
.theme-purple .sidebar {
  background: var(--bg-panel); /* Much more opaque white */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-color);
  /* Floating Sidebar Layout */
  margin: 24px 0 24px 24px;
  /* height: calc(100vh - 48px); */
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.theme-purple .logo-icon { 
  background: linear-gradient(135deg, #8e24aa, #ab47bc); 
  color: white;
  box-shadow: 0 0 15px rgba(142, 36, 170, 0.4);
}
.theme-purple .logo-text {
  color: var(--text-primary);
}
.theme-purple .nav-item {
  color: var(--text-primary);
  font-weight: 500;
}
.theme-purple .nav-item:hover {
  background: rgba(255, 255, 255, 0.5);
}
.theme-purple .nav-item.active {
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  border-left-color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.theme-purple .top-header {
  border-bottom: none;
  padding: 0 40px;
}
.theme-purple .user-profile {
  background: var(--bg-panel);
  border-color: rgba(255, 255, 255, 0.6);
}
.theme-purple .user-profile .username {
  color: var(--text-primary);
  font-weight: 600;
}
.theme-purple .content-scroll-area {
  background: var(--bg-panel); /* High opacity for white frosted look */
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 24px;
  margin: 0 24px 24px 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 32px;
}
.theme-purple .search-bar {
  background: var(--input-bg);
  border-color: var(--border-color);
}
.theme-purple .search-bar input {
  color: var(--text-primary);
}
.theme-purple .search-bar input::placeholder {
  color: var(--text-secondary);
}
.theme-purple .search-bar .search-icon {
  color: var(--text-primary);
  opacity: 0.8;
}
.theme-purple .search-bar:focus-within {
  background: rgba(255, 255, 255, 0.9);
  border-color: var(--accent-color);
  box-shadow: 0 0 15px rgba(142, 36, 170, 0.2);
}
.theme-purple .icon-btn {
  color: var(--text-primary);
}

/* Theme White (Frosted) */
.theme-white {
  --text-primary: #2c3e50;
  --text-secondary: #576574;
  --text-tertiary: #7f8c8d;
  --bg-panel: rgba(255, 255, 255, 0.65);
  --border-color: rgba(255, 255, 255, 0.8);
  --input-bg: rgba(255, 255, 255, 0.5);
  --dropdown-bg: #ffffff;
  --accent-color: #2c3e50;

  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  color: var(--text-primary);
}
.theme-white .sidebar {
  background: var(--bg-panel);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-right: 1px solid var(--border-color);
  /* Floating Sidebar Layout */
  margin: 24px 0 24px 24px;
  /* height: calc(100vh - 48px); */
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}
.theme-white .logo-icon { 
  background: linear-gradient(135deg, #bdc3c7, #2c3e50); 
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.theme-white .logo-text {
  color: var(--text-primary);
}
.theme-white .nav-label {
  color: var(--text-tertiary);
}
.theme-white .nav-item {
  color: var(--text-secondary);
  font-weight: 500;
}
.theme-white .nav-item:hover {
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
}
.theme-white .nav-item.active {
  background: white;
  color: var(--text-primary);
  border-left-color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.theme-white .top-header {
  border-bottom: none;
  padding: 0 40px;
}
.theme-white .user-profile {
  background: rgba(255, 255, 255, 0.6);
  border-color: var(--border-color);
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}
.theme-white .user-profile .username {
  color: var(--text-primary);
  font-weight: 600;
}
.theme-white .content-scroll-area {
  background: var(--bg-panel);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 24px;
  margin: 0 24px 24px 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  padding: 32px;
}
.theme-white .search-bar {
  background: var(--input-bg);
  border-color: var(--border-color);
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}
.theme-white .search-bar input {
  color: var(--text-primary);
}
.theme-white .search-bar input::placeholder {
  color: #95a5a6;
}
.theme-white .search-bar .search-icon {
  color: var(--text-tertiary);
}
.theme-white .search-bar:focus-within {
  background: white;
  border-color: #bdc3c7;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}
.theme-white .icon-btn {
  color: var(--text-primary);
}
.theme-white .theme-btn {
  color: var(--text-secondary);
  border-color: rgba(0,0,0,0.1);
}
.theme-white .theme-btn:hover {
  background: rgba(255,255,255,0.8);
  color: var(--text-primary);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>