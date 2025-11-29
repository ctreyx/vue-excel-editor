<template>
  <div class="excel-editor-container">
    <!-- 侧边栏文件列表 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="traffic-lights">
          <div class="traffic-light red"></div>
          <div class="traffic-light yellow"></div>
          <div class="traffic-light green"></div>
        </div>
        <!-- <h1 class="app-title">云端表格</h1> -->
      </div>
      
      <div class="file-list">
        <div class="list-header">
          <span>工作簿列表</span>
          <button class="icon-btn add-btn" @click="createNewFile" title="新建表格">
            <span>+</span>
          </button>
        </div>
        
        <div 
          v-for="file in fileList" 
          :key="file.id"
          class="file-item"
          :class="{ active: activeFileId === file.id }"
          @click="switchFile(file.id)"
        >
          <span class="file-icon">📑</span>
          <div class="file-info">
            <input 
              v-if="editingFileId === file.id"
              v-model="file.name"
              @blur="finishRename(file)"
              @keyup.enter="finishRename(file)"
              @click.stop
              class="rename-input"
              autoFocus
            />
            <span v-else class="file-name" @dblclick="startRename(file)">{{ file.name }}</span>
          </div>
          <div class="file-actions">
            <button class="icon-btn delete-btn" @click.stop="deleteFile(file.id)" title="删除">
              ×
            </button>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="status-indicator" :class="{ connected: isConnected }">
          <span class="status-dot"></span>
          <span class="status-text">{{ isConnected ? '服务已连接' : '服务断开' }}</span>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <header class="header">
        <div class="header-left">
          <h2 class="current-file-title">{{ activeFile?.name || '未选择文件' }}</h2>
        </div>
        
        <div class="actions">
          <label class="action-btn import-btn">
            <input type="file" @change="handleImport" accept=".xlsx" hidden />
            <span class="icon">📂</span> 
            <span>导入 Excel</span>
          </label>
          <button class="action-btn save-btn" @click="saveCurrentData">
            <span class="icon">💾</span>
            <span>保存</span>
          </button>
        </div>
      </header>
      
      <div id="luckysheet" class="spreadsheet-area"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue';
import LuckyExcel from 'luckyexcel';
import { io } from 'socket.io-client';

// 类型定义
interface FileModule {
  id: string;
  name: string;
  sheets: any[];
}

// 状态管理
const status = ref('正在连接...');
const isConnected = ref(false);
const socket = io('http://localhost:3000');
let isRemoteUpdate = false;

const fileList = ref<FileModule[]>([
  { id: '1', name: '默认工作簿', sheets: [] }
]);
const activeFileId = ref<string>('1');
const editingFileId = ref<string | null>(null);

const activeFile = computed(() => fileList.value.find(f => f.id === activeFileId.value));

// 初始化
onMounted(() => {
  initLuckysheet(activeFile.value?.sheets || []);
  
  socket.on('connect', () => {
    status.value = '已连接';
    isConnected.value = true;
  });

  socket.on('disconnect', () => {
    status.value = '已断开';
    isConnected.value = false;
  });

  socket.on('update-cell', (data: any) => {
    // 只有当接收到的更新属于当前打开的文件时才应用
    if (data.fileId !== activeFileId.value) return;

    isRemoteUpdate = true;
    (window as any).luckysheet.setCellValue(data.r, data.c, data.v);
    isRemoteUpdate = false;
    console.log('收到更新:', data);
  });
});

// Luckysheet 配置
const getLuckysheetOptions = (data: any[] = [], title: string = 'Vue Excel Editor') => {
  return {
    container: 'luckysheet',
    title: title,
    lang: 'zh',
    data: data,
    showinfobar: false,
    showtoolbar: true,
    showsheetbar: true,
    showstatisticBar: true,
    hook: {
      cellUpdated: function (r: number, c: number, _oldValue: any, newValue: any, _isRefresh: boolean) {
        if (isRemoteUpdate) return;
        // 发送更新时带上 fileId
        socket.emit('cell-update', { 
          r, c, v: newValue,
          fileId: activeFileId.value 
        }); 
      }
    }
  };
};

const initLuckysheet = (data: any[] = []) => {
  const options = getLuckysheetOptions(data, activeFile.value?.name);
  (window as any).luckysheet.create(options);
};

// 文件操作逻辑
const createNewFile = () => {
  const newId = Date.now().toString();
  const newFile: FileModule = {
    id: newId,
    name: `新建表格 ${fileList.value.length + 1}`,
    sheets: []
  };
  fileList.value.push(newFile);
  switchFile(newId);
};

const deleteFile = (id: string) => {
  if (fileList.value.length <= 1) {
    alert('至少保留一个工作簿');
    return;
  }
  const index = fileList.value.findIndex(f => f.id === id);
  fileList.value = fileList.value.filter(f => f.id !== id);
  
  if (activeFileId.value === id) {
    // 如果删除的是当前文件，切换到前一个或第一个
    const nextFile = fileList.value[index - 1] || fileList.value[0];
    if (nextFile) {
      switchFile(nextFile.id);
    }
  }
};

const switchFile = (id: string) => {
  if (activeFileId.value === id) return;
  
  // 1. 保存当前文件数据
  saveCurrentData();
  
  // 2. 切换 ID
  activeFileId.value = id;
  
  // 3. 重新加载 Luckysheet
  // 需要先销毁，但 Luckysheet 的 destroy 有时会有残留，最好清空 DOM 或使用官方 destroy
  (window as any).luckysheet.destroy();
  
  nextTick(() => {
    const file = fileList.value.find(f => f.id === id);
    if (file) {
      initLuckysheet(file.sheets);
    }
  });
};

const saveCurrentData = () => {
  const sheets = (window as any).luckysheet.getAllSheets();
  const currentFile = fileList.value.find(f => f.id === activeFileId.value);
  if (currentFile) {
    currentFile.sheets = sheets;
  }
};

// 重命名逻辑
const startRename = (file: FileModule) => {
  editingFileId.value = file.id;
};

const finishRename = (file: FileModule) => {
  if (!file.name.trim()) {
    file.name = '未命名表格';
  }
  editingFileId.value = null;
};

// 导入逻辑
const handleImport = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  if (!file) return;

  LuckyExcel.transformExcelToLucky(file, (exportJson: any, _luckysheetfile: any) => {
    if (exportJson.sheets == null || exportJson.sheets.length == 0) {
      alert("读取 Excel 失败，暂不支持 xls 文件！");
      return;
    }
    
    // 创建新模块而不是覆盖
    const newId = Date.now().toString();
    const newFile: FileModule = {
      id: newId,
      name: exportJson.info.name || file.name.replace('.xlsx', ''),
      sheets: exportJson.sheets
    };
    
    fileList.value.push(newFile);
    switchFile(newId);
    
    // 重置 input 以便重复导入同名文件
    input.value = '';
  });
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.excel-editor-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  background-color: #ffffff;
  color: #1a1a1a;
  overflow: hidden;
}

/* 极简主义侧边栏 */
.sidebar {
  width: 260px;
  background: #fbfbfb;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

/* 优雅的红绿灯设计 */
.traffic-lights {
  display: flex;
  gap: 8px;
}

.traffic-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  opacity: 0.8;
  transition: transform 0.2s ease;
}

.traffic-light:hover {
  transform: scale(1.1);
  opacity: 1;
}

.traffic-light.red { background-color: #ff5f57; border: 1px solid rgba(0,0,0,0.06); }
.traffic-light.yellow { background-color: #febc2e; border: 1px solid rgba(0,0,0,0.06); }
.traffic-light.green { background-color: #28c840; border: 1px solid rgba(0,0,0,0.06); }

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  color: #666;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
}

.add-btn:hover {
  background: rgba(0,0,0,0.04);
  color: #000;
}

/* 卡片式文件列表项 */
.file-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-size: 13px;
  color: #444;
  border: 1px solid transparent;
}

.file-item:hover {
  background: rgba(0,0,0,0.02);
}

/* 选中态：悬浮卡片效果 */
.file-item.active {
  background: #ffffff;
  color: #000;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
  border-color: rgba(0,0,0,0.02);
}

.file-icon {
  margin-right: 10px;
  font-size: 14px;
  opacity: 0.6;
  filter: grayscale(100%);
  transition: all 0.2s;
}

.file-item.active .file-icon {
  opacity: 1;
  filter: none;
  transform: scale(1.1);
}

.file-info {
  flex: 1;
  overflow: hidden;
}

.file-name {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rename-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid #000;
  padding: 0;
  font-size: 13px;
  color: #000;
  outline: none;
  font-family: inherit;
}

.file-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.delete-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
}

.sidebar-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  background: #fff;
}

.header {
  height: 64px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 10;
}

.current-file-title {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  margin: 0;
  letter-spacing: -0.3px;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  height: 36px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  box-sizing: border-box;
  margin: 0;
}

/* 次级按钮：极简灰 */
.import-btn {
  background: #f5f5f5;
  color: #333;
  border: 1px solid transparent;
}

.import-btn:hover {
  background: #eeeeee;
  transform: translateY(-1px);
}

/* 主按钮：深邃黑 */
.save-btn {
  background: #111;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.save-btn:hover {
  background: #000;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.save-btn .icon {
  filter: brightness(0) invert(1);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 20px;
}

.status-indicator.connected {
  color: #000;
  background: #e6f7ff; /* 极淡的蓝色背景 */
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ccc;
}

.status-indicator.connected .status-dot {
  background-color: #1890ff; /* 专业的科技蓝 */
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.spreadsheet-area {
  flex: 1;
  width: 100%;
  position: relative;
  margin: 0;
  padding: 0;
}
</style>
