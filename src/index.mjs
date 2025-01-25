import { Window } from 'happy-dom'
import day from 'dayjs'
import dayTimezone from 'dayjs/plugin/timezone.js'
import dayUtc from 'dayjs/plugin/utc.js'

day.extend(dayTimezone)
day.extend(dayUtc)

function toId(url) {
  const num = url.match(/id(\d+)/)?.[1]
  return num ? Number(num) : null
}

const HIGHLIGHT_ID = 1535925293
const SELECTED_IDS = {
  1489932710: 'プロセカ',
  6443612521: 'スクフェス2 (SIF2) [EOS]',
  1494428618: 'あんスタ (ES)',
  1535925293: 'アイプラ',
  1195834442: 'バンドリ',
  1518532415: 'ハニプレ',
  1490381755: 'グルミク (D4DJ)',
  1016318735: 'デレステ (CGSS)',
  1377018522: 'スクスタ (LLAS) [EOS]',
  1568043783: 'サイスタ (SideM)',
  1255116464: 'リステップ',
  1238569156: 'ミリシタ (MLTD)',
  6447166623: 'ユメステ (WDS)',
  366956158: '太鼓 SP [EOS]',
  6444820275: '太鼓 RC',
  1663145118: 'プリパラ',
  1669389369: 'シャニソン (SfP)',
  763342319: 'ナナシス (t7s)',
}
const CHART_URL =
  'https://apps.apple.com/jp/charts/iphone/ミュージック-games/7011?chart=top-free'

async function update() {
  const html = await fetch(CHART_URL).then((x) => x.text())

  const window = new Window()
  const document = window.document
  document.body.innerHTML = html

  return [...document.querySelector('ol[role="feed"]').children].map(
    (elem, index) => ({
      rank: index + 1,
      title: elem.querySelector('.we-lockup__title').innerText.trim(),
      id: toId(elem.querySelector('a').href),
      url: elem.querySelector('a').href,
    })
  )
}

async function getText() {
  const series = await update()
  const date = day().tz('Asia/Tokyo')
  const ymdh = date.format('YYYY/MM/DD HH:mm')
  const result = [`🎵 App Store <a href="${CHART_URL}">日区免费音游排行</a> 🎮`]
  result.push(
    ...Object.keys(SELECTED_IDS)
      .map((id) => series.find((x) => x.id === Number(id)))
      .filter((x) => x !== undefined)
      .sort((a, b) => a.rank - b.rank)
      .map(
        (x) =>
          `${x.rank}位: <a href="${x.url}">${
            x.id === HIGHLIGHT_ID
              ? `<b>${SELECTED_IDS[x.id]}</b>`
              : SELECTED_IDS[x.id]
          }</a>`
      )
  )
  result.push(`更新时间：${ymdh}`)
  return result.join('\n')
}

async function sendMessage(botToken, chatId, text) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((x) => (x.status < 300 ? '' : x.text()))
    .then(console.log)
}

function precheck() {
  const botToken = getEnvOrFail('BOT_TOKEN')
  const chatId = getEnvOrFail('CHAT_ID')
  return { botToken, chatId }
}

function getEnvOrFail(name) {
  const v = process.env[name]
  if (v === undefined) {
    console.error(`Env not found: ${name}`)
    process.exit(1)
  }
  return v
}

;(async () => {
  const { botToken, chatId } = precheck()
  const text = await getText()
  console.log(text)
  await sendMessage(botToken, chatId, text)
})()
