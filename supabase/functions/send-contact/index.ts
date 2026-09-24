import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { email, message } = await req.json()
    if (!email || !message || message.length > 5000) return new Response(JSON.stringify({ error: 'Enter a valid email and message.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    const apiKey = Deno.env.get('RESEND_API_KEY')
    const receiver = Deno.env.get('CONTACT_RECEIVER_EMAIL')
    const sender = Deno.env.get('CONTACT_SENDER_EMAIL')
    if (!apiKey || !receiver || !sender) throw new Error(`Missing configured secret(s): ${[!apiKey && 'RESEND_API_KEY', !receiver && 'CONTACT_RECEIVER_EMAIL', !sender && 'CONTACT_SENDER_EMAIL'].filter(Boolean).join(', ')}`)
    const resend = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: sender, to: [receiver], reply_to: email, subject: `New website message from ${email}`, text: message }) })
    if (!resend.ok) throw new Error('Resend could not deliver the message.')
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }) }
})
