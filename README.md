### VIBE CODING - Care Coordination & Treatment Workflow Platform

# How to run :
From root folder -
```bash 
docker compose up
```
```bash
cd backend
```
then -
```bash 
npx prisma db seed
```
<br>

#Roles ->
- Super Admin
- Org Admin
- Patient
- Receptionist
- Care Nurse
- Doctor
- Specialist
- Lab Technician
- Billing Officer
- Compliance Officer

After seed, example logins - 
## 🏢 Organizations

- **Platform Org (Super Admin)**: `00000000-0000-0000-0000-000000000099`
- **Default Tenant Org**: `00000000-0000-0000-0000-000000000001`
- **Second Tenant Org**: `00000000-0000-0000-0000-000000000002`

---

## 👤 Roles & Login Credentials

### 🔑 SUPER_ADMIN
- **Email**: superadmin@platform.health  
- **Password**: SuperAdmin!12345  
- **Organization ID**: Optional  

---

### 🏢 ORG_ADMIN (Default Tenant)
- **Email**: admin@demo.health  
- **Password**: ChangeMeStrong!123  
- **Organization ID**: `...0001`  

### 🏢 ORG_ADMIN (Second Tenant)
- **Email**: admin2@demo.health  
- **Password**: ChangeMeStrong!123  
- **Organization ID**: `...0002`  

---

### 🧑‍⚕️ PATIENT
- **Email**: patient@demo.health  
- **Password**: PatientStrong!123  
- **Organization ID**: `...0001`  

### 🧑‍💼 RECEPTIONIST
- **Email**: receptionist@demo.health  
- **Password**: ReceptionStrong!123  
- **Organization ID**: `...0001`  

### 🏥 CARE_NURSE
- **Email**: nurse@demo.health  
- **Password**: NurseStrong!123  
- **Organization ID**: `...0001`  

### 👨‍⚕️ DOCTOR
- **Email**: doctor@demo.health  
- **Password**: DoctorStrong!123  
- **Organization ID**: `...0001`  

### 🧠 SPECIALIST
- **Email**: specialist@demo.health  
- **Password**: SpecialistStrong!123  
- **Organization ID**: `...0001`  

### 🧪 LAB_TECHNICIAN
- **Email**: labtech@demo.health  
- **Password**: LabStrong!123  
- **Organization ID**: `...0001`  

### 💳 BILLING_OFFICER
- **Email**: billing@demo.health  
- **Password**: BillingStrong!123  
- **Organization ID**: `...0001`  

### 📋 COMPLIANCE_OFFICER
- **Email**: compliance@demo.health  
- **Password**: ComplianceStrong!123  
- **Organization ID**: `...0001`  


