
-- Add WhatsApp message template to work_settings
ALTER TABLE public.work_settings
ADD COLUMN whatsapp_template text DEFAULT 'Olá {nome}! 👋

Seu agendamento foi confirmado! ✅

📅 *Data:* {data}
🕐 *Horário:* {horario}
👤 *Profissional:* {profissional}
💰 *Valor:* {valor}
⏱️ *Duração:* {duracao} minutos
{obs}
Aguardamos você! 💅✨';
