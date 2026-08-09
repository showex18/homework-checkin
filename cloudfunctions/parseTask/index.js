// AI解析作业通知云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 通义千问VL API配置
// 请替换为你的阿里云DashScope API Key
const DASHSCOPE_API_KEY = 'your-api-key'
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

// AI解析prompt
const PARSE_PROMPT = `你是一个作业通知解析助手。请仔细分析这张图片中的暑假作业通知单/清单内容。

请将识别到的作业任务提取为JSON数组格式，每个任务包含以下字段：
- title: 任务名称（简洁明确，如"暑假生活语文部分"、"口算练习"、"英语抄写"等）
- subject: 学科分类（必须是以下之一：语文、数学、英语、科学、物理、化学、生物、其他）
- description: 任务详细描述（如有具体要求，如页码范围、篇数等）
- totalDays: 预计需要完成的天数（整数，如每天打卡则为30，如一次性完成则为1）

请严格按以下JSON格式返回（不要包含其他文字）：
[{"title":"任务名","subject":"学科","description":"描述","totalDays":30}]

注意：
1. 如果图片不是作业通知或无法识别，返回空数组 []
2. 合并同类任务（如"抄写第一课生词"和"抄写第二课生词"可合并为"抄写课文生词"）
3. totalDays根据任务量和暑假天数合理估算
4. 只返回JSON，不要有任何额外说明文字`

exports.main = async (event, context) => {
  const { fileID } = event
  const { OPENID } = cloud.getWXContext()

  if (!fileID) {
    return { code: -1, message: '缺少图片文件' }
  }

  try {
    // 1. 下载图片
    const fileRes = await cloud.downloadFile({ fileID })
    const imageBuffer = fileRes.fileContent
    const base64Image = imageBuffer.toString('base64')

    // 2. 调用通义千问VL API
    const tasks = await callQwenVL(base64Image)

    if (!tasks || tasks.length === 0) {
      return { code: -1, message: '未能识别到作业内容，请重新拍照' }
    }

    // 3. 返回解析结果（前端确认后再保存）
    return {
      code: 0,
      data: tasks
    }
  } catch (err) {
    console.error('AI解析失败:', err)
    return {
      code: -1,
      message: err.message || 'AI解析失败，请重试'
    }
  }
}

/**
 * 调用通义千问VL API
 */
async function callQwenVL(base64Image) {
  const https = require('https')
  const url = new URL(DASHSCOPE_API_URL)

  const requestBody = JSON.stringify({
    model: 'qwen-vl-plus',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            { image: `data:image/jpeg;base64,${base64Image}` },
            { text: PARSE_PROMPT }
          ]
        }
      ]
    },
    parameters: {
      result_format: 'text',
      temperature: 0.1,
      max_tokens: 2000
    }
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.code) {
            reject(new Error(result.message || 'API调用失败'))
            return
          }

          // 提取文本内容
          const text = result.output?.text || result.output?.choices?.[0]?.message?.content || ''

          // 解析JSON
          const jsonStr = extractJSON(text)
          if (!jsonStr) {
            reject(new Error('AI返回格式异常'))
            return
          }

          const tasks = JSON.parse(jsonStr)
          resolve(tasks)
        } catch (err) {
          reject(new Error('解析AI返回结果失败: ' + err.message))
        }
      })
    })

    req.on('error', (err) => {
      reject(new Error('网络请求失败: ' + err.message))
    })

    req.write(requestBody)
    req.end()
  })
}

/**
 * 从文本中提取JSON数组
 */
function extractJSON(text) {
  // 尝试直接解析
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return text
  } catch (e) {
    // 继续尝试其他方式
  }

  // 尝试提取JSON数组
  const match = text.match(/\[[\s\S]*\]/)
  if (match) {
    return match[0]
  }

  return null
}
