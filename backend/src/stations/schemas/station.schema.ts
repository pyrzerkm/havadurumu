import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StationDocument = Station & Document;

@Schema({ timestamps: true })
export class Station {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ 
    required: true,
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  })
  location: {
    latitude: number;
    longitude: number;
  };

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  country: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '' })
  description: string;
}

export const StationSchema = SchemaFactory.createForClass(Station);
