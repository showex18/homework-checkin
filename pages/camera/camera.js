const app = getApp()
const api = require('../../utils/api')
const util = require('../../utils/util')
const { FREE_LIMITS } = require('../../utils/config')

Page({
  data: {
    step: 'camera',     // camera -> parsing -> confirm
    imagePath: '',
    fileID: '',
    parsedTasks: [],
    editingTasks: [],
    parsing: false,
    parseError: '',
    canAddMore: true
  },

  onLoad() {
    this.checkLimit()
  },

  checkLimit() {
    // 检查是否超过免费任务限制
    const isPro = app.globalData.isPro
    if (!isPro) {
      api.getTasks().then(tasks => {
        if (tasks.length >= FREE_LIMITS.maxTasks) {
          this.setData({
            canAddMore: false,
            parseError: `免费版最多 ${FREE_LIMITS.maxTasks} 个任务，分享给好友即可解锁 unlimited`
          })
        }
      })
    }
  },

  // 拍照
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      camera: 'back',
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          imagePath: tempFilePath,
          step: 'camera',
          parseError: ''
        })
        this.uploadAndParse()
      },
      fail: (err) => {
        console.log('取消选择', err)
      }
    })
  },

  // 上传并AI解析
  async uploadAndParse() {
    this.setData({ parsing: true, step: 'parsing', parseError: '' })

    try {
      // 1. 上传图片到云存储
      const fileID = await api.uploadImage(this.data.imagePath)
      this.setData({ fileID })

      // 2. 调用AI解析
      const tasks = await api.parseTask(fileID)

      if (!tasks || tasks.length === 0) {
        throw new Error('未能识别到作业内容，请重新拍照')
      }

      // 3. 给每个任务添加样式
      const parsedTasks = tasks.map(t => ({
        ...t,
        subjectStyle: util.getSubjectStyle(t.subject || '其他'),
        selected: true,
        id: util.generateId()
      }))

      this.setData({
        parsedTasks,
        editingTasks: parsedTasks,
        parsing: false,
        step: 'confirm'
      })
    } catch (err) {
      console.error('解析失败:', err)
      this.setData({
        parsing: false,
        parseError: err.message || 'AI解析失败，请重试',
        step: 'camera'
      })
      util.toast(err.message || 'AI解析失败，请重试')
    }
  },

  // 编辑任务 - 修改标题
  editTaskTitle(e) {
    const { id } = e.currentTarget.dataset
    const value = e.detail.value
    const editingTasks = this.data.editingTasks.map(t =>
      t.id === id ? { ...t, title: value } : t
    )
    this.setData({ editingTasks })
  },

  // 编辑任务 - 修改学科
  editTaskSubject(e) {
    const { id } = e.currentTarget.dataset
    const subjects = ['语文', '数学', '英语', '科学', '物理', '化学', '生物', '其他']
    wx.showActionSheet({
      itemList: subjects,
      success: (res) => {
        const subject = subjects[res.tapIndex]
        const editingTasks = this.data.editingTasks.map(t =>
          t.id === id ? {
            ...t,
            subject,
            subjectStyle: util.getSubjectStyle(subject)
          } : t
        )
        this.setData({ editingTasks })
      }
    })
  },

  // 切换选中状态
  toggleTask(e) {
    const { id } = e.currentTarget.dataset
    const editingTasks = this.data.editingTasks.map(t =>
      t.id === id ? { ...t, selected: !t.selected } : t
    )
    this.setData({ editingTasks })
  },

  // 删除任务
  deleteParsedTask(e) {
    const { id } = e.currentTarget.dataset
    const editingTasks = this.data.editingTasks.filter(t => t.id !== id)
    this.setData({ editingTasks })
  },

  // 手动添加任务
  addManualTask() {
    const newTask = {
      id: util.generateId(),
      title: '',
      subject: '其他',
      subjectStyle: util.getSubjectStyle('其他'),
      description: '',
      totalDays: 30,
      checkedDays: 0,
      selected: true,
      isManual: true
    }
    this.setData({
      editingTasks: [...this.data.editingTasks, newTask],
      step: 'confirm'
    })
  },

  // 保存任务
  async saveTasks() {
    const selectedTasks = this.data.editingTasks.filter(t => t.selected && t.title.trim())

    if (selectedTasks.length === 0) {
      util.toast('请至少选择一个任务')
      return
    }

    // 检查免费限制
    const isPro = app.globalData.isPro
    if (!isPro) {
      const existing = await api.getTasks()
      if (existing.length + selectedTasks.length > FREE_LIMITS.maxTasks) {
        wx.showModal({
          title: '需要解锁',
          content: `免费版最多 ${FREE_LIMITS.maxTasks} 个任务，分享给好友即可解锁全部功能`,
          confirmText: '去分享',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/settings/settings' })
            }
          }
        })
        return
      }
    }

    util.showLoading('保存中...')

    try {
      const tasks = selectedTasks.map(t => ({
        title: t.title.trim(),
        subject: t.subject || '其他',
        description: t.description || '',
        totalDays: t.totalDays || 30,
        source: t.isManual ? 'manual' : 'ai_photo'
      }))

      await api.batchAddTasks(tasks)
      util.hideLoading()
      util.toast('保存成功', 'success')

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (err) {
      util.hideLoading()
      util.toast('保存失败，请重试')
    }
  },

  // 重新拍照
  retake() {
    this.setData({
      step: 'camera',
      imagePath: '',
      fileID: '',
      parsedTasks: [],
      editingTasks: [],
      parseError: ''
    })
    this.takePhoto()
  },

  // 取消
  cancel() {
    wx.navigateBack()
  }
})
