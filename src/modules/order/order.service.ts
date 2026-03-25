import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cartService: CartService,
  ) {}

  async placeOrder(userId: string, dto: CreateOrderDto) {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order items and calculate total
    const orderItems: Partial<OrderItem>[] = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const product = await this.productRepository.findOne({
        where: { id: cartItem.product_id },
      });

      if (!product) {
        throw new BadRequestException(
          `Product #${cartItem.product_id} no longer exists`,
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        );
      }

      const price = product.discount_price || product.price;
      const subtotal = Number(price) * cartItem.quantity;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_price: Number(price),
        quantity: cartItem.quantity,
        subtotal,
      });

      totalAmount += subtotal;

      // Deduct stock
      product.stock -= cartItem.quantity;
      await this.productRepository.save(product);
    }

    // Create order
    const order = this.orderRepository.create({
      user_id: userId,
      order_number: orderNumber,
      total_amount: +totalAmount.toFixed(2),
      shipping_address: dto.shipping_address,
      payment_method: dto.payment_method || 'COD',
      notes: dto.notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    for (const item of orderItems) {
      const orderItem = this.orderItemRepository.create({
        ...item,
        order_id: savedOrder.id,
      });
      await this.orderItemRepository.save(orderItem);
    }

    // Clear cart after order
    await this.cartService.clearCart(userId);

    return this.findOne(userId, savedOrder.id);
  }

  async findAllByUser(userId: string, page = 1, limit = 10) {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { user_id: userId },
      relations: ['items'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user_id: userId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    return order;
  }

  // Admin methods
  async findAllOrders(page = 1, limit = 10) {
    const [orders, total] = await this.orderRepository.findAndCount({
      relations: ['items', 'user'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    order.status = dto.status;
    return this.orderRepository.save(order);
  }
}
