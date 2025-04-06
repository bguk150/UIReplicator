# iPad-Only Access Setup Guide

This guide explains how to restrict access to the Beyond Grooming application so it can only be accessed from the shop's iPad.

## Step 1: Find the iPad's IP Address

1. On the iPad, go to **Settings**
2. Tap on **Wi-Fi**
3. Tap the **ⓘ** icon next to your connected Wi-Fi network
4. Note the **IP Address** (it will look something like `192.168.1.235`)

## Step 2: Update the Code

1. Open the file `server/index.ts`
2. Find the commented-out IP restriction section (around line 10)
3. Remove the comment marks `/*` and `*/` to enable the code
4. Replace `SHOP_IPAD_IP_HERE` with your iPad's IP address from Step 1

Example:
```javascript
const ALLOWED_IPS: string[] = [
  '127.0.0.1',        // Localhost for development
  '192.168.1.235'     // Shop iPad's IP address
];
```

## Step 3: Deploy the Application

1. Deploy the updated code using Replit's deploy button
2. Test access from both the iPad (should work) and another device (should show access restricted)

## Important Notes

- This solution works best if your iPad has a static IP address on your shop's Wi-Fi network
- If your iPad's IP address changes (dynamic IP), you'll need to update the code again
- For business use, consider talking to your internet service provider about setting up a static IP

## Alternative Setup for More Flexibility

If you need multiple devices to access the application or if the iPad's IP changes frequently, you may want to use password-based authentication instead. This is already implemented with the login system.