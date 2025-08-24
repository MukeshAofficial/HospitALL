# Doctor Hospital Assignment Fix

## Problem Description

When creating doctors from the administrator account, doctors were not getting their `hospital_id` properly set in their profiles. This caused the issue where:

1. Doctors appeared to be created successfully
2. But no doctors were showing up in the appointment booking system
3. Patients couldn't book appointments because the system couldn't find doctors for their selected hospital

## Root Cause

The issue was in the profile creation process:

1. The [`/api/staff/create`](./app/api/staff/create/route.ts) endpoint was setting `hospital_id` in user metadata
2. But the database trigger that creates profiles wasn't extracting the `hospital_id` from the metadata properly
3. Doctors ended up with `hospital_id = null` in their profiles

## Solution Implemented

### 1. Fixed Staff Creation API

Updated [`/app/api/staff/create/route.ts`](./app/api/staff/create/route.ts):
- Now explicitly creates/updates the profile record with the correct `hospital_id`
- Uses upsert operation to ensure the profile has the right hospital assignment
- Provides backup in case the database trigger doesn't work properly

### 2. Updated Database Trigger

Updated [`/scripts/007_create_triggers.sql`](./scripts/007_create_triggers.sql):
- Modified the `handle_new_user()` function to extract `hospital_id` from user metadata
- Now properly assigns hospital_id when creating profiles for staff members

### 3. Created Fix Doctors API

Created [`/app/api/admin/fix-doctors/route.ts`](./app/api/admin/fix-doctors/route.ts):
- Fixes existing doctors who have missing `hospital_id` values
- Updates all doctors and nurses without hospital assignment to use the admin's hospital
- Provides a one-time fix for existing problematic records

### 4. Added Fix Button to Staff Management

Updated [`/app/hospital/staff-management/page.tsx`](./app/hospital/staff-management/page.tsx):
- Added "Fix Doctor Assignments" button in the staff management interface
- Allows admins to easily fix existing doctors with missing hospital assignments
- Shows success/error feedback

## How to Use the Fix

### For Existing Doctors (One-time Fix)

1. Log in as a hospital administrator
2. Go to Hospital Dashboard → Staff Management
3. Click the "Fix Doctor Assignments" button (orange button in the header)
4. The system will:
   - Find all doctors/nurses without hospital assignment
   - Assign them to your hospital
   - Show a success message with the count of updated staff

### For New Doctors (Automatic)

Going forward, all new doctors created through the admin interface will automatically:
1. Have the correct `hospital_id` set during creation
2. Appear in appointment booking for patients
3. Be properly associated with the hospital

## Database Changes Needed

To apply the trigger fix to your database, you need to run the updated trigger:

```sql
-- Run this in your Supabase SQL editor or psql
-- This is from scripts/007_create_triggers.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role, phone, hospital_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Unknown User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient'),
    NEW.raw_user_meta_data ->> 'phone',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'hospital_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'hospital_id')::UUID
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;

  -- If the user is a patient, also create a patient record
  IF COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient') = 'patient' THEN
    INSERT INTO public.patients (profile_id, date_of_birth, gender)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'date_of_birth')::DATE,
      NEW.raw_user_meta_data ->> 'gender'
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
```

## Verification

After applying the fix:

1. **Check existing doctors**: Use the "Fix Doctor Assignments" button
2. **Test appointment booking**: 
   - Log in as a patient
   - Try to book an appointment
   - Select your hospital
   - Verify that doctors now appear in the dropdown
3. **Create new doctors**: Test creating new doctors and verify they appear immediately

## Files Modified

- `/app/api/staff/create/route.ts` - Enhanced staff creation with proper hospital assignment
- `/app/api/admin/fix-doctors/route.ts` - New endpoint to fix existing doctors
- `/app/hospital/staff-management/page.tsx` - Added fix button and UI
- `/scripts/007_create_triggers.sql` - Updated trigger to handle hospital_id from metadata

## Benefits

- ✅ Existing doctors can be fixed with one click
- ✅ New doctors will automatically have correct hospital assignment
- ✅ Patients can now see and book appointments with doctors
- ✅ Multi-hospital functionality works properly
- ✅ No data loss - only missing hospital associations are added