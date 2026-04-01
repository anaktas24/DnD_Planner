import { useEffect, useRef } from 'react'
import { subscribeCampaign, subscribePlayers, subscribeNotes, subscribeBlog, subscribeNotifications, claimWebhookSend } from '../lib/firestore'
import { useCampaignStore } from '../store/useCampaignStore'
import { format, parseISO } from 'date-fns'
import type { Campaign } from '../types'

const SLOT_HOURS: Record<string, string> = {
  Morning: '10:00',
  Afternoon: '14:00',
  Evening: '19:00',
}

async function sendDiscordWebhook(url: string, payload: object) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // silently fail — Discord webhook errors shouldn't break the app
  }
}

export function useFirestore() {
  const { setCampaign, setPlayers, setNotes, setBlogPosts, setNotifications } = useCampaignStore()

  const prevDateRef = useRef<string | null | undefined>(undefined)
  const prevTimeRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const unsubs = [
      subscribeCampaign((campaign: Campaign | null) => {
        if (!campaign) { setCampaign(null); return }
        const prevDate = prevDateRef.current
        const prevTime = prevTimeRef.current

        // Date just resolved (null → value)
        if (prevDate === null && campaign.nextSessionDate && campaign.discordWebhookUrl && !campaign.discordDateNotified) {
          claimWebhookSend('discordDateNotified').then((won) => {
            if (!won || !campaign.discordWebhookUrl) return
            const dateStr = format(parseISO(campaign.nextSessionDate!), 'EEEE, MMMM d')
            sendDiscordWebhook(campaign.discordWebhookUrl, {
              embeds: [{
                title: '📅 Session date confirmed!',
                description: `**${campaign.name}** — Session #${campaign.sessionCount}`,
                color: 0xf59e0b,
                fields: [
                  { name: '🗓️ Date', value: dateStr, inline: true },
                  { name: '⚔️ Status', value: 'Time voting is now open', inline: true },
                ],
                footer: { text: 'Vote for your preferred time slot in the planner!' },
              }],
            })
          })
        }

        // Time just resolved (null → value)
        if (prevTime === null && campaign.nextSessionTime && campaign.discordWebhookUrl && !campaign.discordTimeNotified) {
          claimWebhookSend('discordTimeNotified').then((won) => {
            if (!won || !campaign.discordWebhookUrl) return
            const dateStr = campaign.nextSessionDate
              ? format(parseISO(campaign.nextSessionDate), 'EEEE, MMMM d')
              : 'TBD'
            const timeStr = campaign.nextSessionTime!
            sendDiscordWebhook(campaign.discordWebhookUrl, {
              embeds: [{
                title: '⏰ Session time confirmed!',
                description: `**${campaign.name}** — Session #${campaign.sessionCount}`,
                color: 0x22c55e,
                fields: [
                  { name: '🗓️ Date', value: dateStr, inline: true },
                  { name: '🕐 Time', value: `${timeStr} (${SLOT_HOURS[timeStr]})`, inline: true },
                  ...(campaign.sessionLocation ? [{ name: '📍 Location', value: campaign.sessionLocation, inline: false }] : []),
                ],
                footer: { text: 'See you there, adventurers!' },
              }],
            })
          })
        }

        prevDateRef.current = campaign.nextSessionDate
        prevTimeRef.current = campaign.nextSessionTime
        setCampaign(campaign)
      }),
      subscribePlayers(setPlayers),
      subscribeNotes(setNotes),
      subscribeBlog(setBlogPosts),
      subscribeNotifications(setNotifications),
    ]
    return () => unsubs.forEach((u) => u())
  }, [setCampaign, setPlayers, setNotes, setBlogPosts, setNotifications])
}
