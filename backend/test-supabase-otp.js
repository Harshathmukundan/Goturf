import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testOtp() {
  console.log("Testing email OTP...");
  const { data, error } = await supabase.auth.signInWithOtp({ email: 'testotp123@goturf.com' });
  console.log("Email OTP result:", error ? error.message : "Success");
  
  console.log("Testing phone OTP...");
  const { data: d2, error: e2 } = await supabase.auth.signInWithOtp({ phone: '+1234567890' });
  console.log("Phone OTP result:", e2 ? e2.message : "Success");
}
testOtp();
