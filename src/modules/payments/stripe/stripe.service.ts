import { getStripeShippingOptions } from './stripe.util';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { CheckoutIdStripeDto } from './dto/checkout-stripe.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../../orders/orders.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseStripeService } from './base-stripe.service';
import { Users } from 'src/modules/users/entities/users.entity';
import { UpdateCheckoutStripeDto } from './dto/update-stripe.dto';
import { UserAddress } from 'src/modules/users/entities/user-address.entity';
import { AddressType } from 'src/enum/address-type.enum';
import { Request as ExpressRequest } from 'express';
import { Session } from 'node:inspector';
import { SubmitOrderShipmentDto } from '../../easyparcel/dto/submit-order.dto';

@Injectable()
export class StripeService extends BaseStripeService {
  constructor(
    protected configService: ConfigService,

    private readonly ordersService: OrdersService,

    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    @InjectRepository(UserAddress)
    private userAddressRepository: Repository<UserAddress>,
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
      const stripeCheckoutFieldData =
        await this.createStripeCheckoutField(createStripeDto);

      const checkoutSession = await this.createStripeCheckout(
        stripeCheckoutFieldData,
        createStripeDto.easyparcel_shipment,
      );

      return this.createSuccessResponse(checkoutSession);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw error;
    }
  }

  async createStripeCheckoutField(createStripeDto: CreateStripeDto) {
    const user = await this.usersRepository.findOne({
      where: { email: createStripeDto.customer_email },
      relations: ['stripe_users'],
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.validateCheckoutAddresses(user.id);

    const { customer_email, easyparcel_shipment, ...stripeData } =
      createStripeDto;

    return {
      ...stripeData,
      customer: user.stripe_users?.stripe_account_id ?? null,
    };
  }

  private async validateCheckoutAddresses(userId: number) {
    const activeAddresses = await this.userAddressRepository.find({
      where: {
        user_id: userId,
        status: true,
        address_type: In([AddressType.BILLING, AddressType.SHIPPING]),
      },
    });

    const hasBillingAddress = activeAddresses.some(
      (address) => address.address_type === AddressType.BILLING,
    );
    const hasShippingAddress = activeAddresses.some(
      (address) => address.address_type === AddressType.SHIPPING,
    );

    if (hasBillingAddress && hasShippingAddress) {
      return;
    }

    const missingAddressTypes = [
      !hasBillingAddress ? AddressType.BILLING : null,
      !hasShippingAddress ? AddressType.SHIPPING : null,
    ].filter(Boolean);

    throw new BadRequestException(
      `Please add an active ${missingAddressTypes.join(
        ' and ',
      )} address before checkout.`,
    );
  }

  /**
   * Create Stripe Checkout
   * @param createStripeDtoResult
   * @returns
   */
  async createStripeCheckout(
    createStripeDtoResult: Omit<
      CreateStripeDto,
      'customer_email' | 'easyparcel_shipment'
    > & { customer: string | null },
    easyparcelShipment?: SubmitOrderShipmentDto[],
  ) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        ...createStripeDtoResult,
        shipping_options: getStripeShippingOptions(),
      });

      const prepareOrderFields = await this.prepareOrderFields(
        session,
        easyparcelShipment,
      );
      await this.ordersService.create(prepareOrderFields);

      return this.createSuccessResponse(session);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update stripe checkout
   * @param updateCheckoutStripeDto
   * @returns
   */
  async updateStripeCheckout(updateCheckoutStripeDto: UpdateCheckoutStripeDto) {
    try {
      const { stripeCheckoutId } = updateCheckoutStripeDto;

      // find the stripe checkout id from stripe
      const findStripeCheckout = await this.retrieveStripeCheckout({
        checkoutId: updateCheckoutStripeDto.stripeCheckoutId,
      });

      // find stripe from db
      const findStripeOrder =
        await this.ordersService.findStripeCheckout(stripeCheckoutId);

      if (!findStripeCheckout) {
        throw new NotFoundException('Stripe not found.');
      }

      if (!findStripeOrder) {
        throw new NotFoundException('Stripe order not found.');
      }

      // update the order based on stripe checkout id
      const result = await this.ordersService.update(findStripeOrder.data.id, {
        status: findStripeCheckout.data.payment_status,
        easyparcel_service_id:
          (await this.getEasyparcelServiceId(findStripeCheckout.data)) ??
          findStripeOrder.data.easyparcel_service_id ??
          null,
      });

      return this.createSuccessResponse(result);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  async retrieveAllStripeCheckout() {
    try {
      const findStripeCheckouts = await this.stripe.checkout.sessions.list();
      return this.createSuccessResponse(findStripeCheckouts);
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  async postWebhook(request: ExpressRequest & { rawBody?: Buffer }) {
    const signature = request.headers['stripe-signature'];

    if (!request.rawBody || !signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing Stripe webhook signature.');
    }

    const event = this.stripe.webhooks.constructEvent(
      request.rawBody,
      signature,
      this.stripeEndpointSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session.id) {
          throw new NotFoundException('Stripe checkout session not found.');
        }

        const order = await this.syncCheckoutSession(session.id);
        return this.createSuccessResponse(order);
      }
      default:
        return this.createSuccessResponse({
          received: true,
          event_type: event.type,
        });
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
      throw error;
    }
  }

  /**
   * Fetch Stripe Product Details List
   * @param getProductIdList
   * @returns
   */
  async productDetailList(getProductIdList: string[]) {
    return Promise.all(
      getProductIdList.map((productId) => this.fetchProduct(productId)),
    );
  }

  /**
   * Fetch Stripe Customer Addresses
   * @param customer
   * @returns
   */
  customerAddresses(customer: Stripe.Customer) {
    const { address, shipping } = customer;

    const formatAddress = ({
      line1,
      line2,
      postal_code,
      city,
      state,
      country,
    }) => `${line1} ${line2} ${postal_code} ${city} ${state} ${country}`;

    const fullAddress = formatAddress(address);
    const shippingFullAddress = formatAddress(shipping.address);

    return {
      fullAddress,
      shippingFullAddress,
    };
  }

  /**
   * Fetch Order Items
   * @param id
   * @returns
   */
  async fetchOrderLineItems(id: string) {
    const {
      data: { data },
    } = await this.checkoutGetLineItems({
      checkoutId: id,
    });

    const getProductIdList = data.map(({ price }) => {
      if (!price) {
        throw new BadRequestException('Stripe line item is missing its price.');
      }

      return typeof price.product === 'string'
        ? price.product
        : price.product.id;
    });

    const productDetailList = await this.productDetailList(getProductIdList);

    return data.map((item, index) => {
      const { quantity, price, amount_subtotal } = item;

      if (!price || price.unit_amount === null || quantity === null) {
        throw new BadRequestException(
          'Stripe line item has incomplete price or quantity data.',
        );
      }

      const productId = Number(productDetailList[index].data.metadata?.id);

      return {
        unit_price: parseFloat((price.unit_amount / 100).toFixed(2)),
        quantity,
        product_id: productId,
        total_price: amount_subtotal,
      };
    });
  }

  /**
   * Prepare Order Fields
   * @param checkoutGetData
   * @returns
   */
  async prepareOrderFields(
    checkoutGetData: Stripe.Response<Stripe.Checkout.Session>,
    easyparcelShipment?: SubmitOrderShipmentDto[],
  ) {
    const {
      id,
      payment_status,
      customer,
      customer_details,
      amount_subtotal,
      amount_total,
    } = checkoutGetData;

    const fetchCustomer =
      typeof customer === 'string'
        ? await this.stripe.customers.retrieve(customer)
        : (customer as Stripe.Customer);

    const [fetchCustomerAddress, orderLineItems] = await Promise.all([
      this.customerAddresses(fetchCustomer as Stripe.Customer),
      this.fetchOrderLineItems(id),
    ]);

    const { fullAddress, shippingFullAddress } = fetchCustomerAddress;

    const { email } = customer_details;

    const checkUserByEmail = await this.usersRepository.findOne({
      where: { email },
    });

    return {
      title: `Order - ${(Math.random() + 5).toString(36).substring(2).toUpperCase()}`,
      status: payment_status,
      shipping_address: shippingFullAddress,
      billing_address: fullAddress,
      customer_email: email,
      items: orderLineItems,
      subtotal: amount_subtotal,
      grand_total: amount_total,
      admin_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      user_id: checkUserByEmail?.id ?? null,
      tracking_number: '',
      checkout_stripe_id: id,
      easyparcel_service_id: await this.getEasyparcelServiceId(checkoutGetData),
    };
  }

  private async getEasyparcelServiceId(
    session: Stripe.Checkout.Session,
  ): Promise<string | null> {
    const shippingRate = session.shipping_cost?.shipping_rate;
    if (!shippingRate) {
      return null;
    }

    const rate =
      typeof shippingRate === 'string'
        ? await this.stripe.shippingRates.retrieve(shippingRate)
        : shippingRate;

    return rate.metadata?.service_id ?? null;
  }

  private async syncCheckoutSession(checkoutId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(checkoutId);
    const prepareOrderFields = await this.prepareOrderFields(session);

    // easy parcel deliver integration

    const findStripeOrder =
      await this.ordersService.findStripeCheckout(checkoutId);

    if (findStripeOrder?.data?.id) {
      await this.ordersService.update(findStripeOrder.data.id, {
        status: session.payment_status,
        easyparcel_service_id:
          prepareOrderFields.easyparcel_service_id ??
          findStripeOrder.data.easyparcel_service_id ??
          null,
      });

      const order = {
        ...findStripeOrder.data,
        status: session.payment_status,
        easyparcel_service_id:
          prepareOrderFields.easyparcel_service_id ??
          findStripeOrder.data.easyparcel_service_id ??
          null,
      };

      return order;
    }

    const createOrder = await this.ordersService.create(prepareOrderFields);
    const order = createOrder.data;

    return order;
  }
}
