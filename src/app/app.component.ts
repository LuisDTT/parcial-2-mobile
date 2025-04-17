import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { PushNotifications } from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { PushService } from './core/services/push.service';
import { ExternalApiService } from './core/services/external-api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private pushService: PushService,
    private externalApiService: ExternalApiService,
  ) {
    this.platform.ready().then(() => {
      this.pushService.initPush();
    });
  }

  ngOnInit() {
    // ⚠️ Puedes usar valores fijos para pruebas
    const email = 'luis.torrestomala@unicolombo.edu.co';
    const password = 'parcial';

    this.externalApiService.loginToExternalApi(email, password);
  }
}
