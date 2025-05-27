import { Injectable } from '@angular/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { Auth } from '@angular/fire/auth';
import { doc, updateDoc, Firestore } from '@angular/fire/firestore';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { startJitsiCall } from 'src/app/utils/jitsi-utils';

@Injectable({
  providedIn: 'root',
})
export class PushService {
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private alertCtrl: AlertController,
    private router: Router,
    private toastController: ToastController,
    private navCtrl: NavController,
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
      console.log('📩 Notificación recibida:', JSON.stringify(notif));
      const data = notif.data as {
        userId: string;
        meetingId: string;
        type: string;
        name: string;
        userFrom: string;
      };
      if (data.type === 'incoming_call') {
        // Mostrar UI personalizada para aceptar o rechazar
        this.showIncomingCallDialog(data);
      }

      if (data.type === 'chat_message') {
        // Mostrar alerta, sonido o UI personalizada
        this.presentChatToast(
          data.name,
          'Tienes un mensaje nuevo',
          data.meetingId,
        );
      }
    });

    // Notificación tocada
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notif) => {
        console.log('📲 Notificación abierta:', notif);
        const data = notif.notification.data;
        if (data.type === 'incoming_call') {
          startJitsiCall(data.meetingId);
          // this.router.navigate(['/video-call', data.meetingId]);
        }

        if (data.type === 'chat_message') {
          // Redirigir automáticamente al chat con esa persona
          this.router.navigateByUrl(`/chat/${data.meetingId}`);
        }
      },
    );

    // Registrar el dispositivo
    await PushNotifications.register();
  }

  async showIncomingCallDialog(data: {
    userId: string;
    meetingId: string;
    type: string;
    name: string;
    userFrom: string;
  }) {
    const alert = await this.alertCtrl.create({
      header: '📞 Llamada entrante',
      message: `${data.name} te está llamando`,
      buttons: [
        {
          text: 'Rechazar',
          role: 'cancel',
          handler: () => {
            console.log('Llamada rechazada');
          },
        },
        {
          text: 'Contestar',
          handler: () => {
            console.log('Llamada aceptada');
            startJitsiCall(data.meetingId);
          },
        },
      ],
    });

    await alert.present();
  }

  async presentChatToast(senderName: string, message: string, chatId: string) {
    const toast = await this.toastController.create({
      message: `${senderName}: ${message}`,
      duration: 5000,
      position: 'top',
      buttons: [
        {
          text: 'Abrir',
          handler: () => {
            this.navCtrl.navigateForward(`/chat/${chatId}`);
          },
        },
        {
          text: 'Cerrar',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }

  private async saveToken(token: string) {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, { token });
  }
}
