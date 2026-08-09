const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    calendarDays: [],
    streakDays: 0,
    totalCheckins: 0,
    subjectStats: [],
    overallProgress: 0,
    loading: true,
    checkinDateSet: null
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [progress] = await Promise.all([api.getProgress()])

      // 生成最近30天日历
      const recentDays = util.getRecentDays(30)
      const checkinDateSet = new Set(progress.checkinDates || [])

      const calendarDays = recentDays.map(d => ({
        ...d,
        hasCheckin: checkinDateSet.has(d.date),
        isToday: d.date === util.today()
      }))

      // 科目统计
      const subjectStats = (progress.subjectStats || []).map(s => ({
        ...s,
        style: util.getSubjectStyle(s.subject),
        percent: util.percent(s.checkedDays, s.totalDays)
      }))

      this.setData({
        calendarDays,
        streakDays: progress.streakDays || 0,
        totalCheckins: progress.totalCheckins || 0,
        subjectStats,
        overallProgress: progress.overallProgress || 0,
        checkinDateSet,
        loading: false
      })
    } catch (err) {
      console.error('加载进度失败:', err)
      this.setData({ loading: false })
    }
  }
})
