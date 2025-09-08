import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_station')
  handleJoinStation(client: Socket, stationId: string) {
    client.join(`station_${stationId}`);
    console.log(`Client ${client.id} joined station ${stationId}`);
  }

  @SubscribeMessage('leave_station')
  handleLeaveStation(client: Socket, stationId: string) {
    client.leave(`station_${stationId}`);
    console.log(`Client ${client.id} left station ${stationId}`);
  }

  // Yeni ölçüm eklendiğinde tüm istasyon dinleyicilerine bildirim gönder
  broadcastNewMeasurement(stationId: string, measurement: any) {
    console.log(`Broadcasting new measurement for station ${stationId}:`, measurement);
    // Sadece o istasyonun room'una gönder
    this.server.to(`station_${stationId}`).emit('newMeasurement', measurement);
    // Harita için global broadcast
    this.server.emit('mapUpdate', measurement);
  }

  // İstasyon güncellendiğinde bildirim gönder
  broadcastStationUpdate(stationId: string, station: any) {
    this.server.to(`station_${stationId}`).emit('station_update', station);
  }

  // Tüm istasyonların güncel verilerini gönder
  broadcastAllStationsUpdate(stations: any[]) {
    this.server.emit('all_stations_update', stations);
  }
}
