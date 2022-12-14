import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Notification } from '../models/notification';
import { Store } from '@ngrx/store';
import { selectUserId } from 'src/app/store/app.states';

@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;

  constructor(
    private toastr: ToastrService,
    private router: Router,
    private store: Store,
  ) {}

  public startConnection = () => {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}notify`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .build();
    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch((err) => console.log('Error while starting connection: ' + err));
  };

  public addNotificationListner = () => {
    this.hubConnection.on('SendMessage', (notification: Notification) => {
      this.store.select(selectUserId).pipe().subscribe(currentUserId => {
        if (notification.userId == currentUserId){
          this.showNotification(notification)
        }
      })
    });
  };

  showNotification(notification: Notification) {
    this.toastr.success(notification.message, 'Look!')
    .onTap
    .pipe(take(1))
    .subscribe(()=> {
      this.router.navigateByUrl(`${notification.type}/${notification.eventId}`);
    })
  }
}
