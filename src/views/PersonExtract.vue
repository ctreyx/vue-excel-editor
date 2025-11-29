<template>
  <div class="person-extract-page">
    <h1>人员提取</h1>

    <div class="upload-row">
      <div class="uploader">
        <h3>1) 上传待提取的 Excel（源表）</h3>
        <input type="file" accept=".xls,.xlsx" @change="onSourceFile" />
        <div v-if="sourceData">
          行数：{{ sourceData.length }}
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

    <div class="mapping" v-if="templateHeaders && templateHeaders.length">
      <h4>3) 字段映射确认（可手动修改）</h4>
      <table class="mapping-table">
        <thead>
          <tr>
            <th>模版字段</th>
            <th>映射到源表列</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="header in templateHeaders" :key="header">
            <td>{{ header }}</td>
            <td>
              <select v-model="mapping[header]">
                <option value="">(请选择源表列)</option>
                <option v-for="col in sourceColumns" :key="col" :value="col">
                  {{ col }}
                </option>
              </select>
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
      <textarea rows="12" style="width:100%;">{{ prettyJson }}</textarea>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const sourceData = ref<any[] | null>(null);
const templateHeaders = ref<string[] | null>(null);
const mapping = ref<Record<string,string>>({});
const outputData = ref<any[]>([]);

const prettyJson = computed(() => JSON.stringify(outputData.value, null, 2));

const sourceColumns = computed(() => {
  if (!sourceData.value || sourceData.value.length === 0) return [];
  return Object.keys(sourceData.value[0]);
});

const previewRows = computed(() => {
  if (!sourceData.value) return [];
  return sourceData.value.slice(0, 5);
});

// 解析上传的 Excel 文件
async function readWorkbookFromFile(file: File) {
  const data = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const wb = XLSX.read(data, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    alert('Excel 文件为空或无法读取');
    throw new Error('No sheets found');
  }
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error('Sheet content is empty');
  return { XLSX, wb, ws };
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
}

async function onTemplateFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (!file) return;
  const { XLSX, ws } = await readWorkbookFromFile(file);
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

function findBestMatch(header: string, sourceCols: string[]) {
  const norm = normalize(header);
  // 常见别名
  const synonyms: Record<string,string> = {
    '身份证号码':'身份证号',
    '联系方式':'手机号',
    '联系电话':'手机号',
    '手机号':'手机号',
    '所在部门/公司': '部门', // 优先映射到部门
    '所在部门': '部门',
    '部门': '部门',
    '公司': '公司',
    '姓名': '姓名',
    '性别': '性别',
    '年龄': '年龄(岁)',
    '政治面貌': '政治面貌'
  };
  
  // 1. 精确匹配
  if (sourceCols.includes(header)) return header;

  // 2. 别名匹配
  if (synonyms[header]) {
    const target = synonyms[header];
    // 尝试在源列中找到别名对应的列（支持模糊）
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
  return '';
}

function autoMap() {
  if (!sourceData.value || !templateHeaders.value) return;
  const cols = sourceColumns.value;
  const m: Record<string,string> = {};
  for (const th of templateHeaders.value) {
    const match = findBestMatch(th, cols);
    m[th] = match || '';
  }
  mapping.value = m;
}

function generateJson() {
  outputData.value = [];
  if (!sourceData.value || !templateHeaders.value) return;
  
  // 1. 按照源表的“公司”列进行排序（如果存在）
  // 优先找明确叫“公司”的列，其次找包含“公司”的列
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
      const col = map[th];
      outRow[th] = col ? row[col] ?? '' : '';
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
.person-extract-page { padding: 16px; }
.upload-row { display:flex; gap:20px; margin-bottom:12px }
.uploader { border:1px solid #ddd; padding:12px; border-radius:6px; width:50% }
.actions { margin:12px 0 }
.mapping table { border-collapse: collapse; width:100%; }
.mapping th, .mapping td { border:1px solid #ddd; padding:6px }
.output textarea { font-family: monospace }

.source-preview { margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px; }
.table-scroll { overflow-x: auto; max-width: 100%; }
.preview-table { border-collapse: collapse; width: 100%; font-size: 12px; }
.preview-table th, .preview-table td { border: 1px solid #eee; padding: 4px; white-space: nowrap; }
.preview-table th { background: #f9f9f9; font-weight: bold; }
</style>