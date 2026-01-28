# 📚 DocFix Learning Roadmap

A complete guide showing how all files connect and the recommended learning path.

---

## 🗺️ High-Level Architecture

```mermaid
graph TB
    subgraph "🌐 Entry Point"
        A[layout.js] --> B[page.js]
    end
    
    subgraph "🔐 Auth Layer"
        C[middleware.js]
        D[AuthContext.js]
        E[supabase.js]
    end
    
    subgraph "📄 Pages"
        F["/ Home"]
        G["/auth"]
        H["/dashboard"]
        I["/compress-pdf"]
        J["/summarise"]
        K["/upgrade"]
    end
    
    subgraph "🧩 Components"
        L[Navbar.js]
        M[Hero.js]
        N[ToolsSection.js]
        O[AuthForm.js]
        P[Sidebar.js]
    end
    
    subgraph "⚡ API Routes"
        R[api/compress-pdf]
        S[api/summarise-pdf]
        T[api/checkout]
        U[api/webhook]
    end
    
    A --> C
    D --> E
    C --> E
```

---

## 📖 Learning Order (4 Phases)

```mermaid
graph LR
    subgraph "Phase 1: Foundation"
        A1["1️⃣ lib/supabase.js"] --> A2["2️⃣ contexts/AuthContext.js"]
    end
    
    subgraph "Phase 2: Core"
        B1["3️⃣ app/layout.js"] --> B2["4️⃣ middleware.js"]
    end
    
    subgraph "Phase 3: UI"
        C1["5️⃣ app/page.js"] --> C2["6️⃣ Components"]
    end
    
    subgraph "Phase 4: Features"
        D1["7️⃣ API Routes"] --> D2["8️⃣ Feature Pages"]
    end
    
    A2 --> B1
    B2 --> C1
    C2 --> D1
```

---

## 🔍 Phase 1: Database & Auth Foundation

| Order | File | Purpose | Key Concepts |
|:-----:|------|---------|--------------|
| 1️⃣ | `lib/supabase.js` | Database client | `createClient`, cookies, PKCE |
| 2️⃣ | `contexts/AuthContext.js` | Global auth state | React Context, `useAuth` hook |

```mermaid
flowchart LR
    A[supabase.js] -->|"exports client"| B[AuthContext.js]
    B -->|"provides useAuth"| C[Any Component]
```

---

## 🔍 Phase 2: App Core Structure

| Order | File | Purpose |
|:-----:|------|---------|
| 3️⃣ | `app/layout.js` | Root wrapper with AuthProvider |
| 4️⃣ | `middleware.js` | Route protection & redirects |

```mermaid
flowchart TB
    A["middleware.js"] -->|"Intercepts requests"| B{"Logged in?"}
    B -->|"Yes + /auth"| C["→ /dashboard"]
    B -->|"No + /dashboard"| D["→ /auth"]
    B -->|"Otherwise"| E["Continue"]
```

---

## 🔍 Phase 3: Pages & Components

| Order | File | Used In |
|:-----:|------|---------|
| 5️⃣ | `app/page.js` | Home `/` |
| 6️⃣ | `Navbar.js` | All pages |
| 7️⃣ | `Hero.js` | Home |
| 8️⃣ | `ToolsSection.js` | Home |
| 9️⃣ | `AuthForm.js` | Auth page |
| 🔟 | `Sidebar.js` | Dashboard |

```mermaid
flowchart TB
    subgraph "Home /"
        A[page.js] --> B[Navbar]
        A --> C[Hero]
        A --> D[ToolsSection]
    end
    
    subgraph "Auth /auth"
        E[auth/page.js] --> F[AuthForm]
    end
    
    subgraph "Dashboard"
        H[dashboard/page.js] --> I[Sidebar]
    end
```

---

## 🔍 Phase 4: API & Features

| File | Purpose |
|------|---------|
| `api/compress-pdf` | PDF compression |
| `api/summarise-pdf` | AI summarization |
| `api/checkout` | Stripe payment |
| `api/webhook` | Payment confirmation |

```mermaid
flowchart LR
    A["Feature Page"] -->|"POST"| B["API Route"]
    B -->|"Process"| C["External Service"]
    C -->|"Response"| A
```

---

## 🔗 Complete Request Flow

```mermaid
flowchart TB
    A[Browser] --> B[middleware.js]
    B --> C{Protected?}
    C -->|Yes| D{Session?}
    D -->|No| E[→ /auth]
    D -->|Yes| F[Continue]
    C -->|No| F
    F --> G[layout.js + AuthProvider]
    G --> H[Page + Components]
    H -->|"API calls"| I[API Routes]
```

---

## 📁 Directory Structure

```
DocFix/
├── app/
│   ├── layout.js          ← START HERE
│   ├── page.js            ← Home page
│   ├── auth/page.js       ← Login/Signup
│   ├── dashboard/page.js  ← User dashboard
│   ├── compress-pdf/      ← PDF tool
│   ├── summarise/         ← AI summary
│   ├── upgrade/           ← Premium
│   └── api/               ← Backend
│
├── components/            ← UI components
├── contexts/AuthContext.js ← Auth state
├── lib/supabase.js        ← DB client
└── middleware.js          ← Route guard
```

---

## ✅ Learning Checklist

- [ ] Phase 1: `supabase.js` → `AuthContext.js`
- [ ] Phase 2: `layout.js` → `middleware.js`
- [ ] Phase 3: `page.js` → Components
- [ ] Phase 4: API routes → Feature pages
