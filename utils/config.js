/**
 * 全局配置文件
 */

// 云开发环境ID（替换为你的实际环境ID）
const CLOUD_ENV = 'your-env-id'

// 通义千问VL API配置
const QWEN_VL_CONFIG = {
  apiKey: 'your-api-key',        // 阿里云DashScope API Key
  model: 'qwen-vl-plus',         // 模型名称
  apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
}

// 免费用户限制
const FREE_LIMITS = {
  maxTasks: 3,           // 最多任务数
  maxSubjects: 3,        // 最多科目数
  canExportReport: false  // 能否导出报告
}

// 学科颜色映射
const SUBJECT_STYLES = {
  '语文': { bg: '#FFF3E0', color: '#E65100', tag: 'tag-chinese' },
  '数学': { bg: '#E3F2FD', color: '#1565C0', tag: 'tag-math' },
  '英语': { bg: '#F3E5F5', color: '#7B1FA2', tag: 'tag-english' },
  '科学': { bg: '#E8F5E9', color: '#2E7D32', tag: 'tag-science' },
  '物理': { bg: '#E8F5E9', color: '#2E7D32', tag: 'tag-science' },
  '化学': { bg: '#E8F5E9', color: '#2E7D32', tag: 'tag-science' },
  '生物': { bg: '#E8F5E9', color: '#2E7D32', tag: 'tag-science' },
  '其他': { bg: '#ECEFF1', color: '#546E7A', tag: 'tag-other' }
}

// 订阅消息模板ID（在微信公众平台配置后替换）
const SUBSCRIBE_TEMPLATES = {
  dailyReminder: 'your-template-id'  // 每日打卡提醒模板
}

module.exports = {
  CLOUD_ENV,
  QWEN_VL_CONFIG,
  FREE_LIMITS,
  SUBJECT_STYLES,
  SUBSCRIBE_TEMPLATES
}
