import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeasurementDocument = Measurement & Document;

@Schema({ timestamps: true })
export class Measurement {
  @Prop({ type: Types.ObjectId, ref: 'Station', required: true })
  stationId: Types.ObjectId;

  @Prop({ required: true })
  temperature: number; // °C

  @Prop({ required: true })
  humidity: number; // %

  @Prop({ required: true })
  windSpeed: number; // km/h

  @Prop({ required: true })
  windDirection: number; // degrees

  @Prop({ required: true })
  pressure: number; // hPa

  @Prop({ required: true })
  uvIndex: number; // 0-11 UV indeksi

  @Prop({ required: true })
  precipitation: number; // mm cinsinden yağış miktarı

  @Prop({ required: true })
  visibility: number; // km cinsinden görüş mesafesi

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: '' })
  notes: string;
}

export const MeasurementSchema = SchemaFactory.createForClass(Measurement);
