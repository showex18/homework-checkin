/**
 * 通用工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  if (!date) date = new Date()
  if (typeof date === 'string') date = new Date(date)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 格式化日期为中文格式
 */
function formatDateCN(date) {
  if (!date) date = new Date()
  if (typeof date === 'string') date = new Date(date)
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${m}月${d}日`
}

/**
 * 获取今天的日期字符串
 */
function today() {
  return formatDate(new Date())
}

/**
 * 获取本周日期范围
 */
function getWeekRange() {
  const now = new Date()
  const day = now.getDay() || 7  // 周日=7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  }
}

/**
 * 获取两个日期之间的所有日期
 */
function getDatesBetween(start, end) {
  const result = []
  const s = new Date(start)
  const e = new Date(end)
  while (s <= e) {
    result.push(formatDate(s))
    s.setDate(s.getDate() + 1)
  }
  return result
}

/**
 * 计算连续打卡天数
 * @param {Array} checkinDates - 打卡日期数组 ['2025-07-01', '2025-07-02', ...]
 * @returns {number} 连续天数
 */
function calcStreakDays(checkinDates) {
  if (!checkinDates || checkinDates.length === 0) return 0
  const sorted = [...checkinDates].sort()
  const todayStr = today()
  const yesterday = formatDate(new Date(Date.now() - 86400000))

  // 从今天或昨天开始算
  let streak = 0
  let checkDate = sorted.includes(todayStr) ? todayStr : (sorted.includes(yesterday) ? yesterday : null)

  if (!checkDate) return 0

  const dateSet = new Set(sorted)
  let current = new Date(checkDate)
  while (dateSet.has(formatDate(current))) {
    streak++
    current.setDate(current.getDate() - 1)
  }
  return streak
}

/**
 * 计算百分比
 */
function percent(numerator, denominator) {
  if (!denominator || denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

/**
 * 获取学科样式
 */
function getSubjectStyle(subject) {
  const { SUBJECT_STYLES } = require('./config')
  return SUBJECT_STYLES[subject] || SUBJECT_STYLES['其他']
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

/**
 * 显示提示
 */
function toast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 })
}

/**
 * 显示加载
 */
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

/**
 * 隐藏加载
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示确认弹窗
 */
function confirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm)
    })
  })
}

/**
 * 获取最近N天的日期数组（用于日历热力图）
 */
function getRecentDays(n) {
  const result = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    result.push({
      date: formatDate(d),
      day: d.getDate(),
      month: d.getMonth() + 1,
      weekday: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    })
  }
  return result
}

/**
 * 防抖
 */
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

module.exports = {
  formatDate,
  formatDateCN,
  today,
  getWeekRange,
  getDatesBetween,
  calcStreakDays,
  percent,
  getSubjectStyle,
  generateId,
  toast,
  showLoading,
  hideLoading,
  confirm,
  getRecentDays,
  debounce
}
