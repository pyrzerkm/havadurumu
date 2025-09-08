import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Station, StationDocument } from './schemas/station.schema';

@Injectable()
export class StationsService {
  constructor(@InjectModel(Station.name) private stationModel: Model<StationDocument>) {}

  async create(createStationDto: any): Promise<Station> {
    const createdStation = new this.stationModel(createStationDto);
    return createdStation.save();
  }

  async findAll(): Promise<Station[]> {
    return this.stationModel.find().exec();
  }

  async findOne(id: string): Promise<Station | null> {
    return this.stationModel.findById(id).exec();
  }

  async update(id: string, updateStationDto: any): Promise<Station | null> {
    return this.stationModel.findByIdAndUpdate(id, updateStationDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Station | null> {
    return this.stationModel.findByIdAndDelete(id).exec();
  }

  async findActiveStations(): Promise<Station[]> {
    return this.stationModel.find({ isActive: true }).exec();
  }
}
