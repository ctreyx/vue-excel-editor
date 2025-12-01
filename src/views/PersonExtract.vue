<template>
  <div class="person-extract-page">
    <h1>人员提取</h1>

    <div class="upload-row">
      <div class="uploader">
        <h3>1) 上传待提取的 Excel（源表）</h3>
        <input type="file" accept=".xls,.xlsx" @change="onSourceFile" />
        <div v-if="sourceData">
          <div style="margin-bottom: 8px;">总行数：<strong>{{ sourceData.length }}</strong></div>
          <div class="detected-columns">
            <div>检测到的列：{{ sourceColumns.join(', ') }}</div>
          </div>
        </div>
        <div v-if="sourceData && sourceData.length" class="source-preview">
          <h4>源表预览（前 {{ previewRows.length }} 行）</h4>
          <div class="table-scroll">
            <table class="preview-table">
              <thead>
                <tr>
                  <th v-for="col in sourceColumns" :key="col">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in previewRows" :key="idx">
                  <td v-for="col in sourceColumns" :key="col">{{ row[col] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="uploader">
        <h3>2) 上传模版 Excel（模板表）</h3>
        <input type="file" accept=".xls,.xlsx" @change="onTemplateFile" />
        <div v-if="templateHeaders">
          模版字段：{{ templateHeaders.join(', ') }}
        </div>
      </div>
    </div>

    <div class="mapping" v-if="templateHeaders && templateHeaders.length" style="margin-top: 10px;">
      <h4>3) 字段映射确认（支持多选，优先使用靠前的非空值）</h4>
      <table class="mapping-table">
        <thead>
          <tr>
            <th style="width: 30%">模版字段</th>
            <th>映射到源表列 (可多选)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="header in templateHeaders" :key="header">
            <td>{{ header }}</td>
            <td>
              <div class="multi-select-container">
                <div class="selected-tags" @click="toggleDropdown(header)">
                  <span v-if="!mapping[header] || mapping[header].length === 0" class="placeholder">点击选择源列...</span>
                  <span v-for="col in mapping[header]" :key="col" class="tag">
                    {{ col }} <span class="remove-tag" @click.stop="toggleMapping(header, col)">×</span>
                  </span>
                  <span class="arrow">▼</span>
                </div>
                
                <div v-if="openDropdown === header" class="dropdown-menu">
                  <div class="dropdown-item" v-for="col in sourceColumns" :key="col" @click="toggleMapping(header, col)">
                    <input type="checkbox" :checked="mapping[header]?.includes(col)" />
                    <span>{{ col }}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="actions">
      <button @click="autoMap" :disabled="!sourceData || !templateHeaders">重置自动映射</button>
      <button @click="generateJson" :disabled="!sourceData || !templateHeaders">生成数据并预览</button>
      <button @click="downloadExcel" :disabled="!outputData.length">下载结果 Excel</button>
      <button @click="downloadJson" :disabled="!outputData.length">下载 JSON</button>
    </div>

    <div class="output" v-if="outputData.length">
      <h4>输出 JSON（预览，已按公司排序）</h4>
      <textarea rows="12" style="width:98%;">{{ prettyJson }}</textarea>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const sourceData = ref<any[] | null>(null);
const templateHeaders = ref<string[] | null>(null);
const mapping = ref<Record<string,string[]>>({});
const outputData = ref<any[]>([]);
const openDropdown = ref<string | null>(null);

const prettyJson = computed(() => JSON.stringify(outputData.value, null, 2));

const sourceColumns = computed(() => {
  if (!sourceData.value || sourceData.value.length === 0) return [];
  const keys = new Set<string>();
  sourceData.value.forEach(row => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach(k => keys.add(k));
    }
  });
  return Array.from(keys);
});

const previewRows = computed(() => {
  if (!sourceData.value) return [];
  return sourceData.value.slice(0, 5);
});

// Close dropdown when clicking outside
function closeDropdown(e: Event) {
  if (openDropdown.value) {
    const target = e.target as HTMLElement;
    if (!target.closest('.multi-select-container')) {
      openDropdown.value = null;
    }
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown);
});
onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});

function toggleDropdown(header: string) {
  openDropdown.value = openDropdown.value === header ? null : header;
}

function toggleMapping(header: string, col: string) {
  if (!mapping.value[header]) {
    mapping.value[header] = [];
  }
  const idx = mapping.value[header].indexOf(col);
  if (idx > -1) {
    mapping.value[header].splice(idx, 1);
  } else {
    mapping.value[header].push(col);
  }
}

// 解析上传的 Excel 文件
async function readWorkbookFromFile(file: File) {
  const data = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const wb = XLSX.read(data, { type: 'array' });
  return { XLSX, wb };
}

async function onSourceFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (!file) return;
  const { XLSX, wb } = await readWorkbookFromFile(file);
  
  let allData: any[] = [];

  // 遍历所有 Sheet
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    // 先读取为二维数组，寻找表头
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    
    let headerIndex = -1;
    // 简单的启发式：寻找包含 '姓名' 的行，最多找前20行
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const rowStr = (rows[i] || []).map(c => String(c).trim());
      if (rowStr.includes('姓名')) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) continue; // 该 Sheet 没找到有效表头，跳过

    // 从 headerIndex 开始解析
    const headers = (rows[headerIndex] || []).map(h => String(h).trim());
    const dataRows = rows.slice(headerIndex + 1);
    
    const sheetJson = dataRows.map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h, index) => {
        if (h) {
          obj[h] = row[index] !== undefined ? row[index] : '';
        }
      });
      return obj;
    }).filter(obj => Object.values(obj).some(v => v !== '')); // 过滤空行

    allData = allData.concat(sheetJson);
  }

  if (allData.length === 0) {
    alert('未在任何 Sheet 中找到包含“姓名”的表头数据');
  }

  sourceData.value = allData;
  // 如果已有模版，尝试自动映射
  if (templateHeaders.value) {
    autoMap();
  }
}

async function onTemplateFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (!file) return;
  const { XLSX, wb } = await readWorkbookFromFile(file);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return;
  const ws = wb.Sheets[sheetName];
  if (!ws) return;
  
  // 读取首行作为模版字段（寻找第一行非空）
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  let headerRow: any[] | undefined = undefined;
  for (const r of rows) {
    if (r && r.some((c:any)=>c !== null && c !== undefined && String(c).trim() !== '')) {
      headerRow = r;
      break;
    }
  }
  if (!headerRow) {
    templateHeaders.value = [];
  } else {
    // 规范化字符串
    templateHeaders.value = headerRow.map(h => String(h).trim());
    // 自动触发一次映射
    if (sourceData.value) {
      autoMap();
    }
  }
}

// 自动映射模版字段到源表列
function normalize(s: string) {
  return s.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase();
}

function findBestMatch(header: string, sourceCols: string[]): string | null {
  const norm = normalize(header);
  // 常见别名
  const synonyms: Record<string,string> = {
    '身份证号码':'身份证号',
    '联系方式':'手机号',
    '联系电话':'手机号',
    '手机号':'手机号',
    '所在部门/公司': '部门', 
    '所在部门': '部门',
    '部门': '部门',
    '公司': '公司',
    '姓名': '姓名',
    '性别': '性别',
    '年龄': '年龄',
    '岁数': '年龄',
    '政治面貌': '政治面貌'
  };
  
  // 1. 精确匹配
  if (sourceCols.includes(header)) return header;

  // 2. 别名匹配
  if (synonyms[header]) {
    const target = synonyms[header];
    const match = sourceCols.find(c => c === target || c.includes(target));
    if (match) return match;
  }

  // 3. 归一化匹配
  for (const s of sourceCols) {
    if (normalize(s) === norm) return s;
  }
  
  // 4. 包含匹配
  for (const s of sourceCols) {
    if (normalize(s).includes(norm) || norm.includes(normalize(s))) return s;
  }
  return null;
}

function autoMap() {
  if (!sourceData.value || !templateHeaders.value) return;
  const cols = sourceColumns.value;
  const m: Record<string,string[]> = {};
  for (const th of templateHeaders.value) {
    const match = findBestMatch(th, cols);
    m[th] = match ? [match] : [];
  }
  mapping.value = m;
}

function generateJson() {
  outputData.value = [];
  if (!sourceData.value || !templateHeaders.value) return;
  
  // 1. 按照源表的“公司”列进行排序（如果存在）
  const companyCol = sourceColumns.value.find(c => c === '公司') || sourceColumns.value.find(c => c.includes('公司'));
  
  let dataProcess = [...sourceData.value];
  if (companyCol) {
    dataProcess.sort((a,b) => {
      const va = String(a[companyCol] || '').trim();
      const vb = String(b[companyCol] || '').trim();
      return va.localeCompare(vb, 'zh-CN');
    });
  }

  const map = mapping.value;
  // Build rows according to template
  for (const row of dataProcess) {
    const outRow: Record<string, any> = {};
    for (const th of templateHeaders.value) {
      const cols = map[th] || [];
      // 尝试从映射的列中找到第一个非空值
      let val = '';
      for (const col of cols) {
        if (row[col] !== undefined && row[col] !== '' && row[col] !== null) {
          val = row[col];
          break;
        }
      }
      outRow[th] = val;
    }
    outputData.value.push(outRow);
  }
}

async function downloadExcel() {
  if (!outputData.value.length) return;
  const XLSX = await import('xlsx');
  
  // 使用模版表头顺序生成 Sheet
  const ws = XLSX.utils.json_to_sheet(outputData.value, { header: templateHeaders.value || [] });
  
  // 创建新的工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "提取结果");
  
  // 导出文件
  XLSX.writeFile(wb, "人员提取结果.xlsx");
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(outputData.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'person-extract.json';
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
/* Glassmorphism Dashboard Theme */
.person-extract-page {
  /* Layout handles padding */
  width: 100%;
  max-width: calc(100vw - 450px);
  /* margin: 0 auto; */
}

h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 24px 0;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

h3::before {
  content: '';
  display: block;
  width: 4px;
  height: 16px;
  background: var(--accent-color);
  border-radius: 2px;
  box-shadow: 0 0 8px var(--accent-color);
}

h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Glass Cards */
.uploader, .mapping, .output {
  background: var(--bg-panel);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid var(--border-color);
  margin-bottom: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  color: var(--text-primary);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
}

.uploader:hover, .mapping:hover, .output:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: var(--text-secondary);
}

.upload-row {
  display: flex;
  gap: 24px;
  margin-bottom: 0;
}

.uploader {
  width: 50%;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* Inputs */
input[type="file"] {
  font-size: 13px;
  padding: 12px;
  color: var(--text-primary);
  background: var(--input-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s;
}

input[type="file"]:hover {
  border-color: var(--text-secondary);
  background: var(--bg-panel);
}

input[type="file"]::file-selector-button {
  background: var(--border-color);
  border: none;
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  margin-right: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

input[type="file"]::file-selector-button:hover {
  background: var(--text-tertiary);
}

/* Tables */
.mapping table, .preview-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.mapping th, .preview-table th {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 600;
  background: var(--input-bg);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(5px);
}

.mapping td, .preview-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  vertical-align: middle;
  white-space: nowrap;
}

.mapping tr:hover td, .preview-table tr:hover td {
  background: var(--bg-panel);
}

.mapping tr:last-child td {
  border-bottom: none;
}

/* Actions / Buttons */
.actions {
  margin: 24px 0;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

button {
  background: var(--bg-panel);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover {
  background: var(--input-bg);
  border-color: var(--text-secondary);
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

button:disabled {
  background: rgba(0,0,0,0.05);
  color: var(--text-tertiary);
  border-color: var(--border-color);
  cursor: not-allowed;
  transform: none;
}

/* Primary Actions */
button:not(:disabled):nth-child(2),
button:not(:disabled):nth-child(3) {
  border: none;
  font-weight: 600;
}

:global(.theme-blue) button:not(:disabled):nth-child(2),
:global(.theme-blue) button:not(:disabled):nth-child(3) {
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
  color: white;
}

:global(.theme-black) button:not(:disabled):nth-child(2),
:global(.theme-black) button:not(:disabled):nth-child(3) {
  background: linear-gradient(135deg, #00ff9d 0%, #00b8ff 100%);
  color: #000;
  box-shadow: 0 4px 15px rgba(0, 255, 157, 0.3);
}

:global(.theme-purple) button:not(:disabled):nth-child(2),
:global(.theme-purple) button:not(:disabled):nth-child(3) {
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  box-shadow: 0 4px 15px rgba(217, 70, 239, 0.3);
  color: white;
}

:global(.theme-white) button:not(:disabled):nth-child(2),
:global(.theme-white) button:not(:disabled):nth-child(3) {
  background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(44, 62, 80, 0.2);
}

/* Multi-select Customization */
.multi-select-container {
  position: relative;
  width: 100%;
}

.selected-tags {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 6px 12px;
  min-height: 36px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  cursor: pointer;
  background: var(--input-bg);
  align-items: center;
  transition: all 0.2s;
}

.selected-tags:hover {
  border-color: var(--text-secondary);
  background: var(--bg-panel);
}

.selected-tags:focus-within {
  border-color: currentColor;
}

.tag {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

:global(.theme-blue) .tag { color: #00d2ff; border-color: rgba(0, 210, 255, 0.3); background: rgba(0, 210, 255, 0.1); }
:global(.theme-black) .tag { color: #00ff9d; border-color: rgba(0, 255, 157, 0.3); background: rgba(0, 255, 157, 0.1); }
/* Purple and White themes use default variables now, or we can keep specific accents if desired */
:global(.theme-purple) .tag { color: #4a148c; border-color: rgba(74, 20, 140, 0.3); background: rgba(255, 255, 255, 0.8); }
:global(.theme-white) .tag { color: #2c3e50; border-color: rgba(44, 62, 80, 0.3); background: rgba(255, 255, 255, 0.8); }

.remove-tag {
  cursor: pointer;
  opacity: 0.7;
  font-weight: 600;
}

.remove-tag:hover {
  opacity: 1;
}

.placeholder {
  color: var(--text-tertiary);
  font-size: 13px;
  font-style: italic;
}

.arrow {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-tertiary);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  max-height: 240px;
  overflow-y: auto;
  background: var(--dropdown-bg, var(--bg-panel));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  padding: 8px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: var(--input-bg);
  color: var(--text-primary);
}

.dropdown-item input {
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  width: 16px;
  height: 16px;
  background: #fff;
  border: 1px solid var(--text-secondary);
  border-radius: 3px;
  position: relative;
  margin: 0;
}

.dropdown-item input:checked {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}

.dropdown-item input:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 4px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Output Area */
.output textarea {
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  font-family: 'Fira Code', 'SF Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: all 0.2s;
}

.output textarea:focus {
  border-color: var(--accent-color);
  background-color: var(--bg-panel);
}

/* Source Preview */
.source-preview {
  margin-top: 24px;
  border-top: 1px solid var(--border-color);
  padding-top: 24px;
}

.detected-columns {
  max-height: 80px;
  overflow-y: auto;
  background: var(--input-bg);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.table-scroll {
  overflow: auto;
  max-height: 300px;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
}

/* Scrollbar for table */
.table-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.table-scroll::-webkit-scrollbar-track {
  background: var(--input-bg);
}
.table-scroll::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}
.table-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
