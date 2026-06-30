# Kapruka Saama (සමා)

Trilingual AI gift concierge for the [Kapruka Agent Challenge](https://www.kapruka.com/contactUs/agentChallenge.html).

## Features

- Full-screen immersive chat UI
- Sinhala, Tanglish, and English support
- Rich product carousels from live Kapruka catalog
- Multi-item cart with checkout flow
- All 7 Kapruka MCP tools integrated
- End-to-end: discovery → delivery check → guest checkout pay link

## Quick start

```bash
npm install
cp .env.example .env
# Add your NINEROUTER_API_KEY from 9Router dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add `NINEROUTER_API_KEY` environment variable
4. Deploy — your public URL is ready for judges

## MCP

Connects to `https://mcp.kapruka.com/mcp` (Streamable HTTP, no auth).

## Demo script for judges

1. Click "Birthday" occasion chip
2. Ask in Tanglish: "Amma birthday ekata cake ekak, Colombo, budget 5000"
3. Browse product carousel, add items to cart
4. Click "Proceed to Checkout" — Saama collects delivery details
5. Receive click-to-pay link from Kapruka MCP