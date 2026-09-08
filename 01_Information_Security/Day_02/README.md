# Day 02: Core Information Security Concepts & The CIA Triad

Welcome to Day 02 of **Cryptography and Data Protection** (Course Code: BCAR301). Today’s session focuses on foundational security architecture, the CIA Triad, quantitative risk estimation, and practical incident triage.

---

## 📁 Directory Structure

```text
Day_02/
├── 01_Notes/
│   └── information_security_notes.txt     # Deep-dive theory on CIA, Hexad, Defense-in-Depth, Risk
├── 02_Demos/
│   └── security_scenarios.txt             # 5 detailed real-world enterprise breach scenarios
├── 03_Python/
│   └── security_demo.py                   # Interactive Python simulator for CIA Triad & Risk Engine
├── 04_Activities/
│   ├── Activity_01_CIA.md                 # Case studies & threat modeling exercises
│   └── Activity_02_Security_Investigation.md # Hands-on forensic log & hash analysis activity
├── 05_Screenshots/
│   └── .gitkeep                           # Save your execution outputs and terminal captures here
└── 06_Assignment/
    └── Lab_01_Report.md                   # Formal submission report template for Lab 01
```

---

## 🚀 Quickstart: Running the Python Demonstration

The demo requires **Python 3.8+** and utilizes zero external dependencies:

```bash
# Run the interactive menu
python 03_Python/security_demo.py

# Or run all demonstrations in non-interactive mode
python 03_Python/security_demo.py --all
```

---

## 🎯 Learning Objectives

1. **Understand the CIA Triad**: Articulate how Confidentiality, Integrity, and Availability work together to protect assets.
2. **Explore Cryptographic Mechanisms**: Observe the 50% Avalanche Effect in SHA-256 and how HMAC prevents unauthorized tampering.
3. **Analyze Availability Controls**: Experience how token-bucket rate limiters neutralize DoS attacks without crashing application backends.
4. **Conduct Incident Triage**: Inspect simulated server logs, verify file hashes, and draft a response plan for a data breach incident.
