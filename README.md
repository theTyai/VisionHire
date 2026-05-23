<div align="center">

# VisionHire

### Assess. Rank. Recruit.

<p>
  A scalable MERN stack online assessment and recruitment platform engineered for high-concurrency MCQ-based hiring assessments.
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

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:4F46E5,100:06B6D4&height=180&section=header&text=VisionHire&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35"/>

</div>

---

# Overview

VisionHire is a production-oriented online assessment and recruitment platform designed using scalable system design principles to support concurrent MCQ-based hiring assessments.

The platform is built to handle **200–300 concurrent candidates** with:
- fault-tolerant autosave architecture
- queue-based submissions
- real-time monitoring
- anti-cheat systems
- scalable MongoDB Atlas integration

Inspired by modern hiring platforms like HackerRank, Mettl, and CodeSignal.

---

# Features

## Candidate Features

- Secure Authentication
- Resume Upload
- MCQ Assessment Engine
- Real-Time Autosave
- Question Palette Navigation
- Mark For Review
- Server-Side Timer
- Auto Submission
- Result Dashboard
- Responsive UI
- Dark Mode

---

## Admin Features

- Create Assessments
- Manage Questions
- CSV Bulk Upload
- Live Candidate Monitoring
- Analytics Dashboard
- Leaderboards
- Candidate Shortlisting
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
