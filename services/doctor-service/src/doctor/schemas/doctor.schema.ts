import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Doctor {
  @Prop({ unique: true, sparse: true })
  auth0Id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  specialization: string;

  @Prop()
  qualification: string;

  @Prop()
  bio: string;

  @Prop({ default: 0 })
  consultationFee: number;

  @Prop({ default: false })
  isVerified: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
