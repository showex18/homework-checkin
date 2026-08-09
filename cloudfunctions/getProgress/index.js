// 进度统计云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 获取所有任务
    const tasksRes = await db.collection('tasks')
      .where({ _openid: OPENID })
      .get()

    const tasks = tasksRes.data

    // 获取所有打卡记录（最多1000条）
    const checkinsRes = await db.collection('checkins')
      .where({ _openid: OPENID })
      .orderBy('date', 'desc')
      .limit(1000)
      .get()

    const checkins = checkinsRes.data

    // 计算连续打卡天数
    const checkinDates = [...new Set(checkins.map(c => c.date))].sort().reverse()
    const streakDays = calcStreak(checkinDates)

    // 总进度
    const totalDays = tasks.reduce((sum, t) => sum + (t.totalDays || 0), 0)
    const checkedDays = tasks.reduce((sum, t) => sum + (t.checkedDays || 0), 0)
    const overallProgress = totalDays > 0 ? Math.round((checkedDays / totalDays) * 100) : 0

    // 按学科统计
    const subjectMap = {}
    tasks.forEach(t => {
      const subject = t.subject || '其他'
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          taskCount: 0,
          totalDays: 0,
          checkedDays: 0
        }
      }
      subjectMap[subject].taskCount++
      subjectMap[subject].totalDays += t.totalDays || 0
      subjectMap[subject].checkedDays += t.checkedDays || 0
    })

    const subjectStats = Object.values(subjectMap)

    return {
      code: 0,
      data: {
        streakDays,
        totalCheckins: checkins.length,
        checkinDates,
        overallProgress,
        subjectStats,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length
      }
    }
  } catch (err) {
    console.error('获取进度失败:', err)
    return { code: -1, message: '获取进度失败' }
  }
}

/**
 * 计算连续打卡天数
 */
function calcStreak(dates) {
  if (!dates || dates.length === 0) return 0

  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 86400000))
  const dateSet = new Set(dates)

  let streak = 0
  let checkDate = dateSet.has(today) ? today : (dateSet.has(yesterday) ? yesterday : null)

  if (!checkDate) return 0

  let current = new Date(checkDate)
  while (dateSet.has(formatDate(current))) {
    streak++
    current.setDate(current.getDate() - 1)
  }
  return streak
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
