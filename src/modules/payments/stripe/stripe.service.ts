import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
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
import { BaseStripeService } from './base-stripe.service';
import { Users } from 'src/modules/users/entities/users.entity';
import { UpdateCheckoutStripeDto } from './dto/update-stripe.dto';

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
      const stripeCheckoutFieldData =
        await this.createStripeCheckoutField(createStripeDto);

      const checkoutSession = await this.createStripeCheckout(
        stripeCheckoutFieldData,
      );

      return this.createSuccessResponse(checkoutSession);
    } catch (error) {
      return this.createErrorResponse(error.message);
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

    const { customer_email, ...stripeData } = createStripeDto;

    return {
      ...stripeData,
      customer: user.stripe_users?.stripe_account_id ?? null,
    };
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

      const prepareOrderFields = await this.prepareOrderFields(session);
      await this.ordersService.create(prepareOrderFields);

      return this.createSuccessResponse(session);
    } catch (error) {
      return this.createErrorResponse(error.message);
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
        status: findStripeCheckout.data.status,
      });

      return this.createSuccessResponse(result);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return this.createErrorResponse(error.message);
    }
  }

  async retrieveAllStripeCheckout() {
    try {
      const findStripeCheckouts = await this.stripe.checkout.sessions.list();
      return this.createSuccessResponse(findStripeCheckouts);
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

    const getProductIdList = data.map(
      (item: CheckoutLineItemsStripeDto) => item.price.product,
    );

    const productDetailList = await this.productDetailList(getProductIdList);

    return data.map((item: CheckoutLineItemsStripeDto, index: number) => {
      const { quantity, price, amount_subtotal } = item;
      const { id: productId } = productDetailList[index].data.metadata || {};

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
  ) {
    const {
      id,
      status,
      customer,
      customer_details,
      amount_subtotal,
      amount_total,
    } = checkoutGetData;

    const fetchCustomer = await this.stripe.customers.retrieve(
      String(customer),
    );

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
      status,
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
    };
  }
}
