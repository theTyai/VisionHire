<div align="center">

# VisionHire

### Assess. Rank. Recruit.

<p>
  A scalable MERN stack online assessment and recruitment platform engineered for high-concurrency MCQ-based hiring assessments and end-to-end recruitment pipelines. Built specifically for technical communities like VISION CSE.
</p>

<br/>

<img src="https://img.shields.io/badge/MERN-FullStack-green?style=for-the-badge" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-success?style=for-the-badge" />
<img src="https://img.shields.io/badge/Redis-Queue-red?style=for-the-badge" />
<img src="https://img.shields.io/badge/Socket.IO-Realtime-black?style=for-the-badge" />
<img src="https://img.shields.io/badge/System%20Design-Scalable-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" />

<br/>
<br/>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0D6F56,100:F2A900&height=180&section=header&text=VisionHire&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35"/>

</div>

---

# Overview

VisionHire is a production-oriented online assessment and recruitment platform designed using scalable system design principles to support concurrent MCQ-based hiring assessments and manage thousands of applicants across multiple recruitment phases.

The platform is built to handle **200–300 concurrent candidates** with:
- fault-tolerant autosave architecture
- queue-based submissions
- real-time monitoring
- anti-cheat systems
- scalable MongoDB Atlas integration

Inspired by modern hiring platforms like HackerRank, Mettl, and CodeSignal, but tailored for student-led technical communities.

---

# Core Features

## 1. Recruitment Pipeline & Phase Management
- **Public Application Portal:** A beautifully designed, modern glassmorphism landing page and application form to collect candidate details (Branch, Section, Domains, Email, Scholar No).
- **Global Phase Toggles:** Admins can securely toggle phases on/off globally:
  - **Accept Applications Phase:** Enable/Disable the public recruitment form.
  - **Online Assessment (OA) Phase:** Enable/Disable the ability for candidates to register for the test.
- **Strict Identity Enforcement:** During the OA phase, candidates are restricted from signing up unless they use the exact email address registered during the application phase.
- **Admin Application CRM:** A robust data table to search, filter, shortlist/reject candidates, and instantly export data to CSV.

## 2. Candidate Assessment Features
- Secure Authentication
- Resume Upload
- MCQ Assessment Engine
- Real-Time Autosave
- Question Palette Navigation
- Mark For Review
- Server-Side Timer
- Auto Submission
- Result Dashboard
- Responsive UI & Dark Mode

## 3. Admin Assessment Features
- Create Assessments & Sets
- Manage Questions (Markdown support)
- CSV Bulk Upload for Questions
- Live Candidate Monitoring (via WebSockets)
- Analytics Dashboard
- Leaderboards
- Candidate Shortlisting based on scores
- Result Export

---

# System Design

## Autosave Architecture

```text
Candidate Action
        ↓
Autosave API
        ↓
MongoDB Atlas
```

## Anti-Cheat Mechanisms
- Full-screen enforcement
- Tab-switch detection (Violation logging)
- Copy-paste prevention
- Secure, token-based API access
- Server-authoritative timer (prevents client-side manipulation)

---

# Tech Stack

**Frontend:** React, Redux Toolkit, React Router, Tailwind CSS, Framer Motion, Lucide Icons, Vite
**Backend:** Node.js, Express.js, MongoDB (Mongoose), Redis, Socket.io
**Security:** JWT, Bcrypt, Helmet, Express Rate Limit, CORS

---

# Installation & Setup

1. Clone the repository.
2. Ensure you have MongoDB and Redis installed and running locally.
3. In `/backend`: run `npm install`, set up your `.env` file, and run `npm run dev`.
4. In `/frontend`: run `npm install`, set up your `.env` file, and run `npm run dev`.
5. Access the application at `http://localhost:5173`.
