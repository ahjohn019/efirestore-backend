import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { CheckoutIdStripeDto } from './dto/checkout-id-stripe.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../../orders/orders.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_PAYMENT_DEV_SECRET_KEY'),
      {
        apiVersion: '2025-01-27.acacia',
      },
    );
  }

  @Inject(OrdersService)
  private readonly ordersService: OrdersService;

  @Inject(UsersService)
  private readonly usersService: UsersService;

  async checkout(createStripeDto: CreateStripeDto) {
    const session = await this.stripe.checkout.sessions.create(createStripeDto);
    return { status: true, data: session };
  }

  async checkoutGet(checkoutIdStripeDto: CheckoutIdStripeDto) {
    const session = await this.stripe.checkout.sessions.retrieve(
      checkoutIdStripeDto.checkoutId,
    );
    return { status: true, data: session };
  }

  async checkoutGetLineItems(checkoutIdStripeDto: CheckoutIdStripeDto) {
    const session = await this.stripe.checkout.sessions.listLineItems(
      checkoutIdStripeDto.checkoutId,
    );
    return { status: true, data: session };
  }

  async fetchProduct(productId: string) {
    const fetchProduct = await this.stripe.products.retrieve(productId);
    return { status: true, data: fetchProduct.metadata };
  }

  async productDetailList(getProductIdList: string[]) {
    const productDetailList = [];

    await Promise.all(
      getProductIdList.map(async (productId: string) => {
        const productMetaData = await this.fetchProduct(productId);
        productDetailList.push(productMetaData);
      }),
    );

    return productDetailList;
  }

  async postWebhook(request: { headers: string; rawBody: Buffer }) {
    const signature = request.headers['stripe-signature'];
    const event = this.stripe.webhooks.constructEvent(
      request.rawBody,
      signature,
      this.configService.get<string>('STRIPE_ENDPOINT_SECRET'),
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const fetchCheckoutId = event.data?.object?.id || null;
        const checkoutSuccessPayload = {
          checkoutId: fetchCheckoutId,
        };
        const checkoutGetData = await this.checkoutGet(checkoutSuccessPayload);

        const { id, status, customer_details } = checkoutGetData.data;

        const { line1, line2, postal_code, city, state, country } =
          customer_details.address;

        const fullAddress = `${line1} ${line2} ${postal_code} ${city} ${state} ${country}`;

        const getLineItems = await this.checkoutGetLineItems({
          checkoutId: checkoutGetData.data.id,
        });

        const getProductIdList: string[] = getLineItems.data.data.map(
          (item) => item.price.product as string,
        );

        const productDetailList =
          await this.productDetailList(getProductIdList);

        const orderLineItems = getLineItems.data.data.map((item, index) => {
          return {
            unit_price: item.price.unit_amount,
            quantity: item.quantity,
            product_id: productDetailList[index].data.id,
            total_price: 0
          };
        });

        const findUserByEmail = await this.usersService.findByEmail(
          customer_details.email,
        );

        const saveOrderPayload = {
          title: 'Order ' + id,
          status: status,
          shipping_address: fullAddress,
          billing_address: fullAddress,
          customer_email: customer_details.email,
          items: orderLineItems,
          subtotal: 0,
          grand_total: 0,
          admin_id: 0,
          created_at: new Date(),
          updated_at: new Date(),
          user_id: findUserByEmail.id,
          tracking_number: '',
        };

        if (!findUserByEmail) {
          throw new NotFoundException('User not found.');
        }

        this.ordersService.create(saveOrderPayload, null);

        console.log('customerEmail', findUserByEmail);

        break;

      default:
        throw new NotFoundException('Event type not found.');
    }
  }
}
