/**
 * API 请求封装 - 云函数调用
 */
const { toast } = require('./util')

/**
 * 调用云函数的统一封装
 */
function callFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        if (res.result && res.result.code === 0) {
          resolve(res.result.data)
        } else {
          const errMsg = (res.result && res.result.message) || '请求失败'
          toast(errMsg)
          reject(new Error(errMsg))
        }
      },
      fail: (err) => {
        console.error(`[云函数 ${name}] 调用失败:`, err)
        toast('网络异常，请重试')
        reject(err)
      }
    })
  })
}

/**
 * 登录
 */
function login() {
  return callFunction('login')
}

/**
 * 更新用户信息
 */
function updateUserInfo(data) {
  return callFunction('login', { action: 'update', data })
}

/**
 * AI解析作业通知照片
 * @param {string} fileID - 云存储文件ID
 */
function parseTask(fileID) {
  return callFunction('parseTask', { fileID })
}

/**
 * 获取任务列表
 */
function getTasks() {
  return callFunction('checkin', { action: 'getTasks' })
}

/**
 * 添加任务
 */
function addTask(task) {
  return callFunction('checkin', { action: 'addTask', task })
}

/**
 * 批量添加任务
 */
function batchAddTasks(tasks) {
  return callFunction('checkin', { action: 'batchAddTasks', tasks })
}

/**
 * 更新任务
 */
function updateTask(taskId, data) {
  return callFunction('checkin', { action: 'updateTask', taskId, data })
}

/**
 * 删除任务
 */
function deleteTask(taskId) {
  return callFunction('checkin', { action: 'deleteTask', taskId })
}

/**
 * 打卡
 */
function doCheckin(taskId, photoFileId, note) {
  return callFunction('checkin', { action: 'checkin', taskId, photoFileId, note })
}

/**
 * 获取今日打卡记录
 */
function getTodayCheckins() {
  return callFunction('checkin', { action: 'getTodayCheckins' })
}

/**
 * 获取进度数据
 */
function getProgress() {
  return callFunction('getProgress')
}

/**
 * 上传图片到云存储
 */
function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    const cloudPath = `checkin/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => resolve(res.fileID),
      fail: (err) => {
        console.error('上传图片失败:', err)
        toast('图片上传失败')
        reject(err)
      }
    })
  })
}

/**
 * 请求订阅消息授权
 */
function requestSubscribe(tmplIds) {
  return new Promise((resolve, reject) => {
    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        const granted = []
        tmplIds.forEach(id => {
          if (res[id] === 'accept') granted.push(id)
        })
        resolve(granted)
      },
      fail: (err) => reject(err)
    })
  })
}

module.exports = {
  callFunction,
  login,
  updateUserInfo,
  parseTask,
  getTasks,
  addTask,
  batchAddTasks,
  updateTask,
  deleteTask,
  doCheckin,
  getTodayCheckins,
  getProgress,
  uploadImage,
  requestSubscribe
}
