// home.page.ts
import { Component, OnInit } from '@angular/core';
import { ContactsService } from '../core/services/contacts.service';
import { AuthService } from '../core/services/auth.service';
import { Observable } from 'rxjs';
import { PushService } from '../core/services/push.service';
import { ExternalApiService } from '../core/services/external-api.service';
import { v4 as uuidv4 } from 'uuid';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  contacts: any[] = [];

  constructor(
    private contactsService: ContactsService,
    private authService: AuthService,
    private pushService: PushService,
    private apiService: ExternalApiService,
    private firestore: Firestore,
  ) {}

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    // Usamos el Observable que proporciona el servicio
    this.contactsService.getContacts().subscribe((contacts) => {
      this.contacts = contacts; // Asignamos los contactos a la variable
      console.log(this.contacts[0]);
    });
  }

  async startCall(contactId: string) {
    const meetingId = uuidv4();

    const userFrom = await this.authService.getCurrentUser(); // Remitente
    if (!userFrom) return;

    const userFromName = userFrom.displayName || 'Desconocido';
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
          console.log(res);
        },
        error: (err) => {
          console.log(err);
        },
      });

      console.log('✅ Notificación enviada');
      console.log(payload);
    } catch (err) {
      console.error('❌ Error enviando notificación', err);
    }
  }

  logout() {
    this.authService.logout();
  }
}
