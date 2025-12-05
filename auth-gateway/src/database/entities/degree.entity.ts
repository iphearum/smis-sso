import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'degrees' })
export class Degree {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name_kh', length: 255, nullable: true })
  nameKh?: string;

  @Column({ name: 'name_en', length: 255 })
  nameEn!: string;

  @Column({ name: 'name_fr', length: 255, nullable: true })
  nameFr?: string;

  @Column({ length: 255, nullable: true })
  code?: string;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'school_id' })
  schoolId!: number;

  @Column({ name: 'create_uid' })
  createUid!: number;

  @Column({ name: 'write_uid', nullable: true })
  writeUid?: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt?: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date;
}
