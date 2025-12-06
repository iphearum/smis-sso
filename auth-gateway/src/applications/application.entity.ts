import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'applications' })
@Unique(['key'])
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ length: 64 })
  key!: string;

  @Index()
  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'simple-json', default: '[]' })
  defaultRoles!: string[];

  @Column({ type: 'simple-json', default: '[]' })
  defaultPermissions!: string[];
}
