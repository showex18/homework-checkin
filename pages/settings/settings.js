const app = getApp()
const api = require('../../utils/api')
const util = require('../../utils/util')
const { SUBSCRIBE_TEMPLATES, FREE_LIMITS } = require('../../utils/config')

Page({
  data: {
    childName: '',
    grade: '',
    isPro: false,
    taskCount: 0,
    checkinCount: 0,
    showGradePicker: false,
    grades: ['幼儿园', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'],
    gradeIndex: -1
  },

  onShow() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    const userInfo = app.globalData.userInfo || {}
    const gradeIndex = this.data.grades.indexOf(userInfo.grade || '')

    // 获取统计
    try {
      const tasks = await api.getTasks()
      this.setData({
        childName: userInfo.childName || '',
        grade: userInfo.grade || '',
        isPro: userInfo.isPro || false,
        gradeIndex: gradeIndex >= 0 ? gradeIndex : -1,
        taskCount: tasks.length,
        checkinCount: tasks.reduce((sum, t) => sum + (t.checkedDays || 0), 0)
      })
    } catch (err) {
      this.setData({
        childName: userInfo.childName || '',
        grade: userInfo.grade || '',
        isPro: userInfo.isPro || false,
        gradeIndex: gradeIndex >= 0 ? gradeIndex : -1
      })
    }
  },

  // 输入孩子姓名
  inputName(e) {
    this.setData({ childName: e.detail.value })
  },

  // 选择年级
  onGradeChange(e) {
    const index = e.detail.value
    this.setData({
      gradeIndex: index,
      grade: this.data.grades[index]
    })
  },

  // 保存信息
  async saveInfo() {
    if (!this.data.childName.trim()) {
      util.toast('请输入孩子姓名')
      return
    }

    util.showLoading('保存中...')
    try {
      await api.updateUserInfo({
        childName: this.data.childName.trim(),
        grade: this.data.grade
      })

      app.updateUserInfo({
        childName: this.data.childName.trim(),
        grade: this.data.grade
      })

      util.hideLoading()
      util.toast('保存成功', 'success')
    } catch (err) {
      util.hideLoading()
      util.toast('保存失败')
    }
  },

  // 开启提醒
  async enableReminder() {
    try {
      const granted = await api.requestSubscribe([SUBSCRIBE_TEMPLATES.dailyReminder])
      if (granted.length > 0) {
        util.toast('提醒已开启', 'success')
      } else {
        util.toast('需要在弹窗中点击"允许"')
      }
    } catch (err) {
      util.toast('开启失败，请重试')
    }
  },

  // 分享解锁
  onShareAppMessage() {
    return {
      title: `这个暑假作业打卡神器太好用了！${this.data.childName}已经连续打卡好多天了~`,
      path: '/pages/index/index',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '暑假作业打卡神器 - AI拍照导入，进度一目了然！'
    }
  },

  // 清除缓存
  async clearCache() {
    const confirmed = await util.confirm('确定清除本地缓存吗？不会影响云端数据。')
    if (!confirmed) return

    wx.clearStorageSync()
    util.toast('缓存已清除', 'success')
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/index/index' })
    }, 1500)
  },

  // 关于
  showAbout() {
    wx.showModal({
      title: '关于',
      content: '暑假作业打卡神器 v1.0\n\nAI拍照导入作业通知，自动生成任务清单，每日打卡，进度可视化。\n\n让暑假作业不再手忙脚乱！',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
