// 登录云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 处理更新用户信息
  if (event.action === 'update') {
    try {
      const { childName, grade } = event.data
      await db.collection('users').where({ _openid: OPENID }).update({
        data: {
          childName,
          grade,
          updateTime: db.serverDate()
        }
      })
      return { code: 0, data: { success: true } }
    } catch (err) {
      // 如果update失败（记录不存在），则新增
      await db.collection('users').add({
        data: {
          _openid: OPENID,
          childName: event.data.childName || '',
          grade: event.data.grade || '',
          isPro: false,
          createTime: db.serverDate()
        }
      })
      return { code: 0, data: { success: true } }
    }
  }

  // 默认：登录/获取用户信息
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()

    if (userRes.data.length === 0) {
      // 新用户
      await db.collection('users').add({
        data: {
          _openid: OPENID,
          childName: '',
          grade: '',
          isPro: false,
          shareCount: 0,
          createTime: db.serverDate()
        }
      })
      return {
        code: 0,
        data: {
          openid: OPENID,
          isNewUser: true,
          isPro: false
        }
      }
    } else {
      // 老用户
      const user = userRes.data[0]
      return {
        code: 0,
        data: {
          openid: OPENID,
          isNewUser: false,
          isPro: user.isPro || false,
          childName: user.childName || '',
          grade: user.grade || ''
        }
      }
    }
  } catch (err) {
    console.error('登录失败:', err)
    return { code: -1, message: '登录失败' }
  }
}
