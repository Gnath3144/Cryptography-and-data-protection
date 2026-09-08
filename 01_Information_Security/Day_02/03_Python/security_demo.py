#!/usr/bin/env python3
"""
================================================================================
CRYPTOGRAPHY AND DATA PROTECTION — DAY 02 HANDS-ON LAB
COURSE MODULE: 01_Information_Security
FILE: 03_Python/security_demo.py

DESCRIPTION:
An interactive simulator demonstrating the CIA Triad (Confidentiality, Integrity, 
Availability), the Cryptographic Avalanche Effect, and Quantitative Risk Scoring.
Requires: Python 3.8+ (Zero external pip dependencies).
================================================================================
"""

import sys
import os
import time
import json
import hmac
import hashlib
import secrets
import argparse
from typing import Tuple, Dict, List

# ANSI Terminal Styling for Rich CLI Output
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(title: str) -> None:
    width = 76
    print(f"\n{CYAN}{'=' * width}{RESET}")
    print(f"{BOLD}{title.center(width)}{RESET}")
    print(f"{CYAN}{'=' * width}{RESET}\n")


# ==============================================================================
# 1. CONFIDENTIALITY DEMO: Plaintext Exposure vs Stream Encryption
# ==============================================================================
def demo_confidentiality(message: str = "CONFIDENTIAL: Student Exam Marks: 98/100") -> None:
    print_banner("1. CONFIDENTIALITY DEMONSTRATION")
    print(f"{BOLD}Concept:{RESET} Ensuring data is shielded from unauthorized eavesdropping.\n")
    
    # Generate 256-bit cryptographic key
    key = secrets.token_bytes(32)
    nonce = secrets.token_bytes(16)
    
    # Simulated Stream Cipher (ChaCha20-style XOR keystream generated from SHA-256 PRF)
    def generate_keystream(k: bytes, n: bytes, length: int) -> bytes:
        keystream = bytearray()
        counter = 0
        while len(keystream) < length:
            block = hashlib.sha256(k + n + counter.to_bytes(4, 'big')).digest()
            keystream.extend(block)
            counter += 1
        return bytes(keystream[:length])

    plaintext_bytes = message.encode('utf-8')
    keystream = generate_keystream(key, nonce, len(plaintext_bytes))
    ciphertext = bytes([p ^ k for p, k in zip(plaintext_bytes, keystream)])
    
    # Decryption
    decrypted = bytes([c ^ k for c, k in zip(ciphertext, keystream)]).decode('utf-8')

    print(f"[{YELLOW}Plaintext Message{RESET}]:  {message}")
    print(f"[{CYAN}Eavesdropper Intercept (Unencrypted){RESET}]: Cleartext visible to packet sniffer!")
    print(f"[{GREEN}256-bit Secret Key{RESET}]: {key.hex()}")
    print(f"[{GREEN}Cryptographic Nonce{RESET}]: {nonce.hex()}")
    print(f"[{RED}Encrypted Ciphertext (Hex){RESET}]: {ciphertext.hex()}")
    print(f"[{CYAN}Eavesdropper Intercept (Encrypted){RESET}]: Indistinguishable from pure random noise.")
    print(f"[{GREEN}Authorized Decrypted Text{RESET}]:  {decrypted}")
    print(f"\n{BOLD}Result:{RESET} Confidentiality successfully preserved via cryptographic encryption.")


# ==============================================================================
# 2. INTEGRITY DEMO: Cryptographic Hash & The Avalanche Effect
# ==============================================================================
def demo_integrity() -> None:
    print_banner("2. INTEGRITY & AVALANCHE EFFECT DEMONSTRATION")
    print(f"{BOLD}Concept:{RESET} Ensuring information cannot be tampered with in transit without immediate detection.\n")

    original_tx = "TRANSFER: Account #912048 to Account #339182 Amount: $10,000.00"
    # Subtle 1-character modification ($10,000.00 -> $90,000.00)
    tampered_tx = "TRANSFER: Account #912048 to Account #339182 Amount: $90,000.00"

    hash_orig = hashlib.sha256(original_tx.encode('utf-8')).hexdigest()
    hash_tamp = hashlib.sha256(tampered_tx.encode('utf-8')).hexdigest()

    # Calculate Bit Difference (Avalanche Effect)
    bin_orig = bin(int(hash_orig, 16))[2:].zfill(256)
    bin_tamp = bin(int(hash_tamp, 16))[2:].zfill(256)
    bits_flipped = sum(b1 != b2 for b1, b2 in zip(bin_orig, bin_tamp))
    avalanche_pct = (bits_flipped / 256.0) * 100.0

    print(f"[{GREEN}Original Transaction{RESET}]:  {original_tx}")
    print(f"[{GREEN}SHA-256 Original Hash{RESET}]: {hash_orig}\n")
    print(f"[{RED}Tampered Transaction{RESET}]:  {tampered_tx}")
    print(f"[{RED}SHA-256 Tampered Hash{RESET}]: {hash_tamp}\n")
    print(f"[{YELLOW}Avalanche Effect Metric{RESET}]: {bits_flipped}/256 bits flipped ({avalanche_pct:.2f}% divergence) from changing just 1 character!")

    # Message Authentication Code (HMAC-SHA256) demonstration
    secret_key = b"BankCorporateGatewaySecretKey2026!"
    valid_mac = hmac.new(secret_key, original_tx.encode('utf-8'), hashlib.sha256).hexdigest()
    
    # Attacker tries to submit tampered message with original MAC
    is_valid_orig = hmac.compare_digest(
        valid_mac, 
        hmac.new(secret_key, original_tx.encode('utf-8'), hashlib.sha256).hexdigest()
    )
    is_valid_tamp = hmac.compare_digest(
        valid_mac, 
        hmac.new(secret_key, tampered_tx.encode('utf-8'), hashlib.sha256).hexdigest()
    )

    print(f"\n{BOLD}HMAC Verification Check:{RESET}")
    print(f"  • Original Payload Signature Valid?  --> {GREEN}{is_valid_orig} (ACCEPTED){RESET}")
    print(f"  • Tampered Payload Signature Valid?  --> {RED}{is_valid_tamp} (REJECTED / TAMPERING DETECTED!){RESET}")


# ==============================================================================
# 3. AVAILABILITY DEMO: DoS Attack vs Token-Bucket Rate Limiter
# ==============================================================================
class TokenBucketLimiter:
    def __init__(self, capacity: int = 10, refill_rate: float = 2.0):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate
        self.last_update = time.time()

    def allow_request(self) -> bool:
        now = time.time()
        elapsed = now - self.last_update
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_update = now

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False


def demo_availability() -> None:
    print_banner("3. AVAILABILITY & DOS MITIGATION DEMONSTRATION")
    print(f"{BOLD}Concept:{RESET} Ensuring services remain online and responsive under adversarial traffic floods.\n")

    limiter = TokenBucketLimiter(capacity=8, refill_rate=4.0)
    
    print(f"Simulating 25 rapid-fire HTTP requests within 100 milliseconds...")
    print(f"{'Request #':<12}{'Traffic Type':<20}{'Status':<15}{'Server Action'}")
    print("-" * 65)

    accepted = 0
    blocked = 0

    for i in range(1, 26):
        is_botnet = i > 6
        traffic_type = f"{RED}Botnet Flood{RESET}" if is_botnet else f"{GREEN}Legitimate User{RESET}"
        
        if limiter.allow_request():
            accepted += 1
            status = f"{GREEN}200 OK{RESET}"
            action = "Served by Application Server"
        else:
            blocked += 1
            status = f"{RED}429 Too Many{RESET}"
            action = "Dropped by Edge Rate-Limiter"

        print(f"Req #{i:<7} {traffic_type:<29} {status:<24} {action}")
        time.sleep(0.01)

    print("-" * 65)
    print(f"Summary: {GREEN}{accepted} Accepted{RESET}, {RED}{blocked} Blocked/Mitigated{RESET}")
    print(f"{BOLD}Conclusion:{RESET} Rate-limiting preserved server availability without CPU exhaustion.")


# ==============================================================================
# 4. QUANTITATIVE RISK CALCULATOR: Risk = Threat × Vulnerability × Impact
# ==============================================================================
def demo_risk_calculator() -> None:
    print_banner("4. QUANTITATIVE RISK SCORING ENGINE")
    print("Formula: Risk Score (1-125) = Threat Likelihood (1-5) × Vulnerability Severity (1-5) × Business Impact (1-5)\n")

    scenarios = [
        {
            "name": "Unencrypted Database Backup on Public S3",
            "threat": 5, "vuln": 5, "impact": 5,
            "category": "Confidentiality"
        },
        {
            "name": "DNS Amplification DDoS during Exam",
            "threat": 4, "vuln": 4, "impact": 4,
            "category": "Availability"
        },
        {
            "name": "Man-in-the-Middle on Internal Wire API",
            "threat": 2, "vuln": 4, "impact": 5,
            "category": "Integrity"
        },
        {
            "name": "Physical Theft of BitLocker-Encrypted Laptop",
            "threat": 3, "vuln": 1, "impact": 2,
            "category": "Possession (Low Risk)"
        }
    ]

    print(f"{'Scenario Name':<42}{'Threat':<8}{'Vuln':<8}{'Impact':<8}{'Score':<8}{'Risk Level'}")
    print("-" * 84)

    for sc in scenarios:
        score = sc["threat"] * sc["vuln"] * sc["impact"]
        if score >= 60:
            level = f"{RED}CRITICAL{RESET}"
        elif score >= 30:
            level = f"{YELLOW}HIGH{RESET}"
        elif score >= 15:
            level = f"{CYAN}MEDIUM{RESET}"
        else:
            level = f"{GREEN}LOW{RESET}"

        print(f"{sc['name']:<42}{sc['threat']:<8}{sc['vuln']:<8}{sc['impact']:<8}{score:<8}{level}")

    print("-" * 84)


# ==============================================================================
# MAIN ENTRY POINT
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="Day 02 Information Security Interactive Simulator")
    parser.add_argument("--all", action="store_true", help="Run all CIA demonstrations sequentially")
    parser.add_argument("--confidentiality", action="store_true", help="Run Confidentiality demo")
    parser.add_argument("--integrity", action="store_true", help="Run Integrity & Avalanche demo")
    parser.add_argument("--availability", action="store_true", help="Run Availability & DoS demo")
    parser.add_argument("--risk", action="store_true", help="Run Risk Calculator demo")
    args = parser.parse_args()

    if args.all:
        demo_confidentiality()
        demo_integrity()
        demo_availability()
        demo_risk_calculator()
        return

    if args.confidentiality:
        demo_confidentiality()
        return

    if args.integrity:
        demo_integrity()
        return

    if args.availability:
        demo_availability()
        return

    if args.risk:
        demo_risk_calculator()
        return

    # Interactive Menu
    while True:
        print_banner("CRYPTOGRAPHY & DATA PROTECTION — DAY 02 SECURITY SUITE")
        print("  1. Run Confidentiality Demonstration (Encryption vs Sniffing)")
        print("  2. Run Integrity Demonstration (SHA-256 Avalanche & HMAC)")
        print("  3. Run Availability Demonstration (DoS vs Token Bucket)")
        print("  4. Run Quantitative Risk Scoring Engine")
        print("  5. Run All Demonstrations Sequentially")
        print("  6. Exit")
        print("\n" + "-" * 76)

        try:
            choice = input(f"{BOLD}Select an option (1-6): {RESET}").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if choice == "1":
            demo_confidentiality()
        elif choice == "2":
            demo_integrity()
        elif choice == "3":
            demo_availability()
        elif choice == "4":
            demo_risk_calculator()
        elif choice == "5":
            demo_confidentiality()
            demo_integrity()
            demo_availability()
            demo_risk_calculator()
        elif choice == "6":
            print(f"\n{GREEN}Lab session completed successfully. Goodbye!{RESET}\n")
            break
        else:
            print(f"{RED}Invalid selection. Please choose an option between 1 and 6.{RESET}")

        input(f"\n{CYAN}Press Enter to return to main menu...{RESET}")


if __name__ == "__main__":
    main()
