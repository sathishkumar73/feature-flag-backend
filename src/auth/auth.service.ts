// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { supabase } from '../utils/supabaseClient';

@Injectable()
export class AuthService {
  async signup(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/verify-email',
      },
    });

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
