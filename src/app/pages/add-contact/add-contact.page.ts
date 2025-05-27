// add-contact.page.ts
import { Component } from '@angular/core';
import { ContactsService } from '../../core/services/contacts.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.page.html',
  styleUrls: ['./add-contact.page.scss'],
  standalone: false,
})
export class AddContactPage {
  name: string = '';
  phone: string = '';

  constructor(
    private contactsService: ContactsService,
    private authService: AuthService,
    private navCtrl: NavController,
  ) {}

  async onSubmit() {
    if (this.phone) {
      await this.contactsService.addContact(this.phone, this.name);
      this.navCtrl.navigateRoot('/home');
    }
  }
}
