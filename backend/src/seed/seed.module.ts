import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Station, StationSchema } from '../stations/schemas/station.schema';
import { Measurement, MeasurementSchema } from '../measurements/schemas/measurement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Station.name, schema: StationSchema },
      { name: Measurement.name, schema: MeasurementSchema },
    ]),
  ],
  providers: [SeedService],
  controllers: [SeedController],
  exports: [SeedService],
})
export class SeedModule {}
