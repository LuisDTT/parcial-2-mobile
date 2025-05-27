// contacts.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  setDoc,
  getDoc,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ContactsService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private auth: Auth,
    private alertController: AlertController,
  ) {}

  // Convertir el Promise a Observable
  getContacts(): Observable<any[]> {
    const userId = this.authService.getUserId();
    if (userId) {
      const contactsRef = collection(
        this.firestore,
        `users/${userId}/contacts`,
      );
      const q = query(contactsRef);

      // Usamos 'from' para convertir el Promise en un Observable
      return from(getDocs(q)).pipe(
        map((querySnapshot) => querySnapshot.docs.map((doc) => doc.data())), // Extraer los datos de los documentos
      );
    } else {
      return new Observable<any[]>(); // Si no hay usuario logueado, retornamos un observable vacío
    }
  }

  // Verificar si un contacto ya existe por teléfono
  async checkIfContactExists(phone: string): Promise<boolean> {
    const userId = this.authService.getUserId();
    if (userId) {
      const contactsRef = collection(
        this.firestore,
        `users/${userId}/contacts`,
      );
      const q = query(contactsRef, where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty; // Retorna true si el contacto existe
    }
    return false;
  }

  async addContact(phone: string, contactName: string) {
    const contactosRef = collection(this.firestore, 'users');
    const q = query(contactosRef, where('phone', '==', phone));

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // El usuario existe
      const userEncontrado = querySnapshot.docs[0];
      const userIdActual = this.auth.currentUser?.uid;

      if (userIdActual) {
        // Agregar el contacto a la lista de contactos del usuario actual
        const contactRef = doc(
          this.firestore,
          `users/${userIdActual}/contacts/${userEncontrado.id}`,
        );

        await setDoc(contactRef, {
          name: contactName,
          phone: userEncontrado.data()['phone'],
          userId: userEncontrado.id,
        });

        console.log('Contacto agregado exitosamente.');
        this.showAlert(
          'Contacto Agregado',
          '¡El contacto se agregó exitosamente!',
        );
        // Mostrar éxito al usuario
      } else {
        console.error('No hay usuario logueado.');
        this.showAlert('Error', 'No hay usuario logueado.');
      }
    } else {
      console.error('No se encontró un usuario con ese teléfono.');
      // Mostrar error al usuario
      this.showAlert(
        'Contacto no encontrado',
        'No existe un usuario con ese número de teléfono.',
      );
    }
  }

  async getUserData(uid: string): Promise<any> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
