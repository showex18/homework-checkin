const app = getApp()
const api = require('../../utils/api')
const util = require('../../utils/util')
const { SUBSCRIBE_TEMPLATES } = require('../../utils/config')

Page({
  data: {
    taskId: '',
    task: null,
    subjectStyle: null,
    photoFileId: '',
    photoPath: '',
    note: '',
    isChecking: false,
    todayDate: ''
  },

  onLoad(options) {
    if (options.taskId) {
      this.setData({ taskId: options.taskId, todayDate: util.formatDateCN(new Date()) })
      this.loadTask()
    }
  },

  async loadTask() {
    try {
      const tasks = await api.getTasks()
      const task = tasks.find(t => t._id === this.data.taskId)
      if (task) {
        this.setData({
          task: {
            ...task,
            progressPercent: util.percent(task.checkedDays, task.totalDays)
          },
          subjectStyle: util.getSubjectStyle(task.subject)
        })
      } else {
        util.toast('任务不存在')
        setTimeout(() => wx.navigateBack(), 1500)
      }
    } catch (err) {
      console.error('加载任务失败:', err)
    }
  },

  // 拍照打卡
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success: (res) => {
        this.setData({ photoPath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  // 删除照片
  removePhoto() {
    this.setData({ photoPath: '', photoFileId: '' })
  },

  // 输入备注
  inputNote(e) {
    this.setData({ note: e.detail.value })
  },

  // 确认打卡
  async confirmCheckin() {
    if (this.data.isChecking) return

    if (!this.data.photoPath) {
      util.toast('请先拍照打卡')
      return
    }

    this.setData({ isChecking: true })
    util.showLoading('打卡中...')

    try {
      // 1. 上传照片
      const photoFileId = await api.uploadImage(this.data.photoPath)

      // 2. 调用打卡云函数
      await api.doCheckin(this.data.taskId, photoFileId, this.data.note)

      util.hideLoading()

      // 3. 请求订阅消息授权（打卡成功后引导）
      this.requestReminder()

      // 4. 显示成功动画
      this.showSuccessAnim()
    } catch (err) {
      util.hideLoading()
      util.toast('打卡失败，请重试')
      this.setData({ isChecking: false })
    }
  },

  // 请求订阅消息
  async requestReminder() {
    try {
      await api.requestSubscribe([SUBSCRIBE_TEMPLATES.dailyReminder])
    } catch (err) {
      console.log('用户拒绝订阅消息')
    }
  },

  // 成功动画
  showSuccessAnim() {
    this.setData({ step: 'success' })
    this.setData({
      showSuccess: true,
      isChecking: false
    })

    setTimeout(() => {
      this.setData({ showSuccess: false })
      wx.switchTab({ url: '/pages/index/index' })
    }, 2000)
  }
})
