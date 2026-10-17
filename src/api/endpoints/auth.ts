import { api } from "../client";
import type { AuthSession, BotSessionBody, LoginBody, RegisterBody, SendOtpBody } from "../types";

export const authApi = {
  /** purpose "register" fails with 409 if the number exists; "login" fails with 404 if it does not. */
  sendOtp: (body: SendOtpBody) =>
    api.post<{ success: boolean; message: string }>("auth/send-otp/", body).then((r) => r.data),
  register: (body: RegisterBody) => api.post<AuthSession>("auth/register/", body).then((r) => r.data),
  /** Exchange a signed WhatsApp-bot link for a session; the backend creates the demand user on first use. */
  botSession: (body: BotSessionBody) => api.post<AuthSession>("auth/bot-session/", body).then((r) => r.data),
  login: (body: LoginBody) => api.post<AuthSession>("auth/login/", body).then((r) => r.data),
};
