import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
  BadRequestException,
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
      return this.createSuccessResponse(session);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async updateStripeCheckout(updateCheckoutStripeDto: UpdateCheckoutStripeDto) {
    try {
      const { order_id } = updateCheckoutStripeDto;

      const findOrder = await this.ordersService.findOne(order_id);

      const { checkout_stripe_id, user, items } = findOrder.data;

      const findCheckoutStripe = await this.retrieveStripeCheckout({
        checkoutId: checkout_stripe_id,
      });

      if (findCheckoutStripe.data.status !== 'expired') {
        throw new BadRequestException('Order Already Checkout.');
      }

      const stripeLineItems = items.map((item) => ({
        price_data: {
          currency: 'myr',
          product_data: {
            name: item.product.title,
            metadata: {
              id: item.product.id,
            },
          },
          unit_amount: item.unit_price * 100,
        },
        quantity: item.quantity,
      }));

      const payload = {
        payment_method_types: [
          'card',
          'fpx',
        ] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
        line_items: stripeLineItems,
        customer_email: user.email,
        mode: 'payment' as 'payment',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      };

      const result = await this.stripe.checkout.sessions.create(payload);

      const orderUpdate = this.ordersService.updateOrder(order_id, {
        checkout_stripe_id: result.id,
      });

      return this.createSuccessResponse(orderUpdate);
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

    const [fetchCustomerAddress, orderLineItems] = await Promise.all([
      this.customerAddresses(customer as Stripe.Customer),
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
      stripe_sync: 1,
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

        const { data: checkoutData } = await this.retrieveStripeCheckout({
          checkoutId: fetchCheckoutId,
        });
        const saveOrderPayload = await this.prepareOrderFields(checkoutData);

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
