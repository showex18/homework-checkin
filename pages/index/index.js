const app = getApp()
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    childName: '',
    todayDate: '',
    todayCheckins: 0,
    totalTasks: 0,
    completedTasks: 0,
    todayPending: 0,
    progressPercent: 0,
    streakDays: 0,
    todayTasks: [],
    loading: true
  },

  onLoad() {
    this.setData({ todayDate: util.formatDateCN(new Date()) })
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadPageData()
  },

  async loadPageData() {
    this.setData({ loading: true })
    try {
      // 获取用户信息
      const userInfo = app.globalData.userInfo
      if (userInfo) {
        this.setData({
          childName: userInfo.childName || '宝贝'
        })
      }

      // 获取任务列表
      const tasks = await api.getTasks()
      const todayCheckins = await api.getTodayCheckins()

      // 计算统计数据
      const totalTasks = tasks.length
      const completedTasks = tasks.filter(t => t.status === 'completed').length
      const todayCheckinTaskIds = todayCheckins.map(c => c.taskId)
      const todayPending = tasks.filter(t =>
        t.status === 'active' && !todayCheckinTaskIds.includes(t._id)
      ).length

      // 今日待打卡任务
      const todayTasks = tasks.filter(t => t.status === 'active').slice(0, 5).map(t => ({
        ...t,
        checkedToday: todayCheckinTaskIds.includes(t._id),
        subjectStyle: util.getSubjectStyle(t.subject)
      }))

      // 进度百分比
      const progressPercent = util.percent(completedTasks, totalTasks)

      // 连续打卡天数
      const checkinDates = [...new Set(todayCheckins.map(c => c.date))]
      const streakDays = util.calcStreakDays(checkinDates)

      this.setData({
        totalTasks,
        completedTasks,
        todayCheckins: todayCheckins.length,
        todayPending,
        todayTasks,
        progressPercent,
        streakDays,
        loading: false
      })
    } catch (err) {
      console.error('加载数据失败:', err)
      this.setData({ loading: false })
    }
  },

  // 跳转到拍照导入
  goCamera() {
    wx.navigateTo({ url: '/pages/camera/camera' })
  },

  // 跳转到打卡
  goCheckin(e) {
    const taskId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/checkin/checkin?taskId=${taskId}` })
  },

  // 跳转到任务列表
  goTaskList() {
    wx.switchTab({ url: '/pages/taskList/taskList' })
  },

  // 跳转到进度页
  goProgress() {
    wx.switchTab({ url: '/pages/progress/progress' })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadPageData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
