import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Category } from './category.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ unique: true, length: 250 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discount_price: number;

  @Column({ unique: true, length: 100, nullable: true })
  sku: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ nullable: true, length: 500 })
  image_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'uuid' })
  category_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  order_items: OrderItem[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cart_items: CartItem[];
}
