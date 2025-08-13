# MediShare

A blockchain-powered platform for patient-controlled health data management, enabling secure, private, and incentivized sharing of medical records with healthcare providers, researchers, and insurers—all on-chain.

---

## Overview

MediShare leverages Web3 to empower patients to own, control, and monetize their health data while ensuring privacy and security. The platform addresses real-world problems like data silos, lack of patient agency, and inefficiencies in medical research by using decentralized technologies. It consists of four smart contracts built with Clarity, designed to work together to create a transparent and user-centric health data ecosystem.

### Problem Solved
- **Data Silos**: Healthcare providers often store patient data in incompatible systems, limiting interoperability.
- **Patient Disempowerment**: Patients lack control over who accesses their data and how it’s used.
- **Research Inefficiencies**: Medical researchers struggle to access diverse, reliable datasets, and patients are rarely rewarded for contributing.
- **Privacy Concerns**: Centralized systems are vulnerable to breaches, risking sensitive health information.

### Solution
MediShare enables patients to store encrypted health records on-chain, control access via granular permissions, and earn tokenized rewards for sharing data with verified researchers or insurers. The platform ensures transparency, security, and fair compensation, fostering trust and accelerating medical innovation.

---

## Features

- **Encrypted Health Records**: Patients store and manage health data securely on-chain.
- **Granular Access Control**: Patients set permissions for who can access their data (e.g., doctors, researchers) and for how long.
- **Tokenized Incentives**: Patients earn tokens for sharing anonymized data with researchers or insurers.
- **Transparent Data Usage**: All data access and transactions are logged immutably on the blockchain.
- **Decentralized Identity Verification**: Ensures only verified parties (e.g., licensed providers) can request data access.

---

## Smart Contracts

### 1. HealthRecordContract
- **Purpose**: Stores and manages encrypted patient health records.
- **Key Functions**:
  - `store-record(patient-id: principal, encrypted-data: string)`: Stores encrypted health data for a patient.
  - `update-record(patient-id: principal, encrypted-data: string)`: Updates existing records.
  - `get-record(patient-id: principal)`: Retrieves encrypted record (accessible only by patient or authorized parties).
- **Features**:
  - Data encryption ensures privacy.
  - Only the patient (principal) or authorized parties can access records.
  - Immutable audit trail of record updates.

### 2. AccessControlContract
- **Purpose**: Manages permissions for data access by healthcare providers, researchers, or insurers.
- **Key Functions**:
  - `grant-access(patient-id: principal, requester-id: principal, duration: uint)`: Grants time-bound access to a specific requester.
  - `revoke-access(patient-id: principal, requester-id: principal)`: Revokes access immediately.
  - `check-access(requester-id: principal, patient-id: principal)`: Verifies if a requester has active access.
- **Features**:
  - Time-limited access prevents unauthorized overuse.
  - Patients can revoke access at any time.
  - Transparent log of all access requests and grants.

### 3. RewardTokenContract
- **Purpose**: Issues and manages tokens to incentivize patients for sharing data.
- **Key Functions**:
  - `mint-tokens(patient-id: principal, amount: uint)`: Mints tokens to a patient for data sharing.
  - `transfer-tokens(from: principal, to: principal, amount: uint)`: Allows token transfers (e.g., for redeeming rewards).
  - `burn-tokens(patient-id: principal, amount: uint)`: Burns tokens if needed for supply control.
- **Features**:
  - Tokens incentivize data sharing with researchers or insurers.
  - Staking mechanism for patients to earn additional rewards.
  - Transparent token transaction history.

### 4. DataRequestContract
- **Purpose**: Facilitates data sharing requests from researchers or insurers and automates reward distribution.
- **Key Functions**:
  - `submit-request(requester-id: principal, patient-id: principal, purpose: string, token-offer: uint)`: Submits a data access request with a token offer.
  - `accept-request(patient-id: principal, request-id: uint)`: Patient accepts the request, triggering token transfer and access grant.
  - `reject-request(patient-id: principal, request-id: uint)`: Patient rejects the request.
- **Features**:
  - Automated token transfers upon request acceptance.
  - Purpose of data use (e.g., “clinical trial,” “insurance underwriting”) logged for transparency.
  - Patients can review requester credentials before approving.

---

## How It Works

1. **Patient Onboarding**:
   - Patients register and upload encrypted health records to the `HealthRecordContract`.
   - Records are linked to the patient’s principal (unique blockchain identity).

2. **Data Requests**:
   - Researchers or insurers submit requests via the `DataRequestContract`, specifying the purpose and offering tokens.
   - Patients review requests, verify requester identity, and accept or reject via the contract.

3. **Access Control**:
   - Upon accepting a request, the `AccessControlContract` grants time-bound access to the requester.
   - Patients can revoke access at any time, ensuring control.

4. **Rewards**:
   - Upon request acceptance, the `RewardTokenContract` mints and transfers tokens to the patient.
   - Tokens can be staked for additional rewards or redeemed for services (e.g., healthcare discounts).

5. **Transparency**:
   - All transactions (data storage, access grants, token transfers) are logged immutably on the blockchain.
   - Patients and requesters can audit data usage history.

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started):
   ```bash
   npm install -g @hirosystems/clarinet
   ```
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/medishare.git
   ```
3. Navigate to the project directory:
   ```bash
   cd medishare
   ```
4. Run tests:
   ```bash
   clarinet test
   ```
5. Deploy contracts:
   ```bash
   clarinet deploy
   ```

---

## Usage

Each smart contract is designed to integrate seamlessly with the others to create a cohesive platform. Below is an example workflow:

1. **Store Health Data**:
   ```clarity
   (contract-call? .HealthRecordContract store-record ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM "encrypted-data-string")
   ```

2. **Submit Data Request**:
   ```clarity
   (contract-call? .DataRequestContract submit-request ST2JHG361ZXG51QTKLHHWGX7T2ZV1B8Z5F3T0JQP3 ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM "clinical-trial" u100)
   ```

3. **Grant Access**:
   ```clarity
   (contract-call? .AccessControlContract grant-access ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST2JHG361ZXG51QTKLHHWGX7T2ZV1B8Z5F3T0JQP3 u604800) ;; 7-day access
   ```

4. **Accept Request and Receive Tokens**:
   ```clarity
   (contract-call? .DataRequestContract accept-request ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM u1)
   ```

For detailed function calls, parameters, and error handling, refer to individual contract documentation in the repository.

---

## License

MIT License
