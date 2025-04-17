import { Injectable } from '@angular/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { Auth } from '@angular/fire/auth';
import { doc, updateDoc, Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class PushService {
  constructor(
    private firestore: Firestore,
    private auth: Auth,
  ) {}

  async initPush() {
    const permission = await PushNotifications.checkPermissions();

    if (permission.receive !== 'granted') {
      const request = await PushNotifications.requestPermissions();
      if (request.receive !== 'granted') {
        console.log('❌ Permiso de notificaciones denegado');
        return;
      }
    }

    // Escuchar registro del token
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('✅ Token FCM:', token.value);
      await this.saveToken(token.value);
    });

    // Manejar errores
    PushNotifications.addListener('registrationError', (err) => {
      console.error('❌ Error al registrar token', err);
    });

    // Notificación recibida en foreground
    PushNotifications.addListener('pushNotificationReceived', (notif) => {
      console.log('📩 Notificación recibida:', notif);
      const data = notif.data;
      if (data.type === 'incoming_call') {
        // Mostrar UI personalizada para aceptar o rechazar
        // this.showIncomingCallDialog(data);
      }
    });

    // Notificación tocada
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notif) => {
        console.log('📲 Notificación abierta:', notif);
      },
    );

    // Registrar el dispositivo
    await PushNotifications.register();
  }

  private async saveToken(token: string) {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, { token });
  }
}
