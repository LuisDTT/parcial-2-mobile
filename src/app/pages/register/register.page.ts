import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async register() {
    const { firstName, lastName, email, phone, password } =
      this.registerForm.value;

    try {
      await this.authService.register(
        { firstName, lastName, phone, email },
        password,
      );

      this.showToast('Usuario registrado exitosamente');
      this.navCtrl.navigateRoot('/login');
    } catch (error: any) {
      console.error('Error en registro:', error);
      this.showToast(error.message);
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
    });
    toast.present();
  }
}
