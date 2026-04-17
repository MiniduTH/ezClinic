import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  _id: false,
})
export class Doctor {
  /** Auth0 sub used as the document _id (e.g. "auth0|abc123") */
  @Prop({ type: String, required: true })
  _id: string;

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

  @Prop({ type: [String], default: [] })
  credentialDocuments: string[];

  @Prop({ select: false })
  passwordHash: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
