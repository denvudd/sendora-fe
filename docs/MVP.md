# Sendora — MVP Product Description

> **AI-powered conversational sales & email marketing platform for modern businesses.**

## 🧭 Overview

Sendora is an AI-powered SaaS platform that unifies intelligent chatbots with automated email marketing to help businesses **capture, engage, and convert leads in real time**. It enables seamless customer interactions through customizable chat experiences, smart response flows, and integrated booking and payment systems — turning every conversation into a high-performing revenue opportunity.

## 🎯 Problem Statement

Businesses lose potential customers every day due to slow response times, fragmented tools, and disconnected sales pipelines. Managing live chat, appointment scheduling, payments, and email follow-ups across multiple platforms is costly, inefficient, and error-prone.

**Sendora solves this by bringing everything into one unified, AI-driven platform.**

## 💡 Solution

A single embeddable platform that deploys an AI sales representative on any website, qualifies leads through intelligent conversation, books appointments, processes payments, and automatically nurtures prospects with targeted email campaigns — all without manual intervention.

## ✨ Core Features (MVP Scope)

### 🤖 AI Sales Representative

- Fully automated AI chatbot that acts as a 24/7 sales agent
- Powered by **OpenAI** for natural, context-aware conversations
- Smart question linking to guide users through custom sales flows
- Seamless fallback to **real-time manual chat** when needed (via **Pusher**)

### 💻 Universal Website Integration

- Embed on any website with a single `<iframe>` snippet
- No complex setup — copy, paste, and go live instantly

### 📅 Booking & Payments

- Built-in **calendar widget** for appointment scheduling
- **Stripe integration** for secure, in-chat payment processing
- Automated booking confirmations and reminders

### ✉️ Email Marketing

- Simple campaign builder for creating and sending email sequences
- Triggered emails based on chat interactions and lead behavior
- Powered by **Nodemailer** for reliable delivery

### 💾 Lead Management

- Automatically saves visitor data as structured leads
- Tracks interaction history and engagement per contact
- Searchable and filterable lead database

### 💰 Financial Dashboard

- Overview of revenue, transactions, and payment history
- Stripe-connected earnings and payout tracking

### 🎨 Customization & White-Labeling

- Fully customizable chat interface (colors, branding, copy)
- **White-label** options for agencies and resellers
- Light / dark mode toggle for end users

### 🔐 Authentication & Security

- Custom login/signup flows with **OTP verification** via **Clerk**
- Secure file and image uploads powered by **Uploadcare**

### ❓ FAQ Module

- Embeddable FAQ section to deflect common questions
- Manageable from the dashboard without code changes

### ⚙️ Plan-Based Feature Control

- Feature gating by subscription plan
- Granular feature toggles managed via **Bun** settings
- Restrict or unlock capabilities based on user tier

## 🛠️ Tech Stack

| Layer                  | Technology                                    |
| ---------------------- | --------------------------------------------- |
| **Frontend / Backend** | Next.js 15 (fullstack, App Router)            |
| **Runtime**            | Bun                                           |
| **AI**                 | OpenAI API                                    |
| **Auth**               | Clerk (OTP, social login, session management) |
| **Database**           | Neon (serverless PostgreSQL)                  |
| **ORM**                | Prisma                                        |
| **Real-time**          | Pusher (live chat, notifications)             |
| **Payments**           | Stripe                                        |
| **File Uploads**       | Uploadcare                                    |
| **Email**              | Nodemailer                                    |
| **UI Components**      | Radix UI / Shadcn + Tailwind CSS              |
| **Hosting**            | Cloudways (or equivalent cloud provider)      |

## 👥 Target Audience

- **SMBs** looking to automate customer acquisition without a large sales team
- **Marketing agencies** seeking a white-label chat & email solution for clients
- **SaaS companies** wanting to reduce churn via proactive engagement
- **Service businesses** (coaches, clinics, consultants) needing automated booking + follow-up

## 📊 MVP Success Metrics

| Metric                           | Target (Month 3)       |
| -------------------------------- | ---------------------- |
| Paying customers                 | 50+                    |
| Chatbot conversations handled    | 10,000+                |
| Lead capture rate                | ≥ 30% of chat sessions |
| Email open rate                  | ≥ 25%                  |
| Appointments booked via platform | 500+                   |
| Churn rate                       | < 10% monthly          |

## 🗺️ MVP Scope — What's In / Out

### ✅ In Scope

- AI chatbot with smart flows and real-time fallback
- iframe embed for any website
- Stripe payments + calendar booking
- Basic email campaign management
- Lead capture and dashboard
- White-label and custom branding
- OTP authentication + file uploads
- Plan-based feature restrictions

### 🚫 Out of Scope (Post-MVP)

- Native mobile apps
- Multi-language AI support
- Advanced A/B testing for email campaigns
- CRM integrations (HubSpot, Salesforce)
- SMS/WhatsApp channel support

## 🚀 Go-to-Market Strategy

1. **Launch on Product Hunt** and indie hacker communities
2. **Agency partner program** leveraging white-label capabilities
3. **Freemium tier** with a limited chatbot + lead capture to drive organic signups
4. **Content marketing** around AI sales automation and conversion optimization
5. **Stripe-powered self-serve billing** for frictionless upgrades

## 💰 Monetization

Subscription-based SaaS with tiered plans:

| Plan        | Target User               | Key Limits                                    |
| ----------- | ------------------------- | --------------------------------------------- |
| **Starter** | Freelancers / Small sites | 1 chatbot, 500 leads/mo, basic email          |
| **Growth**  | Growing SMBs              | 5 chatbots, 5,000 leads/mo, campaigns         |
| **Pro**     | Agencies / Power users    | Unlimited bots, white-label, priority support |

_Built to turn every conversation into a conversion._
