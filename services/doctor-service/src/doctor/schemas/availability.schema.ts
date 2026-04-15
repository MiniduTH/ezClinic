import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AvailabilityDocument = HydratedDocument<Availability>;

@Schema()
export class Availability {
  @Prop({ type: String, ref: 'Doctor', required: true })
  doctorId: string;

  @Prop({ required: true })
  dayOfWeek: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 1 })
  maxPatients: number;

  @Prop({ default: 'both' })
  consultationType: string;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);

// Prevent double-booking: a doctor cannot have two overlapping slot definitions
// on the same day starting at the same time.
AvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1, startTime: 1 }, { unique: true });
