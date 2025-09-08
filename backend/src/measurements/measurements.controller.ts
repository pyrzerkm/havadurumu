import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Inject, forwardRef } from '@nestjs/common';
import { MeasurementsService } from './measurements.service';
import { AuthGuard } from '../auth/auth.guard';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Controller('measurements')
export class MeasurementsController {
  constructor(
    private readonly measurementsService: MeasurementsService,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createMeasurementDto: any) {
    const measurement = await this.measurementsService.create(createMeasurementDto);
    // WebSocket ile yeni ölçümü bildir
    this.websocketGateway.broadcastNewMeasurement(createMeasurementDto.stationId, measurement);
    return measurement;
  }

  @Get()
  findAll() {
    return this.measurementsService.findAll();
  }

  @Get('latest')
  findLatestAllStations() {
    return this.measurementsService.findLatestAllStations();
  }

  @Get('station/:stationId')
  findByStation(@Param('stationId') stationId: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 30;
    return this.measurementsService.findByStation(stationId, limitNum);
  }

  @Get('station/:stationId/latest')
  findLatestByStation(@Param('stationId') stationId: string) {
    return this.measurementsService.findLatestByStation(stationId);
  }

  @Get('station/:stationId/latest-date')
  getLatestDateByStation(@Param('stationId') stationId: string) {
    return this.measurementsService.getLatestDateByStation(stationId);
  }

  @Get('station/:stationId/range')
  getMeasurementsByDateRange(
    @Param('stationId') stationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.measurementsService.getMeasurementsByDateRange(
      stationId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.measurementsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateMeasurementDto: any) {
    return this.measurementsService.update(id, updateMeasurementDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.measurementsService.remove(id);
  }
}
