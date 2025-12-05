import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'branches' })
export class Branch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name_en', length: 255 })
  nameEn!: string;

  @Column({ name: 'name_kh', length: 255 })
  nameKh!: string;

  @Column({ name: 'name_fr', length: 255 })
  nameFr!: string;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ length: 255 })
  code!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt?: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date;
}
