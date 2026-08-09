const app = getApp()
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    tasks: [],
    groupedTasks: [],
    loading: true,
    filter: 'all',  // all / active / completed
    todayCheckins: []
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [tasks, todayCheckins] = await Promise.all([
        api.getTasks(),
        api.getTodayCheckins()
      ])

      const checkinTaskIds = todayCheckins.map(c => c.taskId)
      const processedTasks = tasks.map(t => ({
        ...t,
        subjectStyle: util.getSubjectStyle(t.subject),
        checkedToday: checkinTaskIds.includes(t._id),
        progressPercent: util.percent(t.checkedDays, t.totalDays)
      }))

      this.setData({
        tasks: processedTasks,
        todayCheckins,
        loading: false
      })
      this.applyFilter()
    } catch (err) {
      console.error('加载任务失败:', err)
      this.setData({ loading: false })
    }
  },

  applyFilter() {
    let filtered = this.data.tasks
    if (this.data.filter === 'active') {
      filtered = filtered.filter(t => t.status === 'active')
    } else if (this.data.filter === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed')
    }

    // 按学科分组
    const groups = {}
    filtered.forEach(t => {
      const subject = t.subject || '其他'
      if (!groups[subject]) {
        groups[subject] = {
          subject,
          style: util.getSubjectStyle(subject),
          tasks: []
        }
      }
      groups[subject].tasks.push(t)
    })

    const groupedTasks = Object.values(groups)
    this.setData({ groupedTasks })
  },

  switchFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter })
    this.applyFilter()
  },

  // 去打卡
  goCheckin(e) {
    const taskId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/checkin/checkin?taskId=${taskId}` })
  },

  // 添加任务
  addTask() {
    wx.navigateTo({ url: '/pages/camera/camera' })
  },

  // 删除任务
  async deleteTask(e) {
    const taskId = e.currentTarget.dataset.id
    const confirmed = await util.confirm('确定删除这个任务吗？相关打卡记录也会保留。')
    if (!confirmed) return

    util.showLoading('删除中...')
    try {
      await api.deleteTask(taskId)
      util.hideLoading()
      util.toast('已删除', 'success')
      this.loadData()
    } catch (err) {
      util.hideLoading()
    }
  },

  // 标记完成
  async markComplete(e) {
    const taskId = e.currentTarget.dataset.id
    const confirmed = await util.confirm('确定标记为已完成吗？')
    if (!confirmed) return

    try {
      await api.updateTask(taskId, { status: 'completed' })
      util.toast('已完成！🎉', 'success')
      this.loadData()
    } catch (err) {
      console.error(err)
    }
  },

  // 长按删除
  onLongPress(e) {
    const taskId = e.currentTarget.dataset.id
    this.deleteTask({ currentTarget: { dataset: { id: taskId } } })
  }
})
