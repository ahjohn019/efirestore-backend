import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { CheckoutIdStripeDto } from './dto/checkout-id-stripe.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../../orders/orders.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeUsers } from './entities/stripe.entity';
import { BaseStripeService } from './base-stripe.service';
import { Users } from 'src/modules/users/entities/users.entity';

@Injectable()
export class StripeService extends BaseStripeService {
  constructor(
    protected configService: ConfigService,

    @InjectRepository(StripeUsers)
    private stripeUsersRepository: Repository<StripeUsers>,

    private readonly ordersService: OrdersService,

    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {
    super(configService);
  }

  /**
   * Create Stripe Checkout
   * @param createStripeDto
   * @returns
   */
  async checkout(createStripeDto: CreateStripeDto) {
    try {
      const checkUserByEmail = await this.usersRepository.findOne({
        where: { email: createStripeDto.customer_email },
      });

      if (!checkUserByEmail) {
        throw new NotFoundException('User not found.');
      }

      const checkStripeUserExist = await this.stripeUsersRepository.findOne({
        where: { user_id: checkUserByEmail.id },
      });

      const { customer_email, ...newCreateStripeDto } = createStripeDto;

      const createStripeDtoResult = {
        ...newCreateStripeDto,
        customer: checkStripeUserExist?.stripe_account_id ?? null,
      };

      const session = await this.stripe.checkout.sessions.create(
        createStripeDtoResult,
      );

      return this.createSuccessResponse(session);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Get Stripe Checkout Information
   * @param checkoutIdStripeDto
   * @returns
   */
  async checkoutGet(checkoutIdStripeDto: CheckoutIdStripeDto) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(
        checkoutIdStripeDto.checkoutId,
        { expand: ['customer'] },
      );

      return this.createSuccessResponse(session);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Get Stripe Checkout Line Items
   * @param checkoutIdStripeDto
   * @returns
   */
  async checkoutGetLineItems(checkoutIdStripeDto: CheckoutIdStripeDto) {
    try {
      const session = await this.stripe.checkout.sessions.listLineItems(
        checkoutIdStripeDto.checkoutId,
      );
      return this.createSuccessResponse(session);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }

  }

  /**
   * Fetch Stripe Product
   * @param productId
   * @returns
   */
  async fetchProduct(productId: string) {
    try {
      const fetchProduct = await this.stripe.products.retrieve(productId);
      return this.createSuccessResponse(fetchProduct);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Fetch Stripe Product Details List
   * @param getProductIdList
   * @returns
   */
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

  /**
   * Fetch Stripe Customer Addresses
   * @param customer
   * @returns
   */
  async customerAddresses(customer: Stripe.Customer) {
    const { line1, line2, postal_code, city, state, country } =
      customer.address;

    const {
      line1: shippingLine1,
      line2: shippingLine2,
      postal_code: shippingPostalCode,
      city: shippingCity,
      state: shippingState,
      country: shippingCountry,
    } = customer.shipping.address;

    const fullAddress = `${line1} ${line2} ${postal_code} ${city} ${state} ${country}`;

    const shippingFullAddress = `${shippingLine1} ${shippingLine2} ${shippingPostalCode} ${shippingCity} ${shippingState} ${shippingCountry}`;

    return {
      fullAddress: fullAddress,
      shippingFullAddress: shippingFullAddress,
    };
  }

  /**
   * Check if session completed, save the checkout data into order database
   * @param request
   * @returns
   */
  async postWebhook(request: { headers: string; rawBody: Buffer }) {
    const signature = request.headers['stripe-signature'];
    const event = this.stripe.webhooks.constructEvent(
      request.rawBody,
      signature,
      this.stripeEndpointSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const fetchCheckoutId = event.data?.object?.id || null;
        const checkoutSuccessPayload = {
          checkoutId: fetchCheckoutId,
        };
        const checkoutGetData = await this.checkoutGet(checkoutSuccessPayload);

        const {
          id,
          status,
          customer,
          customer_details,
          amount_subtotal,
          amount_total,
        } = checkoutGetData.data;

        const fullAddress = (
          await this.customerAddresses(customer as Stripe.Customer)
        ).fullAddress;

        const shippingFullAddress = (
          await this.customerAddresses(customer as Stripe.Customer)
        ).shippingFullAddress;

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

        const checkUserByEmail = await this.usersRepository.findOne({
          where: { email: customer_details.email },
        });

        const saveOrderPayload = {
          title: 'Order ' + id,
          status: status,
          shipping_address: shippingFullAddress,
          billing_address: fullAddress,
          customer_email: customer_details.email,
          items: orderLineItems,
          subtotal: amount_subtotal,
          grand_total: amount_total,
          admin_id: null,
          created_at: new Date(),
          updated_at: new Date(),
          user_id: checkUserByEmail.id ?? null,
          tracking_number: '',
        };

        const createOrderSuccess = await this.ordersService.create(
          saveOrderPayload,
          null,
        );

        return this.createSuccessResponse(createOrderSuccess);

      default:
        throw new NotFoundException('Event type not found.');
    }
  }
}
