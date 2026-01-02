# OrbIIIT
A production-grade campus digital platform for secure academic workflows and real-time event automation.

---

## Overview

**OrbIIIT** is a campus-focused web application designed to digitize and automate critical student and administrative workflows.  
The platform emphasizes **security-first design**, **serverless compatibility**, and **real-world institutional usability**.

This repository submission highlights **two major features developed after December 1st** for the **TechSprint Hackathon**.

---

## 1. Student Leave Form – Secure PDF Generation & Download

### Overview

The **Student Leave Form** feature enables students to generate and download an **official institute-formatted leave application PDF** directly from the OrbIIIT platform.

The document is generated **on demand**, populated with **verified student data**, and delivered instantly to the user — without exposing templates, storing files, or relying on third-party document services.

This approach ensures the document is **secure**, **tamper-resistant**, and **institution-ready**.

---

### Key Capabilities

- One-click PDF generation
- Exact replica of the official institute leave form
- Dynamic data binding from Firebase
- No third-party document storage
- Zero server-side file persistence
- Fully compatible with Vercel deployments

---

### Workflow
User clicks “Download Leave Form”
↓
Student + Leave data fetched from Firebase
↓
HTML template populated with verified values
↓
PDF generated on demand
↓
PDF downloaded directly by the user

---

### Template Architecture

- Leave form layout authored as a static HTML template
- Template bundled at build time into the application
- Template is never exposed via public URLs
- Template is never stored in cloud storage
- Placeholders (e.g., {{STUDENT_NAME}}, {{FROM_DATE}}) are replaced dynamically at runtime

This ensures:

- No template leakage
- Consistent formatting across environments
- Immutable document structure

---

### Data Source & Integrity

- All student and leave data is fetched from **Firebase Firestore**
- Access enforced using strict Firestore Security Rules
- PDFs can only be generated for authenticated users
- Authorization enforced per leave record
- Embedded directly into the document:
  - Application ID
  - Student identity
  - Timestamps
  - Institutional disclaimers

---

### PDF Generation Strategy

- PDF generation occurs on demand
- No intermediate files stored on the server
- No external document services used
- Generated PDF is streamed directly to the browser

This guarantees:

- No storage quota issues
- No background cleanup jobs
- No long-lived backend artifacts

---

### Deployment Compatibility (Vercel)

- Fully compatible with Vercel’s serverless architecture
- Templates bundled during build
- No filesystem writes at runtime
- Identical behavior across local and production environments

---

### Security Summary

- Templates are not publicly accessible
- Authentication required
- Authorization enforced per leave record
- Approval state respected (faculty / warden)
- Generated PDFs include traceable identifiers

---

### Why This Design

| Requirement | Solution |
|------------|----------|
| Exact formatting | HTML-based template |
| Security | Build-time bundling |
| Scalability | Stateless PDF generation |
| Deployment safety | Vercel-native design |
| No cloud dependency | Direct client download |

---

## 2. Mess Event Attendance Automation (QR-Based)

### Overview

The **Mess Event Attendance Automation** feature digitizes the process of issuing and collecting mess tokens during special mess events such as festival dinners or celebrations.

The system replaces physical tokens with **QR codes**, **real-time validation**, and **role-based access control** to securely record attendance.

---

### Problem Statement

Traditional mess token distribution is:

- Time-consuming
- Prone to duplication and misuse
- Difficult to track accurately
- Inconvenient for students and staff

---

### Solution

OrbIIIT introduces a **QR-based, role-aware mess event system** where:

- Mess in-charges create events and generate QR codes
- Students scan QR codes during the event window
- Attendance is validated and recorded in real time

---

### Feature Workflow

#### 1. Role-Based Access

**Mess In-Charge (Admin)**  
- Identified via authenticated email  
- Can create, manage, and monitor mess events  
- Can view and share event-specific QR codes  

**Students**  
- Can only scan QR codes  
- Cannot create or modify events  

---

#### 2. Event Creation (Admin Only)

Admins define:
- Event name
- Event date
- Start time and end time

Upon creation:
- A unique QR code is generated
- Event data is stored securely in Firestore
- Event status updates automatically:
  - Upcoming
  - Live
  - Closed

---

#### 3. QR Code Scanning (Students)

- Students open the QR scanner from the Mess section
- Device camera activates via the browser
- Scanning allowed only during the event time window

---

#### 4. Real-Time Validation

Each scan verifies:
- QR code belongs to a valid event
- Event is currently live
- Student has not already attended

---

#### 5. Attendance Outcomes

| Scenario | Result |
|--------|--------|
| First valid scan | Attendance recorded with timestamp |
| Duplicate scan | “Already Attended” |
| Scan outside event time | “Event Not Active” |
| Invalid QR | “Invalid QR Code” |

Each valid attendance:
- Stores the student UID
- Uses a server-generated timestamp
- Safely increments the event’s attendance count

---

### Security & Integrity

- Fully enforced using Firestore Security Rules
- Only authenticated users can scan QR codes
- Only admins can create or delete events
- Attendance records are immutable
- Duplicate attendance is strictly prevented

---

### Technical Highlights

- Next.js (App Router)
- Firebase Authentication
- Firestore (real-time, rule-enforced storage)
- html5-qrcode for camera-based scanning
- Tailwind CSS + shadcn/ui
- Hydration-safe client rendering

---

### User Experience

- Mobile-first interface
- Full-screen QR scanner
- Clear success and error feedback
- Instant response without page reloads

---

### Impact

- Eliminates physical mess tokens
- Reduces queues and confusion
- Prevents misuse and duplicate entries
- Provides accurate, auditable attendance records
- Improves campus operational efficiency

---

## Tech Stack

- **Frontend:** Next.js (TypeScript), Tailwind CSS, shadcn/ui  
- **Backend / Services:** Firebase Authentication, Firestore  
- **Deployment:** Vercel (Serverless)

---

## Design Philosophy

OrbIIIT prioritizes:
- Security by default
- Stateless, scalable architectures
- Zero unnecessary data persistence
- Production-grade deployment compatibility

---

## Conclusion

These features demonstrate OrbIIIT’s ability to handle **real institutional workflows** using modern, secure, and scalable web architecture.

The project focuses on **practical adoption**, **operational reliability**, and **deployment realism**, making it suitable for real campus environments.
