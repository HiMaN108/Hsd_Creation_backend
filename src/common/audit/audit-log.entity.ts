import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
@Index(['userId'])
@Index(['tableName'])
@Index(['entityId'])
@Index(['created_at'])
@Index(['tableName', 'entityId', 'created_at'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ name: 'table_name', type: 'varchar', length: 100 })
  tableName!: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ name: 'before_data', type: 'json', nullable: true })
  beforeData!: Record<string, any> | null;

  @Column({ name: 'after_data', type: 'json', nullable: true })
  afterData!: Record<string, any> | null;

  @Column({ name: 'request_id', type: 'varchar', length: 36, nullable: true })
  requestId!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  created_at!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updated_at!: Date;

  @Exclude({ toPlainOnly: true })
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deleted_at!: Date | null;
}
