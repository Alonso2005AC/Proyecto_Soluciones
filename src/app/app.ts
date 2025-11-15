import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';  
import { RouterOutlet } from '@angular/router';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HttpClientModule, FormsModule],
  templateUrl: './app.shell.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('Front-end');
}
