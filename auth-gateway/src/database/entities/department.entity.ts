import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'departments' })
export class Department {
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

  @Column({ name: 'is_specialist', default: true })
  isSpecialist!: boolean;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: number;

  @Column({ name: 'school_id' })
  schoolId!: number;

  @Column({ name: 'create_uid' })
  createUid!: number;

  @Column({ name: 'write_uid', nullable: true })
  writeUid?: number;

  @Column({ name: 'is_vocational', default: false })
  isVocational!: boolean;

  @Column({ name: 'order', default: 1 })
  order!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt?: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date;
}
