import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExternalApiService {
  private baseUrl = 'https://ravishing-courtesy-production.up.railway.app';

  constructor(private http: HttpClient) {}

  loginToExternalApi(email: string, password: string) {
    return this.http
      .post<{ data: { access_token: string } }>(`${this.baseUrl}/user/login`, {
        email,
        password,
      })
      .subscribe({
        next: (res) => {
          localStorage.setItem('externalApiToken', res.data.access_token);
          console.log('🔐 Token guardado:', res.data.access_token);
        },
        error: (err) => {
          console.error('❌ Error al loguearse en API externa:', err);
        },
      });
  }

  sendNotification(payload: any) {
    return this.http.post(`${this.baseUrl}/notifications`, payload);
  }
}
