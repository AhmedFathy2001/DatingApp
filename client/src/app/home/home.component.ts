import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  registerMode = false;
  users: any;
  constructor(private http: HttpClient) {}

  ngOnInit() {}

  registerToggle() {
    this.registerMode = !this.registerMode;
  }

  getUsers() {
    this.http
      .get('https://localhost:5001/api/users', {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
      .subscribe({
        next: (response) => {
          this.users = response;
        },
        error: console.log,
      });
  }

  cancelRegisterMode(event: boolean) {
    this.registerMode = event;
  }
}