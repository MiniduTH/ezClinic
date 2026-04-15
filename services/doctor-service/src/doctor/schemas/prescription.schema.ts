import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PrescriptionDocument = HydratedDocument<Prescription>;

class Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

@Schema({ timestamps: { createdAt: 'issuedAt' } })
export class Prescription {
  @Prop({ type: String, ref: 'Doctor', required: true })
  doctorId: string;

  @Prop({ required: true })
  patientId: string;

  @Prop()
  patientName: string;

  @Prop()
  appointmentId: string;

  @Prop()
  diagnosis: string;

  @Prop({
    type: [
      { name: String, dosage: String, frequency: String, duration: String },
    ],
    required: true,
  })
  medications: Medication[];

  @Prop()
  notes: string;

  @Prop()
  followUpDate: Date;

  issuedAt?: Date;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
