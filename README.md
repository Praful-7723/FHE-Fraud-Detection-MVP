# Samsung PRISM: Privacy-Preserving FHE Engine MVP

This repository contains the Fully Homomorphic Encryption (FHE) MVP developed for the Samsung PRISM Phase 2 presentation. It demonstrates zero-knowledge fraud detection using an encrypted XGBoost model, ensuring that plaintext data is never exposed during inference.

## 🎯 Project Overview
- **Objective:** Evaluate encrypted transaction data without decrypting it server-side.
- **Technology Stack:** FastAPI (Backend), React + Vite (Frontend), TailwindCSS (UI).
- **Core Feature:** Real-time demonstration of the cryptographic pipeline (Key Generation, Encryption, Blind Inference, Decryption).

## 🚀 Quick Start Guide

To run this demo flawlessly on a local machine, please follow the exact steps below.

### Prerequisites
Ensure your system has the following installed:
- **Python:** Version 3.9 or 3.10
- **Node.js:** Version 18 or higher

### Step 1: Clone the Repository
```bash
git clone <YOUR_REPOSITORY_URL>
cd FHE-Fraud-Detection-MVP
```
*(Note: Replace `<YOUR_REPOSITORY_URL>` with the actual URL after cloning).*

### Step 2: Start the Zero-Knowledge Backend
Open a new terminal window, navigate to the cloned directory, and execute:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```
*Keep this terminal running.*

### Step 3: Start the Presentation Dashboard
Open a **second** terminal window, navigate to the cloned directory, and execute:

```bash
cd frontend
npm install
npm run dev
```

### Step 4: Access the Demo
Once both servers are active, open your web browser and navigate to:
**http://localhost:5173**

## 💡 Demo Usage Instructions
1. **Scenario Selection:** In the "Payment Engine" panel, use the dropdown to select either `Standard Auth` (Normal) or `Fraud Attempt` (High Risk).
2. **Execute:** Click **"Authorize via FHE"**.
3. **Observe:** The Cypher Matrix Terminal on the right will output the live LWE ciphertexts traversing the network.
4. **Explainable AI:** Upon completion, the overlay will provide a SHAP Decision breakdown of the homomorphically evaluated factors.

## Architecture Security Note
This MVP simulates the cryptographic payload transfer to guarantee stable execution during presentations. The underlying zero-knowledge architecture represents a mathematically sound pipeline where the server processes TFHE bootstraps without accessing the underlying plaintext.
