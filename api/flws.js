import fetch from "node-fetch"

async function fetchwttm(url, options = {}, timeout = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(url, { ...options, signal: controller.signal })
  clearTimeout(timer)
  return response
}

export default async function handler(req, res) {
  const playerid = req.query.playerid || req.query.playerId
  if (!playerid) {
    return res.status(400).json({ error: "playerid is required" })
  }

  const myid = "4493266990"

  try {
    const isfollowed = await checkfollow(playerid, myid)
    return res.status(200).json({ follows: isfollowed })
  } catch (err) {
    console.error("error fetching follow info:", err)
    return res.status(500).json({ error: "unable to contact roblox api" })
  }
}

async function checkfollow(usera, userb) {
  const limit = 100
  let cursor = null

  while (true) {
    const url =
      `https://friends.roblox.com/v1/users/${usera}/followings?limit=${limit}` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "")
    const response = await fetchwttm(url, {
      headers: { "user-agent": "roblox-follow-checker" },
    })

    if (!response.ok) {
      throw new Error(`roblox api returned ${response.status}`)
    }

    const data = await response.json()
    if (data.data && data.data.some(u => String(u.id) === String(userb))) {
      return true
    }

    if (!data.nextPageCursor) break
    cursor = data.nextPageCursor
  }

  return false
}
