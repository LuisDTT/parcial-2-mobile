// home.page.ts
import { Component, OnInit } from '@angular/core';
import { ContactsService } from '../core/services/contacts.service';
import { AuthService } from '../core/services/auth.service';
import { Observable } from 'rxjs';
import { PushService } from '../core/services/push.service';
import { ExternalApiService } from '../core/services/external-api.service';
import { v4 as uuidv4 } from 'uuid';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { AlertController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { startJitsiCall } from '../utils/jitsi-utils';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { supabaseService } from '../core/services/supabase.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { collection } from 'firebase/firestore';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  contacts: any[] = [];
  currentUser: any;
  constructor(
    private contactsService: ContactsService,
    private authService: AuthService,
    private pushService: PushService,
    private apiService: ExternalApiService,
    private firestore: Firestore,
    private platform: Platform,
    private router: Router,
    private supabaseService: supabaseService,
    private alertCtrl: AlertController,
  ) {
    this.platform.ready().then(() => {
      this.pushService.initPush();
    });
    VoiceRecorder.requestAudioRecordingPermission();
  }

  async ngOnInit() {
    this.loadContacts();
    const user = await this.authService.getCurrentUser();
    const userData = await this.contactsService.getUserData(user?.uid ?? '');

    this.currentUser = userData;
  }

  ionViewWillEnter() {
    this.loadContacts();
  }

  async changePhoto() {
    // Lógica para abrir selector de imagen y subirla a Supabase
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Te da opción de Cámara o Galería
      });

      if (image?.base64String) {
        const base64Data = `data:image/jpeg;base64,${image.base64String}`;
        const blob = this.supabaseService.base64ToBlob(
          base64Data,
          'image/jpeg',
        );
        const downloadUrl = await this.supabaseService.uploadProfilePhoto(
          blob,
          this.currentUser.uid,
        );

        const user = await this.authService.getCurrentUser();

        // Guardar en Firestore
        const userRef = doc(this.firestore, `users/${user?.uid}`);
        await updateDoc(userRef, {
          photoUrl: downloadUrl,
        });

        // Opcional: actualizar en pantalla
        this.currentUser.photoUrl = downloadUrl;
      }
    } catch (error) {
      console.error('Error al cambiar foto:', error);
    }
  }

  async changeName() {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar nombre',
      inputs: [
        {
          name: 'newName',
          type: 'text',
          placeholder: 'Nuevo nombre',
          value: this.currentUser?.name || '',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            const newName = data.newName?.trim();

            if (newName) {
              const user = await this.authService.getCurrentUser();

              // Guardar en Firestore
              const userRef = doc(this.firestore, `users/${user?.uid}`);
              await updateDoc(userRef, {
                firstName: newName,
              });
              this.currentUser.firstName = newName; // Actualiza en pantalla
            }
          },
        },
      ],
    });

    await alert.present();
  }

  loadContacts() {
    // Usamos el Observable que proporciona el servicio
    this.contactsService.getContacts().subscribe((contacts) => {
      this.contacts = contacts; // Asignamos los contactos a la variable
      console.log(contacts);
    });
  }

  async startCall(contactId: string) {
    const meetingId = uuidv4();

    const userFrom = await this.authService.getCurrentUser(); // Remitente
    if (!userFrom) return;

    const userFromData = await this.contactsService.getUserData(userFrom.uid);
    console.log(userFromData);
    const userFromName = userFromData.firstName || 'Desconocido';
    const userFromId = userFrom.uid;

    // Obtener datos del contacto
    const contactRef = doc(this.firestore, `users/${contactId}`);
    const contactSnap = await getDoc(contactRef);

    if (!contactSnap.exists()) {
      console.error('El contacto no existe');
      return;
    }

    const contactData: any = contactSnap.data();
    const tokenFCM = contactData.token;
    const userToId = contactId;

    const payload = {
      token: tokenFCM,
      notification: {
        title: 'Llamada entrante',
        body: `${userFromName} te está llamando`,
      },
      android: {
        priority: 'high',
        data: {
          userId: userToId,
          meetingId,
          type: 'incoming_call',
          name: userFromName,
          userFrom: userFromId,
        },
      },
    };

    try {
      this.apiService.sendNotification(payload).subscribe({
        next: (res) => {
          console.log('Respuesta:', JSON.stringify(res));
        },
        error: (err) => {
          console.log('Respuesta:', JSON.stringify(err));
        },
      });

      console.log('✅ Notificación enviada');
      startJitsiCall(meetingId);
      // this.router.navigate(['/video-call', meetingId]);
    } catch (err) {
      console.error('❌ Error enviando notificación', err);
    }
  }

  async openChatWith(contactId: string) {
    this.router.navigate(['/chat', contactId]);
  }
  logout() {
    this.authService.logout();
  }
}
