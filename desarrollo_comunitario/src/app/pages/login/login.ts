// login.ts
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  correo = '';
  password = '';

  // Signals — variables reactivas, Angular se actualiza sola al cambiar
  error = signal('');
  cargando = signal(false);

  constructor(private auth: Auth, private router: Router) {}

  onSubmit() {
    this.error.set('');
    this.cargando.set(true);

    this.auth.login(this.correo, this.password).subscribe({
      next: (res) => {
        this.auth.guardarSesion(res.token, res.usuario);
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje || 'Correo o contraseña incorrectos');
        // ya no necesitamos ChangeDetectorRef ni detectChanges()
      }
    });
  }
}