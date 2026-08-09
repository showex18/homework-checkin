// 打卡+任务管理云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  switch (event.action) {
    case 'getTasks':
      return getTasks(OPENID)
    case 'addTask':
      return addTask(OPENID, event.task)
    case 'batchAddTasks':
      return batchAddTasks(OPENID, event.tasks)
    case 'updateTask':
      return updateTask(OPENID, event.taskId, event.data)
    case 'deleteTask':
      return deleteTask(OPENID, event.taskId)
    case 'checkin':
      return doCheckin(OPENID, event.taskId, event.photoFileId, event.note)
    case 'getTodayCheckins':
      return getTodayCheckins(OPENID)
    default:
      return { code: -1, message: '未知操作' }
  }
}

/**
 * 获取任务列表
 */
async function getTasks(openid) {
  try {
    const res = await db.collection('tasks')
      .where({ _openid: openid })
      .orderBy('createTime', 'asc')
      .get()
    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '获取任务失败' }
  }
}

/**
 * 添加单个任务
 */
async function addTask(openid, task) {
  try {
    const res = await db.collection('tasks').add({
      data: {
        _openid: openid,
        title: task.title,
        subject: task.subject || '其他',
        description: task.description || '',
        totalDays: task.totalDays || 30,
        checkedDays: 0,
        status: 'active',
        source: task.source || 'manual',
        createTime: db.serverDate()
      }
    })
    return { code: 0, data: { _id: res._id } }
  } catch (err) {
    return { code: -1, message: '添加任务失败' }
  }
}

/**
 * 批量添加任务
 */
async function batchAddTasks(openid, tasks) {
  try {
    const results = []
    for (const task of tasks) {
      const res = await db.collection('tasks').add({
        data: {
          _openid: openid,
          title: task.title,
          subject: task.subject || '其他',
          description: task.description || '',
          totalDays: task.totalDays || 30,
          checkedDays: 0,
          status: 'active',
          source: task.source || 'manual',
          createTime: db.serverDate()
        }
      })
      results.push(res._id)
    }
    return { code: 0, data: { ids: results, count: results.length } }
  } catch (err) {
    return { code: -1, message: '批量添加失败' }
  }
}

/**
 * 更新任务
 */
async function updateTask(openid, taskId, data) {
  try {
    await db.collection('tasks')
      .where({ _openid: openid, _id: taskId })
      .update({
        data: {
          ...data,
          updateTime: db.serverDate()
        }
      })
    return { code: 0, data: { success: true } }
  } catch (err) {
    return { code: -1, message: '更新失败' }
  }
}

/**
 * 删除任务
 */
async function deleteTask(openid, taskId) {
  try {
    await db.collection('tasks')
      .where({ _openid: openid, _id: taskId })
      .remove()
    // 同时删除相关打卡记录
    await db.collection('checkins')
      .where({ _openid: openid, taskId })
      .remove()
    return { code: 0, data: { success: true } }
  } catch (err) {
    return { code: -1, message: '删除失败' }
  }
}

/**
 * 打卡
 */
async function doCheckin(openid, taskId, photoFileId, note) {
  try {
    const today = formatDate(new Date())

    // 检查今天是否已打卡此任务
    const existCheckin = await db.collection('checkins')
      .where({
        _openid: openid,
        taskId,
        date: today
      })
      .get()

    if (existCheckin.data.length > 0) {
      return { code: -1, message: '今天已经打卡过了' }
    }

    // 写入打卡记录
    await db.collection('checkins').add({
      data: {
        _openid: openid,
        taskId,
        date: today,
        photoFileId: photoFileId || '',
        note: note || '',
        createTime: db.serverDate()
      }
    })

    // 更新任务打卡天数
    const taskRes = await db.collection('tasks')
      .where({ _openid: openid, _id: taskId })
      .get()

    if (taskRes.data.length > 0) {
      const task = taskRes.data[0]
      const newCheckedDays = (task.checkedDays || 0) + 1
      const newStatus = newCheckedDays >= task.totalDays ? 'completed' : 'active'

      await db.collection('tasks')
        .where({ _openid: openid, _id: taskId })
        .update({
          data: {
            checkedDays: newCheckedDays,
            status: newStatus,
            updateTime: db.serverDate()
          }
        })
    }

    return { code: 0, data: { success: true } }
  } catch (err) {
    console.error('打卡失败:', err)
    return { code: -1, message: '打卡失败' }
  }
}

/**
 * 获取今日打卡记录
 */
async function getTodayCheckins(openid) {
  try {
    const today = formatDate(new Date())
    const res = await db.collection('checkins')
      .where({ _openid: openid, date: today })
      .get()
    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '获取打卡记录失败' }
  }
}

/**
 * 格式化日期 YYYY-MM-DD
 */
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
