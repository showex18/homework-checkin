App({
  globalData: {
    userInfo: null,
    openid: null,
    isPro: false,
    childName: '',
    grade: ''
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 请替换为你的云开发环境ID
        // 在云开发控制台 -> 设置 -> 环境ID 中查看
        env: 'your-env-id',
        traceUser: true
      })
    }

    // 检查登录状态
    this.checkLogin()
  },

  // 检查登录状态，获取用户信息
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.openid = userInfo.openid
      this.globalData.isPro = userInfo.isPro || false
      this.globalData.childName = userInfo.childName || ''
      this.globalData.grade = userInfo.grade || ''
    }

    // 调用云函数登录
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        const { openid, isNewUser } = res.result
        this.globalData.openid = openid

        if (isNewUser || !this.globalData.userInfo) {
          // 新用户，跳转到设置页完善信息
          this.globalData.userInfo = { openid, isPro: false }
          wx.setStorageSync('userInfo', this.globalData.userInfo)
        } else {
          // 更新本地存储
          const stored = wx.getStorageSync('userInfo')
          this.globalData.userInfo = { ...stored, openid }
          wx.setStorageSync('userInfo', this.globalData.userInfo)
        }
      },
      fail: err => {
        console.error('登录失败', err)
      }
    })
  },

  // 更新全局用户信息并同步本地存储
  updateUserInfo(data) {
    this.globalData.userInfo = { ...this.globalData.userInfo, ...data }
    this.globalData.isPro = data.isPro !== undefined ? data.isPro : this.globalData.isPro
    this.globalData.childName = data.childName || this.globalData.childName
    this.globalData.grade = data.grade || this.globalData.grade
    wx.setStorageSync('userInfo', this.globalData.userInfo)
  },

  // 检查是否为Pro用户
  checkPro() {
    return this.globalData.isPro
  }
})
