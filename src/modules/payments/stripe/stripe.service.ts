import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import {
  CheckoutIdStripeDto,
  CheckoutLineItemsStripeDto,
} from './dto/checkout-stripe.dto';
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
        relations: ['stripe_users'],
      });

      if (!checkUserByEmail) {
        throw new NotFoundException('User not found.');
      }

      const { stripe_users } = checkUserByEmail;

      const { customer_email, ...newCreateStripeDto } = createStripeDto;

      const createStripeDtoResult = {
        ...newCreateStripeDto,
        customer: stripe_users?.stripe_account_id ?? null,
      };

      const session = await this.createStripeCheckout(createStripeDtoResult);

      return this.createSuccessResponse(session);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Create Stripe Checkout
   * @param createStripeDtoResult
   * @returns
   */
  async createStripeCheckout(createStripeDtoResult: CreateStripeDto) {
    try {
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
  async retrieveStripeCheckout(checkoutIdStripeDto: CheckoutIdStripeDto) {
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
  customerAddresses(customer: Stripe.Customer) {
    const { address, shipping } = customer;

    const { line1, line2, postal_code, city, state, country } = address;

    const {
      line1: shippingLine1,
      line2: shippingLine2,
      postal_code: shippingPostalCode,
      city: shippingCity,
      state: shippingState,
      country: shippingCountry,
    } = shipping.address;

    const fullAddress = `${line1} ${line2} ${postal_code} ${city} ${state} ${country}`;

    const shippingFullAddress = `${shippingLine1} ${shippingLine2} ${shippingPostalCode} ${shippingCity} ${shippingState} ${shippingCountry}`;

    return {
      fullAddress: fullAddress,
      shippingFullAddress: shippingFullAddress,
    };
  }

  /**
   * Fetch Order Items
   * @param id
   * @returns
   */
  async fetchOrderLineItems(id: string) {
    const getLineItems = await this.checkoutGetLineItems({
      checkoutId: id,
    });

    const getProductIdList: string[] = getLineItems.data.data.map(
      (item: CheckoutLineItemsStripeDto) => item.price.product,
    );

    const productDetailList = await this.productDetailList(getProductIdList);

    return getLineItems.data.data.map(
      (item: CheckoutLineItemsStripeDto, index: number) => {
        const { quantity, price, amount_subtotal } = item;

        return {
          unit_price: price.unit_amount,
          quantity,
          product_id: productDetailList[index].data.metadata?.id,
          total_price: amount_subtotal,
        };
      },
    );
  }

  /**
   * Prepare Order Fields
   * @param checkoutGetData
   * @returns
   */
  async prepareOrderFields(
    checkoutGetData: Stripe.Response<Stripe.Checkout.Session>,
  ) {
    const {
      id,
      status,
      customer,
      customer_details,
      amount_subtotal,
      amount_total,
    } = checkoutGetData;

    const fetchCustomerAddress = this.customerAddresses(
      customer as Stripe.Customer,
    );

    const { fullAddress, shippingFullAddress } = fetchCustomerAddress;

    const orderLineItems = await this.fetchOrderLineItems(id);

    const { email } = customer_details;

    const checkUserByEmail = await this.usersRepository.findOne({
      where: { email },
    });

    return {
      title: 'Order ' + (Math.random() + 5).toString(36).substring(2),
      status: status,
      shipping_address: shippingFullAddress,
      billing_address: fullAddress,
      customer_email: email,
      items: orderLineItems,
      subtotal: amount_subtotal,
      grand_total: amount_total,
      admin_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      user_id: checkUserByEmail.id ?? null,
      tracking_number: '',
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

        if (!fetchCheckoutId) {
          throw new NotFoundException('Checkout ID not found.');
        }

        const checkoutGetData = await this.retrieveStripeCheckout({
          checkoutId: fetchCheckoutId,
        });

        const saveOrderPayload = await this.prepareOrderFields(
          checkoutGetData.data,
        );

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
