import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { CheckoutIdStripeDto } from './dto/checkout-id-stripe.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../../orders/orders.service';
import { UsersService } from '../../users/users.service';
import { CustomerStripeDto } from './dto/customer-stripe.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeUsers } from './entities/stripe.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(StripeUsers)
    private stripeUsersRepository: Repository<StripeUsers>,
  ) {
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

  async createCustomer(customerStripeDto: CustomerStripeDto) {
    const checkUserByEmail = await this.usersService.findByEmail(
      customerStripeDto.email,
    );

    const checkStripeUserExist = await this.stripeUsersRepository.findOne({
      where: { user_id: checkUserByEmail.id },
    });

    if (checkStripeUserExist) {
      throw new NotFoundException('Stripe user already exists.');
    }

    if (!checkUserByEmail) {
      throw new NotFoundException('User not found.');
    }

    const stripeCreateCustomerResponse =
      await this.stripe.customers.create(customerStripeDto);

    const payload = {
      user_id: checkUserByEmail.id,
      stripe_account_id: stripeCreateCustomerResponse.id,
    };

    const response = await this.stripeUsersRepository.save(payload);

    return { status: true, data: response };
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

        const { id, status, customer_details, amount_subtotal, amount_total } =
          checkoutGetData.data;

        const findUserByEmail = await this.usersService.findByEmail(
          customer_details.email,
        );

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
            total_price: item.amount_subtotal,
          };
        });

        const saveOrderPayload = {
          title: 'Order ' + id,
          status: status,
          shipping_address: fullAddress,
          billing_address: fullAddress,
          customer_email: customer_details.email,
          items: orderLineItems,
          subtotal: amount_subtotal,
          grand_total: amount_total,
          admin_id: null,
          created_at: new Date(),
          updated_at: new Date(),
          user_id: findUserByEmail.id ?? null,
          tracking_number: '',
        };

        this.ordersService.create(saveOrderPayload, null);

        console.log('customerEmail', findUserByEmail);

        break;

      default:
        throw new NotFoundException('Event type not found.');
    }
  }
}
