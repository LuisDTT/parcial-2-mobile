import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private authService: AuthService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async login() {
    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email, password);
      this.navCtrl.navigateRoot('/home'); // Cambia a la página principal
    } catch (error: any) {
      console.error('Login error', error);
      // Aquí puedes mostrar un Toast o Alert
    }
  }
}
