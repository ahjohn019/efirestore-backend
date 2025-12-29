import { Column, Entity, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { OrderRefunds } from '../entities/order-refunds.entity';
import { BaseEntity } from '../../base/entities/base.entity';
import { Products } from '../../products/entities/products.entity';

@Entity()
export class OrderRefundItems extends BaseEntity {
    @Column()
    order_refund_id: number;

    @Column()
    product_id: number;

    @Column()
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ManyToOne(() => OrderRefunds, (order_refund) => order_refund.order_refund_items)
    @JoinColumn({ name: 'order_refund_id' })
    order_refund: OrderRefunds;

    @OneToOne(() => Products, (product) => product.order_refund_item)
    @JoinColumn({ name: 'product_id' })
    product: Products;
}
