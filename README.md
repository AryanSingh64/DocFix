<h1 align="center" style="color:#155DFC;">DocFix</h1>



<p align="center">
  <strong>A modern PDF toolkit for compression, merging, and AI-powered summarization</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#folder-structure">Folder Structure</a>
</p>

---

## 📸 Screenshots

<!-- Add your screenshots here -->
<p align="center">
  <img src="docs/screenshot-home.png" alt="Home Page" width="700">
</p>

<p align="center">
  <img src="docs/screenshot-dashboard.png" alt="Dashboard" width="700">
</p>

---

## ✨ Features

- **PDF Compression** — Reduce PDF file sizes with multiple quality options
- **PDF Merge** — Combine multiple PDFs into a single document
- **AI Summarization** — Generate smart summaries using Google Gemini AI
- **User Dashboard** — Track usage and manage documents
- **Premium Tier** — Unlock advanced features with Stripe payments
- **Authentication** — Secure user authentication with Supabase
- **Encryption** — Secure file storage and transmission with end-to-end encryption

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe">
  <img src="https://img.shields.io/badge/Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion">
</p>

---

## 📁 Folder Structure

```
DocFix/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (compress, stripe, webhooks)
│   ├── auth/               # Authentication pages
│   ├── compress-pdf/       # PDF compression tool
│   ├── merge-pdf/          # PDF merge tool
│   ├── summarise/          # AI summarization tool
│   ├── dashboard/          # User dashboard
│   ├── upgrade/            # Premium upgrade page
│   └── layout.js           # Root layout
├── components/             # Reusable UI components
│   ├── Navbar.js
│   ├── Hero.js
│   ├── Sidebar.js
│   └── ui/                 # Base UI components
├── contexts/               # React context providers
├── lib/                    # Utility functions (Supabase client)
├── public/                 # Static assets
└── middleware.js           # Auth route protection
```

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- Google AI API key

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/docfix.git
   cd docfix
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   STRIPE_PRICE_ID=your_price_id

   GEMINI_API_KEY=your_google_ai_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aryansingh64">Aryan Singh</a>
</p>
