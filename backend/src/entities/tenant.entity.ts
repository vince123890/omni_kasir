import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 20 })
  tenantCode: string

  @Column({ type: 'enum', enum: ['PT', 'CV', 'UD'] })
  entityType: string

  @Column({ length: 100 })
  name: string

  @Column({ length: 120 })
  fullName: string

  @Column({ length: 20, nullable: true })
  phone: string

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
