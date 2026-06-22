import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://fisiohome.app.br";

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&";
  const all = upper + lower + digits + special;
  let pw = "";
  pw += upper[Math.floor(Math.random() * upper.length)];
  pw += lower[Math.floor(Math.random() * lower.length)];
  pw += digits[Math.floor(Math.random() * digits.length)];
  pw += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 8; i++) {
    pw += all[Math.floor(Math.random() * all.length)];
  }
  return pw.split("").sort(() => Math.random() - 0.5).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const body = await req.json();

    // Accept both Hotmart payload and direct API calls
    const buyer = body.buyer ?? body;
    const name = buyer.name ?? buyer.nome ?? "";
    const email = buyer.email ?? "";
    const phone = buyer.phone ?? buyer.telefone ?? buyer.checkout_phone ?? "";
    const cpf = buyer.document ?? buyer.cpf ?? buyer.checkout_document ?? "";

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "email and name are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const password = generatePassword();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing?.users?.some((u) => u.email === email);
    if (alreadyExists) {
      return new Response(JSON.stringify({ success: true, message: "User already exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create user in Supabase Auth — the DB trigger `on_auth_user_created`
    // will automatically insert into `profiles` table
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, cpf },
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    // Send email with credentials via Resend
    const { error: emailError } = await resend.emails.send({
      from: "FisioHome <onboarding@fisiohome.app.br>",
      to: email,
      subject: "Bem-vindo ao FisioHome — seus dados de acesso",
      html: `
        <div style="font-family: 'Nunito', sans-serif; max-width: 480px; margin: 0 auto; background: #FEFCF9; border-radius: 16px; overflow: hidden; border: 1px solid #E8D5BE;">
          <div style="background: linear-gradient(135deg, #0a5c52, #062e28); padding: 28px 24px; text-align: center;">
            <h1 style="font-family: 'Cormorant Garamond', serif; color: #fff; margin: 0; font-size: 1.6rem;">Fisio<span style="color: #D4B896;">Home</span></h1>
            <p style="color: rgba(255,255,255,.6); font-size: .8rem; margin: 4px 0 0;">Prontuário Digital</p>
          </div>
          <div style="padding: 28px 24px;">
            <h2 style="font-family: 'Cormorant Garamond', serif; color: #1E2D2B; font-size: 1.3rem; margin: 0 0 6px;">Olá, ${name}!</h2>
            <p style="color: #4A6560; font-size: .9rem; margin: 0 0 18px;">Sua conta foi criada com sucesso.</p>
            <div style="background: #FBF5EE; border: 1px solid #E8D5BE; border-radius: 12px; padding: 18px;">
              <p style="font-size: .82rem; color: #4A6560; margin: 0 0 10px;"><strong style="color: #1E2D2B;">E-mail:</strong> ${email}</p>
              <p style="font-size: .82rem; color: #4A6560; margin: 0 0 10px;"><strong style="color: #1E2D2B;">Senha:</strong> <code style="background: #fff; padding: 4px 10px; border-radius: 6px; font-size: 1rem; color: #0a5c52; border: 1px solid #DDE8E6;">${password}</code></p>
            </div>
            <p style="font-size: .78rem; color: #8AADA8; margin-top: 16px;">Recomendamos alterar a senha após o primeiro acesso.</p>
            <a href="${APP_URL}"
               style="display: block; margin-top: 20px; padding: 14px; background: linear-gradient(135deg, #13a090, #0a5c52); color: #fff; text-align: center; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: .9rem;">
              Acessar FisioHome →
            </a>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
    }

    return new Response(JSON.stringify({ success: true, user_id: authData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
