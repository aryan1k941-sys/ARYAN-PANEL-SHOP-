ARYAN GAMING - VERCEL PROJECT

IMPORTANT: Is project ko Vercel par deploy karne ke liye poora folder GitHub repository mein upload karein.

1. GitHub par nayi repository banayein.
2. Is folder ke andar ki saari files/folders upload karein (folder ke andar ek aur nested project folder na banayein).
3. Vercel > Add New > Project > GitHub repository import karein.
4. Framework: Vite (auto detect), Build Command: npm run build, Output Directory: dist.
5. Deploy karein.

Firebase SDK ab inline HTML module mein nahi, src/main.js aur src/admin.js mein hai. Vite npm package se Firebase SDK ko bundle karega. Isse browser mein bare import 'firebase/app' wala issue solve hona chahiye.

Firebase config is project ke HTML se liya gaya hai. Firebase Console mein Authentication providers (Email/Password aur Google), authorized domains (aapka *.vercel.app domain) aur Realtime Database rules check karein.

Payment gateway: Is frontend project mein payment provider ke secure server-side secret/API key ko host na karein. Payment create/verify/webhook ke liye trusted backend/serverless functions zaroori hain.

Admin page: /Admin.html
User page: /

Note: Is environment mein npm registry network timeout hua, isliye production build ya live Firebase login test complete nahi ho saka. Deploy ke baad Vercel Build Logs aur browser console check karein.
