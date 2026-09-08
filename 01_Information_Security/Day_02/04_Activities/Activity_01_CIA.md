# Activity 01: The CIA Triad in Practice — Case Studies & Threat Analysis

**Course**: Cryptography & Data Protection  
**Module**: 01 — Information Security  
**Session**: Day 02 Hands-on Activity  
**Estimated Time**: 45 Minutes  

---

## 🎯 Learning Objectives

By completing this activity, you will be able to:
1. Dissect real-world security incidents and identify the primary and secondary CIA pillars compromised.
2. Evaluate threat vectors, attack mechanisms, and root causes across enterprise environments.
3. Formulate layered cryptographic and architectural defenses to satisfy the CIA Triad.

---

## 📋 Instructions

Analyze each of the four enterprise case scenarios provided below. For each scenario:
1. Identify which pillar (**Confidentiality**, **Integrity**, or **Availability**) was primarily breached.
2. Identify the **Threat Actor** profile (e.g., Insider, Nation-State, Cybercriminal, Script Kiddie).
3. Specify the **Technical Root Cause**.
4. Recommend **Two Defense Controls** (one cryptographic and one architectural).

---

## 🔍 Case Scenarios

### Scenario A: The Smart Meter Grid Manipulation
> An industrial energy corporation deployed 20,000 IoT smart electric meters across a metropolitan area. The meters transmit consumption readings every 15 minutes to the central billing server over an unencrypted cellular APN. A hacker group discovered that by transmitting spoofed UDP packets with altered kilowatt-hour fields, they could trick the utility billing engine into recording zero consumption for selected commercial subscribers.

| Analysis Dimension | Student Response |
| :--- | :--- |
| **Primary CIA Pillar Breached** | `[ Fill here ]` |
| **Secondary Pillar Impacted** | `[ Fill here ]` |
| **Threat Actor Category** | `[ Fill here ]` |
| **Vulnerability Exploited** | `[ Fill here ]` |
| **Cryptographic Countermeasure** | `[ Fill here (e.g. HMAC-SHA256, mTLS, ECDSA) ]` |
| **Architectural Countermeasure** | `[ Fill here (e.g. Anomaly Detection, Private APN) ]` |

---

### Scenario B: Cloud Storage Data Leak
> A fintech startup stored customer KYC documents (passports, national identity cards, bank statements) in an AWS S3 bucket. A newly hired junior engineer modified the bucket ACL to `public-read` to troubleshoot an image preview bug in the staging web application, forgetting to revert the permission. An automated search engine (Grayhat Warfare) indexed the bucket, allowing anyone to download unencrypted identity documents.

| Analysis Dimension | Student Response |
| :--- | :--- |
| **Primary CIA Pillar Breached** | `[ Fill here ]` |
| **Threat Actor Category** | `[ Fill here ]` |
| **Vulnerability Exploited** | `[ Fill here ]` |
| **Cryptographic Countermeasure** | `[ Fill here (e.g. Client-Side AES-256 Envelope Encryption) ]` |
| **Architectural Countermeasure** | `[ Fill here (e.g. AWS SCP S3 Block Public Access, CI/CD Linter) ]` |

---

### Scenario C: Ransomware Lockdown of Regional Hospital
> A hospital's radiology PACS server was infected with BlackCat ransomware via a spear-phishing email containing an infected Microsoft Word macro. The malware encrypted the hospital’s patient imaging archives with AES-256, deleted Volume Shadow Copies, and demanded $2,000,000 in cryptocurrency. Emergency surgeries were delayed by 18 hours until paper records could be located.

| Analysis Dimension | Student Response |
| :--- | :--- |
| **Primary CIA Pillar Breached** | `[ Fill here ]` |
| **Secondary Pillar Impacted** | `[ Fill here ]` |
| **Threat Actor Category** | `[ Fill here ]` |
| **Vulnerability Exploited** | `[ Fill here ]` |
| **Cryptographic Countermeasure** | `[ Fill here ]` |
| **Architectural Countermeasure** | `[ Fill here (e.g. 3-2-1 Immutable Air-Gapped Backups, Zero Trust EDR) ]` |

---

### Scenario D: Academic Transcript Tampering
> A university database administrator with direct access to the MySQL production database modified their sibling's GPA from 2.4 to 3.9 in the student information table. Because direct database queries (`UPDATE students SET gpa = 3.9 WHERE id = 1042;`) were executed through a shared root account, the application-level audit log contained no record of the change.

| Analysis Dimension | Student Response |
| :--- | :--- |
| **Primary CIA Pillar Breached** | `[ Fill here ]` |
| **Threat Actor Category** | `[ Fill here ]` |
| **Vulnerability Exploited** | `[ Fill here ]` |
| **Cryptographic Countermeasure** | `[ Fill here (e.g. Cryptographic Merkle Tree / Immutable Audit Hash Chain) ]` |
| **Architectural Countermeasure** | `[ Fill here (e.g. Separation of Duties, Database Privileged Access Management) ]` |

---

## 💡 Synthesis & Discussion Questions

1. **Trade-offs**: Explain a scenario where increasing **Confidentiality** (e.g., intensive encryption and decryption handshakes) can negatively degrade **Availability**.
2. **The Parkerian Hexad**: In Scenario B, if the documents were heavily encrypted with AES-GCM but the adversary stole the physical USB containing the ciphertext and destroyed it, which attribute of the Parkerian Hexad was lost without losing Confidentiality?
3. **Defense-in-Depth**: Why is cryptographic encryption alone insufficient to guarantee the Integrity and Availability of a cloud database?
