import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Measurement, MeasurementDocument } from './schemas/measurement.schema';

@Injectable()
export class MeasurementsService {
  constructor(@InjectModel(Measurement.name) private measurementModel: Model<MeasurementDocument>) {}

  async create(createMeasurementDto: any): Promise<Measurement> {
    const measurementData = {
      ...createMeasurementDto,
      stationId: new Types.ObjectId(createMeasurementDto.stationId)
    };
    const createdMeasurement = new this.measurementModel(measurementData);
    return createdMeasurement.save();
  }

  async findAll(): Promise<Measurement[]> {
    return this.measurementModel.find().populate('stationId').exec();
  }

  async findOne(id: string): Promise<Measurement | null> {
    return this.measurementModel.findById(id).populate('stationId').exec();
  }

  async findByStation(stationId: string, limit: number = 30): Promise<Measurement[]> {
    return this.measurementModel
      .find({ stationId: new Types.ObjectId(stationId) })
      .populate('stationId')
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findLatestByStation(stationId: string): Promise<Measurement | null> {
    return this.measurementModel
      .findOne({ stationId: new Types.ObjectId(stationId) })
      .populate('stationId')
      .sort({ timestamp: -1 })
      .exec();
  }

  async findLatestAllStations(): Promise<Measurement[]> {
    const stations = await this.measurementModel.distinct('stationId');
    const latestMeasurements: Measurement[] = [];
    
    for (const stationId of stations) {
      const latest = await this.measurementModel
        .findOne({ stationId: new Types.ObjectId(stationId.toString()) })
        .populate('stationId')
        .sort({ timestamp: -1 })
        .exec();
      if (latest) {
        latestMeasurements.push(latest);
      }
    }
    
    return latestMeasurements;
  }

  async update(id: string, updateMeasurementDto: any): Promise<Measurement | null> {
    return this.measurementModel.findByIdAndUpdate(id, updateMeasurementDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Measurement | null> {
    return this.measurementModel.findByIdAndDelete(id).exec();
  }

  async getMeasurementsByDateRange(stationId: string, startDate: Date, endDate: Date): Promise<Measurement[]> {
    return this.measurementModel
      .find({
        stationId: new Types.ObjectId(stationId),
        timestamp: { $gte: startDate, $lte: endDate }
      })
      .populate('stationId')
      .sort({ timestamp: 1 })
      .exec();
  }
}
